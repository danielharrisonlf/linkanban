# CLI Linkanban

CLI em Go com Cobra para operar a API do Fio/Linkanban. O código fica neste
monorepo para que cada alteração da interface e da API possa atualizar o comando
equivalente na mesma revisão. Não é necessário publicar um pacote externo.

## Instalar no computador a partir do projeto local

Requer Go 1.24 ou superior. Na raiz do repositório:

```powershell
cd packages/cli
go install ./cmd/linkanban
linkanban --help
```

`go install` coloca o executável em `GOBIN` ou, por padrão, em `$(go env GOPATH)/bin`.
Esse diretório deve estar no `PATH` para chamar `linkanban` de qualquer pasta.
Após mudar a CLI, execute `go install ./cmd/linkanban` novamente. Para testar sem
instalar, use `go run ./cmd/linkanban --help` dentro de `packages/cli`.

A API precisa estar rodando. O padrão é `http://localhost:3333`; use
`LINKANBAN_API_URL` ou `--api-url` para outro endereço. A CLI acrescenta `/v1`
uma vez. O `health` consulta `/health`.

## Autenticação e configuração

```powershell
linkanban health --json
linkanban config --json
linkanban config set api-url http://localhost:3333
$env:LINKANBAN_BOOTSTRAP_TOKEN = "segredo-de-bootstrap"
linkanban auth bootstrap --json
```

Para APIs protegidas, use `LINKANBAN_TOKEN` ou `--token`. Prefira a variável de
ambiente para evitar guardar tokens no histórico do terminal. `auth bootstrap`
salva o primeiro token no arquivo de configuração local. O caminho padrão vem de
`os.UserConfigDir()/linkanban/config.json`; `LINKANBAN_CONFIG_PATH` permite
escolher outro. A precedência é flag, variável de ambiente, arquivo e padrão.
`config` nunca imprime o token.

## Comandos

| Área | Comandos |
|---|---|
| Sistema | `health`, `config`, `auth bootstrap`, `opcoes`, `resumo`, `dashboard` |
| Candidaturas | `list`, `get`, `create`, `update`, `status`, `archive`, `unarchive`, `delete`, `restore` |
| Empresas | `list`, `create`, `update`, `delete` |
| Follow-ups | `list`, `create`, `update`, `done`, `reopen`, `result`, `delete` |

```powershell
linkanban empresas create --nome "Empresa Exemplo" --tecnologias "Go, .NET" --json
linkanban candidaturas create --vaga-nome "Backend" --empresa-id "<id>" --json
linkanban candidaturas list --status APLICADO --ordenar paradas --pagina 1 --limite 20 --json
linkanban candidaturas status "<id>" ENTREVISTA --json
linkanban followups create --candidatura-id "<id>" --data-prevista "2026-10-01T12:00:00Z" --json
linkanban followups result "<id>" ADIARAM --reagendar-para "2026-10-08T12:00:00Z" --json
```

Comandos de escrita aceitam flags ou `--data '<objeto JSON>'`. Use `--data -`
para ler JSON do stdin ou `--data '@caminho.json'` para ler um arquivo. Flags
explícitas prevalecem sobre o objeto. Para limpar um campo opcional em uma
atualização parcial, envie `null` no JSON, por exemplo
`linkanban candidaturas update <id> --data '{"observacoes":null}'`.
`empresas update` exige `nome`, pois o contrato da API exige o payload completo.
Datas enviadas à API devem incluir horário e fuso, como nos exemplos acima.

Toda operação escreve um envelope JSON por linha em `stdout`. Em falhas, o
envelope vai para `stderr`. Códigos de saída: `0` sucesso, `2` uso ou configuração,
`3` autenticação, `4` rede e `5` falha da API ou resposta inválida. Depois
de timeout em uma escrita, consulte o recurso antes de repetir a operação.

## Desenvolvimento

```powershell
cd packages/cli
go test ./...
go vet ./...
New-Item -ItemType Directory -Force build | Out-Null
go build -o build/linkanban.exe ./cmd/linkanban
```
