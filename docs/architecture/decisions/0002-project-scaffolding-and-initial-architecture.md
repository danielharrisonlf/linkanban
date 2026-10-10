# 2. Scaffolding do projeto e arquitetura inicial

Data: 2026-09-13

## Status

Aceito

## Contexto

Precisamos estabelecer a base inicial do projeto para garantir consistência, escalabilidade e manutenibilidade desde o primeiro dia.

Como trabalhamos principalmente em um **ambiente assíncrono**, documentar e alinhar essas escolhas ajuda a manter o time sincronizado entre fusos e horários de trabalho.

Considerações principais:

- Queremos **segurança de tipos** para reduzir erros em tempo de execução e aumentar a produtividade.
- Queremos um **backend enxuto e de alta performance**, com um framework que o time domine.
- O frontend é uma **SPA (Single Page Application)** que consome a API; não há necessidade de renderização no servidor nem de SEO.
- **Containerização** é necessária para garantir reprodutibilidade entre ambientes local e de produção.
- O repositório está hospedado no **GitHub**, o que torna o **GitHub Actions** a escolha natural para CI/CD.
- Queremos ferramentas **rápidas e simples** para lint, formatação e execução de testes.
- O projeto deve crescer para múltiplos apps; para manter a velocidade de desenvolvimento, preferimos um **monorepo** a gerenciar vários repositórios.
- Precisamos de um orquestrador de monorepo simples, focado no ecossistema JavaScript/TypeScript.

## Decisão

Configuramos o projeto com as seguintes tecnologias:

- **Estrutura de repositório**: monorepo com **pnpm workspaces** (`apps/*` e `packages/*`), permitindo compartilhar configurações e dependências entre apps.
- **Orquestração do monorepo**: **Turborepo** (cache e execução de tarefas com `--affected` no CI).
- **Linguagem**: **TypeScript** em todos os pacotes (tipagem estática e melhor manutenibilidade).
- **Backend**: **Node.js + Fastify**, com **Prisma** como ORM e **PostgreSQL** como banco de dados.
- **Frontend**: **Vite + React 19** com **Tailwind CSS v4**, como SPA client-side que consome a API via HTTP.
- **Lint e formatação**: **Biome** (mais rápido e simples que ESLint + Prettier, com configuração única no repositório).
- **Testes**: o **test runner nativo do Node** (executado via `tsx`) na API e **Vitest** na web (integração nativa com Vite e jsdom).
- **Containerização**: **Docker**, com um Dockerfile por app e alvo `prod`, garantindo reprodutibilidade entre local e produção.
- **CI/CD**: **GitHub Actions**, com verificação de PR e validação do merge na `main`.
- **Commits**: **conventional commits**, validados em CI via commitlint.

## Alternativas consideradas

- **Next.js em vez de Vite + React**:
  - Next.js oferece SSR, SSG e roteamento baseado em arquivos, além de otimizações de imagem e fontes.
  - O produto é um **painel autenticado de uso interno**, no qual SEO e renderização no servidor não agregam valor.
  - Next.js traria um servidor Node adicional para operar em produção, aumentando o custo de infraestrutura e a complexidade do deploy de um app que é essencialmente estático.
  - **Vite** gera um bundle estático que pode ser servido por qualquer servidor de arquivos ou CDN, com build e dev server muito rápidos.
  - **Decisão**: Vite + React 19 como SPA client-side, mantendo a API desacoplada (Fastify) como única fonte de dados.

- **Jest em vez do test runner nativo do Node / Vitest**:
  - Jest é amplamente adotado e tem um ecossistema grande, mas exige configuração extra de transformação para TypeScript e ESM.
  - **Node test runner** (`node --test`) elimina dependências e roda direto via `tsx`, sem configuração de bundler na API.
  - **Vitest** reaproveita a configuração do Vite, entende TypeScript e ESM nativamente e é mais rápido no app web.
  - Manter dois runners é aceitável porque cada um é o padrão natural do seu ecossistema; o custo de padronizar tudo em Jest seria maior.

- **ESLint + Prettier em vez de Biome**:
  - ESLint + Prettier são mais difundidos e têm muito mais plugins e regras.
  - Exigem dois conjuntos de configuração, plugins por framework e são sensivelmente mais lentos.
  - **Biome** executa lint e formatação em uma única ferramenta, com um único arquivo `biome.json` compartilhado por todos os pacotes.

- **Nx em vez de Turborepo**:
  - Nx é mais maduro, com geradores, grafo de dependências avançado e suporte a múltiplos ecossistemas.
  - É mais pesado, com curva de aprendizado maior e configuração mais extensa.
  - Nossos apps são todos JavaScript/TypeScript e usam apenas os scripts definidos em cada `package.json`.
  - **Turborepo** resolve cache de tarefas, `dependsOn` e execução afetada (`--affected`) com um único `turbo.json`.

- **Multi-repo em vez de monorepo**:
  - Separação clara entre apps e serviços.
  - Maior custo de coordenação, versionamento e gerenciamento de dependências, inviável para um time pequeno.

- **REST com Fastify em vez de GraphQL**:
  - GraphQL daria flexibilidade de consulta ao cliente, mas adiciona uma camada de schema, resolver e ferramental que o produto não precisa neste momento.
  - Fastify com rotas REST é mais simples de testar, documentar e evoluir incrementalmente.
  - (Detalhes da organização em camadas da API estão no [ADR 3](0003-api-layered-architecture.md).)

## Consequências

- Uma base bem definida que garante consistência e velocidade entre local, CI e produção.
- O monorepo facilita compartilhar configurações (`@linkanban/config`) e alinhar versões de dependências via catálogo do pnpm, ao custo de maior complexidade de build.
- Turborepo cobre bem o cenário atual; se o projeto adotar tecnologias fora do ecossistema JavaScript no futuro, a escolha pode precisar ser reavaliada (um novo ADR deve substituir este).
- Biome impõe consistência com configuração mínima, mas pode fazer falta o ecossistema de plugins do ESLint/Prettier.
- Dois runners de teste (Node test runner e Vitest) significam dois comandos mentais diferentes, porém cada um segue o padrão natural do seu app.
- Ao escolher Vite em vez de Next.js, abrimos mão de SSR/SSG e de otimizações prontas; qualquer necessidade futura de SEO ou renderização no servidor exigirá um novo ADR.
- Depender do GitHub Actions vincula o CI/CD à infraestrutura do GitHub; trocar de provedor exigiria reconfiguração.
