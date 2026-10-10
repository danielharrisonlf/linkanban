# Fio (Linkanban)

Acompanhe cada candidatura até a resposta — do primeiro envio à proposta.

Registre a vaga em segundos, mova o cartão conforme o processo anda e veja o que
está parado antes de virar silêncio. O produto existe para uma coisa que planilha
não faz bem: **não deixar processo morrer sem resposta**.

Monorepo com pnpm workspaces e Turborepo. O frontend é um SPA em **Vite + React 19**,
e o backend oficial é **ASP.NET Core 10 com Dapper + PostgreSQL**. A interface segue um sistema visual
documentado em [`docs/design/DESIGN.md`](docs/design/DESIGN.md). A identidade (nome,
símbolo, vocabulário e tom) está em [`docs/design/BRAND.md`](docs/design/BRAND.md) e a
especificação do produto em [`docs/design/PRODUCT.md`](docs/design/PRODUCT.md).

## Stack

| Camada | Escolha |
|---|---|
| **Frontend** | Vite 8, React 19, TypeScript, Tailwind CSS v4, TanStack Query, Radix UI, Recharts, dnd-kit |
| **Backend** | ASP.NET Core 10, C#, Dapper, Npgsql, PostgreSQL 17 |
| **CLI & Agente** | Go + Cobra; executável local e instruções em [`packages/cli/README.md`](packages/cli/README.md) |
| **Tooling** | Node 24, .NET SDK 10, pnpm workspaces, Turborepo, Biome, Vitest (web), xUnit (api) |
| **Infra** | Docker multi-stage, Docker Compose, GitHub Actions |

Os componentes seguem a anatomia do **shadcn/ui** (Radix + Tailwind + `cn`), com os tokens
deste projeto no lugar do tema padrão — inclusive a base de gráficos, portada em
`apps/web/src/components/ui/chart.tsx`. `Resumo` e `Quadro` carregam sob demanda
(`React.lazy`), para o Recharts e o dnd-kit não entrarem no bundle inicial.

## Início Rápido com Docker

O fluxo recomendado roda tudo em containers:

```bash
# 1. Crie os arquivos de ambiente a partir dos exemplos
pnpm setup:env

# 2. Suba banco PostgreSQL, API .NET e Web
docker compose up --build
```

- **Web**: <http://localhost:5173>
- **API**: <http://localhost:3333>
- **Swagger / OpenAPI**: <http://localhost:3333/openapi/v1.json>
- **Postgres**: `localhost:5433` (5432 no host costuma estar ocupada)

Para rodar comandos dentro do container sem repetir `docker exec`:

```bash
bin/fio pnpm turbo test
```

## Desenvolvimento Local (Sem Docker)

Requisitos:
- Node.js 24 + pnpm
- .NET SDK 10
- Go 1.24+ para instalar a CLI
- PostgreSQL acessível

```bash
# Instalar dependências do monorepo
pnpm install

# Rodar migrations na API .NET
dotnet run --project apps/api-dotnet/src/Fio.Api -- --migrate

# Iniciar backend .NET
dotnet run --project apps/api-dotnet/src/Fio.Api

# Em outro terminal, iniciar frontend Web
pnpm --filter @fio/web dev
```

## Testes

```bash
# Testes do Frontend (Vitest)
pnpm --filter @fio/web test

# Testes do Backend .NET (xUnit)
dotnet test apps/api-dotnet/Fio.slnx

# Testes da CLI
cd packages/cli
go test ./...
```

Para instalar a CLI no PC a partir deste repositório, execute
`cd packages/cli; go install ./cmd/linkanban`. Veja
[`packages/cli/README.md`](packages/cli/README.md) e
[`docs/agent-api.md`](docs/agent-api.md) para comandos e contrato dos agentes.

## Licença

MIT
