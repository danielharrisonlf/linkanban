# ADR 0006 — CLI Go com Cobra para agentes

Data: 2026-09-23. Status: adotada.

## Contexto

O produto precisa permitir que agentes executem todas as operações da interface
web. Havia duas CLIs Node/Bun com comandos diferentes. A CLI empacotada cobria
apenas leitura e criação de candidaturas e leitura de follow-ups; a skill local
ainda apontava para a CLI legada. Isso tornava o contrato do agente ambíguo.

## Decisão

Manter a CLI no monorepo em `packages/cli` e implementá-la em Go com Cobra. Cobra
fornece grupos de comandos, parsing de flags e ajuda; HTTP, JSON e configuração
usam a biblioteca padrão do Go. Não usar Viper enquanto a configuração estiver
limitada a URL da API e token.

Cada operação usada pela interface web recebe um comando equivalente. Comandos
compostos, como cadastrar uma candidatura em uma empresa nova, usam comandos
sucessivos de empresa e candidatura. A CLI usa a API HTTP como fonte de regras de
negócio, sem importar código do backend nem acessar o banco diretamente.

O executável é instalado a partir do checkout local com
`cd packages/cli; go install ./cmd/linkanban`. O Go coloca o binário em `GOBIN`
ou `GOPATH/bin`; não há publicação remota nesta decisão.

Preservar envelopes JSON, separação entre stdout e stderr, códigos de saída,
precedência de configuração, Bearer token e leitura de JSON pelo stdin. Evitar
repetir argumentos sensíveis em erros. A skill `.agents/skills/linkanban` e sua
cópia distribuível em `skills/linkanban` devem acompanhar os comandos.

Esta ADR substitui a escolha de runtime, pacote npm e Commander da
[ADR 0005](0005-bun-cli-runtime.md). O histórico de benchmarks de CLI Bun/Node
continua como registro das versões anteriores, sem representar a CLI atual.
