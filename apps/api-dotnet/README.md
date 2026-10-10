# Fio API (.NET)

Primeira implementação ASP.NET Core 10 em paralelo à API Bun. Ela usa controllers tradicionais, Npgsql + Dapper e o histórico SQL já existente em `../api/prisma/migrations`; o startup HTTP nunca executa migrations automaticamente.

```powershell
$dotnet = 'C:\Users\daniellima\.dotnet-sdk-10\dotnet.exe'
& $dotnet restore .\Fio.slnx
& $dotnet build .\Fio.slnx --no-restore
& $dotnet test .\Fio.slnx --no-build
& $dotnet run --project .\src\Fio.Api
```

Variáveis de ambiente:

- `DATABASE_URL` (ou `ConnectionStrings__Fio`): PostgreSQL usado pelos endpoints protegidos.
- `LINKANBAN_BOOTSTRAP_TOKEN`: segredo exigido por `POST /v1/auth/bootstrap`.
- `AUTH_DISABLED=true`: desenvolvimento local; ativa aliases sem `/v1` e o usuário local fixo. Nunca use em produção.
- `LINKANBAN_TEST_DATABASE_URL`: reservado para testes de integração opt-in.

Para aplicar explicitamente o histórico SQL legado, sem `EnsureCreated` nem EF migrations:

```powershell
& $dotnet run --project .\src\Fio.Api -- --migrate
```

O migrador nunca roda no startup HTTP. Ele usa o ledger compartilhado
`linkanban_migrations` (inclusive adoções de `_prisma_migrations`) e valida
ordem, lacunas e checksum antes de executar SQL. `LINKANBAN_MIGRATIONS_DIRECTORY`
permite apontar para outro catálogo; sem ela, o binário usa `./migrations` quando
empacotado ou o catálogo irmão `../api/prisma/migrations` no desenvolvimento.

O `Dockerfile` usa o contexto da raiz do repositório. A imagem de produção contém
somente o runtime, app publicada e o catálogo SQL; não monta SDK nem source. Para
executar migrations, faça isso como uma etapa explícita antes de iniciar a API:

```powershell
docker build -f apps/api-dotnet/Dockerfile -t linkanban-api-dotnet .
docker run --rm --env-file .env linkanban-api-dotnet --migrate
docker run --rm -p 3333:3333 --env-file .env linkanban-api-dotnet
```

O alvo `development` mantém o SDK para o Compose/local montar o source:

```powershell
docker build --target development -f apps/api-dotnet/Dockerfile -t linkanban-api-dotnet-dev .
```

Rotas: `/health`, `/v1/auth/bootstrap`, `/v1/empresas`, `/v1/opcoes`, `/v1/candidaturas`, `/v1/followups`, `/v1/resumo` e `/v1/dashboard`. A lista de candidaturas aceita `pagina` e `limite` opcionais (`limite` entre 1 e 100); sem esses parâmetros, preserva a resposta completa legada. O documento OpenAPI nativo fica em `/openapi/v1.json`.
