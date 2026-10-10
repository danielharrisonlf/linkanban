# ADR 0004 — Bun, Elysia estável e Drizzle em camadas

Data: 2026-09-15. Status: aceita para implementação; substitui as escolhas de
runtime, transporte e ORM das ADRs 0002/0003, não suas fronteiras de camadas.

## Decisão

O pin de Bun e a escolha de runtime da CLI abaixo foram posteriormente
substituídos pela [ADR 0005](0005-bun-cli-runtime.md). O restante permanece válido.

API em Bun 1.3.14, Elysia 1.4.30 estável, Drizzle ORM 0.45.2 e pool `pg`.
Não adotar Elysia 2 beta. A série 1.4 é estável, não uma promessa de LTS.
Web, CLI e tooling continuam em Node 24/pnpm/Turborepo; clientes acessam REST,
não importam o ORM nem dependem de Bun para executar a CLI.

`routes → services → repositories → db`. Rotas traduzem HTTP e chamam serviços;
serviços validam com Zod e aplicam regras; repositories concentram filtros,
joins, transações e escopo do usuário autenticado. `db/schema.ts` é a fonte do schema
Drizzle; `db/client.ts` mantém um pool por processo. Encerramento fecha pool e servidor.

## Compatibilidade

Preservar nomes SQL, IDs TEXT, TIMESTAMP(3), enums, constraints compostas e dados.
Preservar rotas `/v1`, Bearer, segredo separado de bootstrap, códigos/status,
relações e formatos consumidos pelo web/CLI. `/health` e preflight são públicos;
aliases legados somente em modo local explícito. Não corrigir regras de produto
incidentalmente à troca de infraestrutura.

## Migrations e adoção

Manter `prisma/migrations/*/migration.sql` imutáveis como histórico legado;
`schema.prisma` permanece somente como referência histórica. Nenhum Prisma Client
é gerado ou usado. `scripts/migrate.ts` é o runner transacional do projeto.

Ele verifica checksums (aceitando somente diferenças de CRLF/LF), falhas não
resolvidas, nomes desconhecidos e lacunas de `_prisma_migrations`. Confere colunas,
enums, constraints e índices do prefixo aplicado contra um schema de referência
temporário, removido por rollback de savepoint. Exige permissão de CREATE SCHEMA.
Schema sem histórico verificável ou com drift exige reconciliação manual explícita;
nunca se presume que uma tabela existente corresponde à migration.

Aplica somente SQL pendente, preservando backfills. Lock advisory em conexão
dedicada serializa execuções; DDL e ledger `linkanban_migrations` ficam na mesma
transação por arquivo. Uma migration posterior pode usar valores de enum criados
pela anterior; falhas são retomadas a partir do último arquivo concluído.
`_prisma_migrations` é mantida como evidência, não é sobrescrita.
Somente schema/search_path `public` é suportado nesta migração; URLs Prisma com
`?schema=` diferente são rejeitadas antes de qualquer DDL, não ignoradas.

O primeiro snapshot/SQL Drizzle representa o schema final legado: seu tag e
checksum estão em `drizzle/baseline.json`. O runner registra esse baseline sem
executar seu CREATE TABLE, após conferir/aplicar o legado. Não editar o baseline.
Novas alterações: editar schema, executar `db:generate`, revisar SQL/snapshot,
aplicar `db:deploy`. Não usar `drizzle-kit push` nem migrator nativo em paralelo.
Após migrations Drizzle posteriores ao baseline, a checagem de drift do schema
legado deixa de se aplicar; checksums e ordem continuam obrigatórios.

## Ganhos e custos

Bun executa TypeScript e testes diretamente; Elysia reduz adaptação ao runtime;
Drizzle mantém SQL e tipos próximos sem gerar cliente. Pool `pg` é uma escolha
conservadora de driver, não uma alegação de ser o mais rápido.

Não prometer multiplicadores de performance: latência de PostgreSQL, índices,
joins e tamanho de resposta podem dominar. Comparar p50/p95, throughput, CPU e
RSS no mesmo ambiente com dados realistas antes de atribuir ganhos à migração.
Custos: mudança de runtime, ecossistema menor, monitoramento de compatibilidade
e responsabilidade adicional por migrations e consultas explícitas.

## Verificação

`bun test` executa unidade e testes do runner. Integração exige
`LINKANBAN_TEST_DATABASE_URL` apontando exclusivamente para banco descartável;
sem essa variável, integração é pulada explicitamente. O runner testa bancos
temporários criados por ele (usuário de teste precisa CREATE DATABASE).
CI fornece PostgreSQL isolado, aplica migrations e executa testes. Verificar
também build completo, inicialização real em Bun e imagem Docker.

Deploy continua independente: SPA estático e API em container + PostgreSQL.
Não houve publicação npm, deploy ou commit autorizado nesta migração.
