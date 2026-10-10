# ADR 0005 — Bun atualizado e CLI Bun-native

Data: 2026-09-15. Status: escolha da CLI substituída pela [ADR 0006](0006-go-cobra-agent-cli.md).

## Decisão

Atualizar Bun para a latest estável disponível hoje, 1.4.2, e usar o mesmo runtime
na API e CLI. Fixar a versão efetivamente verificada em `.bun-version`, CI e
imagens Docker, em vez de tags flutuantes. Atualizações seguintes passam por
`bun upgrade`, atualização dos pins e execução dos testes.

Esta decisão substitui apenas o pin Bun 1.3.14 e a escolha de CLI em Node da
ADR 0004. Web/tooling seguem em Node 24 com pnpm/Turborepo. Não introduzir segundo
lockfile nem trocar o gerenciador do monorepo incidentalmente.

## CLI

Manter Commander 15 para parsing e ajuda: o framework já está integrado aos
contratos da CLI, e trocar o parser não é requisito de adotar Bun.
Desenvolvimento e testes executam TypeScript diretamente com Bun; o build produz
bundle ESM com `target=bun` e declarações TypeScript para os exports públicos.
Entrada executável usa shebang Bun e `import.meta.main`, sem executar comandos
quando importada como biblioteca. Não carregar dependências do workspace.

Separar duas distribuições:

- Pacote npm portátil: bundle/declarations; exige Bun instalado. Usar
  `bunx --bun linkanban` depois de publicado ou instalar tarball local.
- Executável standalone: build `--compile` para plataforma/arquitetura explícita,
  com runtime embutido. Não colocar somente um binário Windows dentro do pacote
  npm genérico nem publicar artefatos nesta implementação.

stdout é dado estruturado, stderr é falha/diagnóstico, exit codes permanecem
estáveis. Preservar leitura de JSON no stdin, precedência de configuração,
Bearer, normalização `/v1` e redaction de credenciais, inclusive flags `=valor`
e argumentos de `config set token` em mensagens de erro.
Para erros de parsing, usar mensagem genérica; metadados de falha registram
somente caminhos de comandos conhecidos, nunca os argumentos completos. Isso
evita vazamentos com flags intercaladas ou credenciais que começam por `--`.

## Consequências de distribuição

O standalone Windows verificado tem aproximadamente 82,2 MiB por incluir o
runtime. É uma alternativa de instalação sem Bun, não uma promessa de binário
pequeno. O pacote npm entrega bundles e declarações, sem esse executável.

## Aceite

Testes, typecheck e build da CLI em Bun latest; ajuda e exit codes pela fonte,
bundle e executável local. Importar exports não executa CLI. Empacotar e executar
tarball fora do workspace, sem publicação remota. Revalidar API em Bun latest
com PostgreSQL descartável, builds e imagem Docker. Nenhum ganho de performance
é afirmado sem benchmark.

Referências: [instalação/upgrade](https://bun.sh/docs/installation),
[executáveis standalone](https://bun.sh/docs/bundler/executables).
