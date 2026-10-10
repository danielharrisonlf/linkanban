# Contrato da CLI para agentes

A CLI Go em `packages/cli` é a interface operacional dos agentes. Ela cobre as
operações da interface web por meio da mesma API HTTP. Instale o executável local
com `cd packages/cli; go install ./cmd/linkanban` e consulte `linkanban --help`.

Use `--json` em automações. Um sucesso escreve um envelope JSON em `stdout`:

```json
{"schema_version":"1","data":{},"meta":{"command":"linkanban empresas list","status":200}}
```

Uma falha escreve um envelope em `stderr`, sem repetir argumentos ou tokens:

```json
{"schema_version":"1","data":null,"error":{"code":"authentication_error","message":"A API retornou HTTP 401."},"meta":{"command":"linkanban empresas list","status":401}}
```

Códigos de saída: `0` sucesso; `2` uso, validação ou configuração; `3`
autenticação; `4` rede; `5` falha HTTP ou resposta inválida. Em uma escrita que
falhar por timeout, consulte o estado antes de repetir.

Configuração, em ordem de precedência: `--api-url`/`--token`,
`LINKANBAN_API_URL`/`LINKANBAN_TOKEN`, arquivo local, defaults. O padrão da API é
`http://localhost:3333`. `LINKANBAN_CONFIG_PATH` define o arquivo local. Evite
passar tokens como argumento do processo; prefira variáveis de ambiente.

## Cobertura da interface

| Ação da interface | Comando |
|---|---|
| Ver resumo | `linkanban resumo --json` |
| Listar ou filtrar candidaturas | `linkanban candidaturas list [--busca ...] [--status ...] [--ordenar ...] [--pagina N] [--limite N] --json` |
| Ver candidatura | `linkanban candidaturas get <id> --json` |
| Criar, editar ou excluir candidatura | `linkanban candidaturas create/update/delete ... --json` |
| Mudar etapa | `linkanban candidaturas status <id> <STATUS> --json` |
| Arquivar ou reativar | `linkanban candidaturas archive/unarchive <id> --json` |
| Desfazer exclusão | `linkanban candidaturas restore --data '@candidatura.json' --json` |
| Listar, criar, editar ou excluir empresa | `linkanban empresas list/create/update/delete ... --json` |
| Listar, criar, editar ou excluir follow-up | `linkanban followups list/create/update/delete ... --json` |
| Marcar como feito ou reabrir | `linkanban followups done/reopen <id> --json` |
| Registrar resultado de contato | `linkanban followups result <id> <RESULTADO> --json` |
| Ver origens sugeridas | `linkanban opcoes --json` |

Para ações compostas, use comandos consecutivos. Por exemplo, para cadastrar uma
candidatura de uma empresa nova: `empresas list`, `empresas create` se necessário,
e `candidaturas create` com o ID retornado. Confira IDs e resultados antes de
atualizar ou excluir. Os valores de resultado são `RESPONDERAM`, `SEM_RESPOSTA`,
`ADIARAM` e `ENCERRARAM`.

Todos os comandos de escrita aceitam `--data` com um objeto JSON, `-` para stdin
ou `@arquivo.json`; flags prevalecem sobre o JSON. `--data` permite limpar campos
opcionais com `null`. Consulte [README da CLI](../packages/cli/README.md) para
instalação, exemplos e configuração.
