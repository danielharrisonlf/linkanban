# @fio/web

SPA em Vite + React 19 que consome a API do Fio.

Este app faz parte de um monorepo. Instalação, comandos e contexto do projeto estão no
[README da raiz](../../README.md); o sistema visual está em
[`docs/design/DESIGN.md`](../../docs/design/DESIGN.md).

## Dentro do app

```
src/
  components/ui/       primitivas (button, input, select, dialog, badge, feedback, ...)
  components/layout/   shell: Sidebar, Topbar, PageHeader, ErrorBoundary, nav.ts
  pages/               Dashboard, Kanban (Pipeline), Candidaturas, Empresas, Followups
  services/            chamadas de API por recurso
  lib/                 api (axios), query-keys, utils de formatação, errors
  types/               tipos compartilhados com a API
```

Comandos úteis a partir da raiz do monorepo:

```bash
pnpm --filter @fio/web dev     # Vite em http://localhost:5173 (proxy /api → 3333)
pnpm --filter @fio/web build   # tsc -b + vite build → dist/
pnpm --filter @fio/web test    # Vitest
```

Em desenvolvimento o Vite faz proxy de `/api` para a API, então não há CORS envolvido.
Para apontar para outra API, defina `VITE_API_URL` em `apps/web/.env`.
