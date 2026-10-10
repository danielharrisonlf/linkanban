# 3. Arquitetura em camadas da API

Data: 2026-09-13

## Status

Aceito quanto às fronteiras de camadas. Escolhas de Fastify/Prisma e exemplos de
runtime substituídos pela [ADR 0004](0004-bun-elysia-drizzle.md).

## Contexto

A API (`apps/api`) expõe os recursos de empresas, candidaturas, follow-ups e dashboard para a SPA em `apps/web`. Precisamos definir como o código é organizado internamente para que seja possível:

- Evoluir regras de negócio sem tocar em detalhes de HTTP.
- Trocar ou ajustar o acesso a dados sem reescrever regras.
- Testar cada parte de forma isolada, já que os testes da API rodam com o test runner nativo do Node via `tsx`.
- Manter o projeto legível para quem chega depois, com um padrão previsível de nomes e responsabilidades.

O framework escolhido foi o **Fastify**, cujo modelo é baseado em plugins: cada arquivo de rotas é uma função `async` que recebe a instância `FastifyInstance` e registra handlers.

## Decisão

Organizamos o código da API em camadas, com um arquivo por entidade e por responsabilidade:

```
apps/api/src/
├── server.ts                 # bootstrap: cria o Fastify, registra CORS e os plugins de rota
├── lib/
│   └── prisma.ts             # instância única do PrismaClient
├── routes/
│   ├── empresa.routes.ts
│   ├── candidatura.routes.ts
│   ├── followup.routes.ts
│   └── dashboard.routes.ts
├── services/
│   ├── empresa.service.ts
│   ├── candidatura.service.ts
│   ├── followup.service.ts
│   └── dashboard.service.ts
└── repositories/
    ├── empresa.repository.ts
    ├── candidatura.repository.ts
    └── followup.repository.ts
```

Responsabilidades de cada camada:

- **`routes/`** — camada HTTP. Cada arquivo exporta um plugin Fastify (`export async function candidaturaRoutes(app: FastifyInstance)`) que declara método e caminho (`GET /candidaturas`, `POST /candidaturas`, `PUT /candidaturas/:id`, `DELETE /candidaturas/:id`, `PATCH /candidaturas/:id/status`). O handler extrai `request.params`/`request.body`, delega para o service correspondente e traduz o resultado em resposta HTTP: `201` na criação, `204` na remoção, `400` com `{ error: err.message }` quando a validação ou a persistência falha. Nenhum handler conhece Prisma.
- **`services/`** — camada de regras de negócio. Cada service exporta schemas **Zod** (`createCandidaturaSchema`, `updateCandidaturaSchema`, `updateStatusSchema`, `createEmpresaSchema`, `createFollowupSchema`, `updateFollowupSchema`) e funções que validam e normalizam a entrada antes de chamar o repositório: conversão de `data_aplicacao` de string ISO para `Date`, montagem de relações (`empresa: { connect: { id: empresa_id } }`, `candidatura: { connect: { id: candidatura_id } }`) e derivação de dados (o `dashboard.service` agrega contagens por status e calcula a taxa de conversão). O body chega como `unknown` e só se torna tipado depois do `parse` do Zod.
- **`repositories/`** — camada de acesso a dados. Cada repositório importa o cliente de `../lib/prisma` e concentra as chamadas ao Prisma, incluindo os `include`/`orderBy` de cada consulta (`include: { empresa: true }`, `include: { candidatura: { include: { empresa: true } } }`, `orderBy: { created_at: 'desc' }`). As funções são exportadas de forma nomeada (`findAllCandidaturas`, `createCandidatura`, `updateStatusCandidatura`, …), sem classes.
- **`lib/prisma.ts`** — ponto único de criação do cliente (`export const prisma = new PrismaClient()`), garantindo **uma instância por processo** e evitando múltiplas conexões. Apenas os repositórios importam esse módulo (ver exceção abaixo).

**Direção das dependências**: `routes → services → repositories → prisma`. As setas apontam sempre para dentro/para baixo. Uma camada nunca importa a de cima — repositórios não conhecem services nem rotas, e services não conhecem Fastify (`request`/`reply` não aparecem em `services/`). Essa direção única é o que permite testar services sem HTTP e repositórios sem servidor.

**Injeção de dependências**: os plugins de rota recebem a instância do Fastify por parâmetro (`app: FastifyInstance`), e é `server.ts` quem decide quais plugins são registrados (`app.register(empresaRoutes)` e assim por diante). O cliente Prisma é resolvido por importação do singleton em `lib/prisma.ts` quando isso é suficiente — o objetivo é que ele nunca seja instanciado fora desse arquivo, nem importado diretamente por rotas ou services. Se no futuro precisarmos substituir o cliente em testes ou compartilhar uma conexão por requisição, a evolução natural é injetá-lo (parâmetro de fábrica ou `app.decorate`) em vez de importar ad hoc.

**Exceções conhecidas** (registradas aqui para não virarem padrão silencioso):

- `services/dashboard.service.ts` importa o cliente de `lib/prisma` diretamente e usa `count()` e `groupBy()`. É uma leitura agregada, sem entidade própria, e por isso não foi criado um `dashboard.repository.ts`. Caso a lógica de dashboard cresça ou passe a escrever dados, um repositório deve ser extraído e este ADR atualizado por um novo.
- A validação com Zod vive nos **services**, não nas rotas. As rotas permanecem finas e os schemas ficam próximos das regras que protegem. Se a validação passar a ser compartilhada com o frontend ou precisar de serialização por JSON Schema, o assunto deve ser reavaliado em um novo ADR.
- O tratamento de erro nas rotas é genérico (`try/catch` convertendo qualquer falha em `400`). Um mapeamento de erros por tipo (validação, não encontrado, conflito) é uma melhoria esperada, não uma decisão tomada.

**Convenções de nomes**: um arquivo por entidade e por camada, no formato `<entidade>.<camada>.ts`, com exportações nomeadas e funções em `camelCase` no imperativo (`listCandidaturas`, `createEmpresa`, `updateStatus`). Nada de classes ou contêineres de DI.

## Alternativas consideradas

- **Acesso direto ao Prisma dentro dos handlers de rota** (sem services nem repositórios):
  - Menos arquivos e menos indireção para um projeto pequeno.
  - Mistura HTTP, regra de negócio e persistência no mesmo lugar, impede teste unitário das regras e faz qualquer mudança de schema vazar para as rotas.
  - Quando surgiu a necessidade de normalizar datas e montar relações, o volume de regra justificou as camadas.

- **Controllers em classes no estilo NestJS**:
  - Padrão conhecido, com decorators e injeção de dependência pronta.
  - Exigiria adotar NestJS e `reflect-metadata`, contrariando a escolha por Fastify (ver [ADR 2](0002-project-scaffolding-and-initial-architecture.md)).
  - No Fastify, funções de plugin são a forma idiomática; classes adicionariam cerimônia sem ganho.

- **Validação de entrada nas rotas com JSON Schema do Fastify** (em vez de Zod nos services):
  - O Fastify valida e serializa nativamente, com ganho de performance e `400` automático.
  - Dividiria o conhecimento da forma dos dados entre rotas (schema) e services (tipos), e não reaproveitaria tipos TypeScript derivados do schema.
  - Zod mantém validação e tipagem no mesmo lugar e é reutilizável fora do HTTP.

- **Repositórios como classes com interfaces e contêiner de DI**:
  - Facilitaria substituir implementações (ex.: um repositório em memória nos testes).
  - Adiciona abstração e boilerplate que ainda não se pagam, dado que existe um único banco (PostgreSQL).
  - Funções nomeadas são triviais de mockar com o recurso de mock do test runner do Node.

- **GraphQL em vez de rotas REST**:
  - Daria ao cliente flexibilidade para escolher os campos.
  - A SPA consome um conjunto pequeno e conhecido de recursos; o custo de schema, resolvers e ferramental não se justifica.

## Consequências

- As regras de negócio ficam testáveis sem subir HTTP nem banco, o que combina com o runner de testes nativo do Node usado na API.
- Uma mudança de schema do Prisma fica contida em `repositories/` (e nos mapeamentos dos services), sem reescrever handlers.
- O caminho de leitura do código é previsível: rota → service → repositório.
- Há mais arquivos e um salto de indireção para operações simples; em contrapartida, cada arquivo tem um motivo claro para existir.
- As exceções (`dashboard.service` falando direto com o Prisma e o tratamento de erro genérico nas rotas) precisam ser vigiadas em revisão de código para não se multiplicarem; qualquer mudança estrutural relevante deve gerar um novo ADR que substitua este.
