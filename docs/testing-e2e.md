# Testes End-to-End (E2E) com Playwright no Linkanban

Este documento descreve a arquitetura, convenções e comandos para execução e desenvolvimento dos testes E2E do frontend web do Linkanban.

---

## 🏗️ 1. Arquitetura e Estrutura

Os testes estão organizados seguindo as melhores práticas do Playwright e do ecossistema moderno de testes:

```text
linkanban/
├── playwright.config.ts        # Configuração global (browsers, timeouts, webServer, repórteres)
├── tests/
│   ├── auth.setup.ts          # Setup de autenticação e persistência de storageState
│   ├── e2e/                   # Suítes de testes categorizadas por domínio e tags
│   │   ├── smoke.spec.ts          # @smoke - Inicialização, sanidade e carregamento básico
│   │   ├── navigation.spec.ts     # @navigation - Roteamento, histórico, 404 e atalhos
│   │   ├── empresas.spec.ts       # @critical - CRUD completo de empresas e validações
│   │   ├── candidaturas.spec.ts   # @critical - Registro, busca, filtros, arquivamento e restauração
│   │   ├── followups.spec.ts      # @critical - Listagem por urgência e registro de resultados
│   │   ├── quadro.spec.ts         # @critical - Colunas e cartões do Kanban
│   │   ├── responsive.spec.ts     # @responsive - Menu hambúrguer e navegação mobile
│   │   ├── accessibility.spec.ts  # @a11y - Landmarks, skip link e navegação por teclado
│   │   └── auth.spec.ts           # @auth - Tratamento de 401 e headers de autorização
│   ├── pages/                 # Page Objects (abstrações semânticas reutilizáveis)
│   │   ├── BasePage.ts            # Shell da aplicação (topbar, navegação, toasts, modal base)
│   │   ├── ResumoPage.ts          # Métricas, funil e cartões do Dashboard
│   │   ├── CandidaturasPage.ts    # Listagem, busca, filtros e diálogos de candidatura
│   │   ├── EmpresasPage.ts        # Listagem, busca e formulário de empresas
│   │   ├── FollowupsPage.ts       # Acompanhamento de cobranças e registro de desfecho
│   │   └── QuadroPage.ts          # Colunas e cartões do Kanban
│   ├── fixtures/              # Fixtures customizadas do Playwright (test.extend)
│   │   └── test.ts                # Injeção automática de Page Objects e mock isolado
│   ├── helpers/               # Utilitários e mocks de alta fidelidade
│   │   ├── api-mock.ts            # Mock in-memory do backend para execução local independente
│   │   └── test-helpers.ts        # Geradores de dados únicos e datas
│   └── data/                  # Massas de dados e fixtures estáticas
│       └── seed-data.ts           # Dados iniciais determinísticos (empresas, candidaturas, follow-ups)
```

---

## 🚀 2. Como Executar Localmente

### Instalação das dependências e navegadores
```bash
# Instalar dependências
pnpm install

# Instalar os navegadores do Playwright (Chromium, Firefox, WebKit)
pnpm exec playwright install chromium firefox webkit
```

### Comandos de Teste
| Comando | Descrição |
| :--- | :--- |
| `pnpm test:e2e` | Executa todos os testes E2E em modo headless |
| `pnpm test:e2e:ui` | Abre a interface interativa do Playwright (**UI Mode**) com timeline e inspeção |
| `pnpm test:e2e:headed` | Executa os testes abrindo a janela do navegador |
| `pnpm test:e2e:debug` | Executa passo a passo com o Playwright Inspector |
| `pnpm test:e2e:smoke` | Executa apenas os testes marcados com a tag `@smoke` |
| `pnpm test:e2e:chromium` | Executa a suíte apenas no navegador Chromium |
| `pnpm test:e2e:report` | Abre o relatório HTML da última execução |

---

## 🏷️ 3. Organização por Tags

Os testes utilizam tags no padrão `@tag` para permitir execuções direcionadas:

- `@smoke`: Testes rápidos de sanidade e inicialização.
- `@critical`: Fluxos vitais da aplicação (criação de vagas, empresas, follow-ups, kanban).
- `@navigation`: Roteamento e atalhos de teclado.
- `@responsive`: Comportamento em viewports mobile (Pixel 5, iPhone 13).
- `@a11y`: Acessibilidade semântica, foco e landmarks.
- `@auth`: Validação de autorização e tratamento de erros de credenciais.

Exemplo de execução por tag:
```bash
pnpm exec playwright test --grep @critical
```

---

## 🎯 4. Convenções de Seletores

Seguindo as recomendações oficiais do Playwright e acessibilidade web:

1. **Prioridade Máxima**: `getByRole('button', { name: '...' })`, `getByRole('heading')`, `getByRole('link')`.
2. **Campos de Formulário**: `getByLabel('...')` ou `getByPlaceholder('...')`.
3. **Textos e Notificações**: `getByText('...')`.
4. **Evitar a todo custo**: Seletores CSS complexos (`div > div:nth-child(2)`), XPath ou classes do Tailwind (`.bg-surface-raised`).

---

## 🔄 5. Web Server Automático

O arquivo `playwright.config.ts` está configurado para inicializar automaticamente o servidor Vite em `http://localhost:5173` caso ele ainda não esteja em execução:

```ts
webServer: {
  command: `pnpm --filter @fio/web dev --port 5173`,
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  timeout: 60_000,
}
```

---

## 🛡️ 6. Execução em CI (GitHub Actions)

No pipeline de CI, os testes são executados com:
- `forbidOnly: true` (falha se houver `.only` esquecido no código);
- `retries: 2` (para resiliência contra variações transitórias de I/O);
- Coleta automática de artefatos em caso de falha (`trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`);
- Upload dos relatórios (`playwright-report/` e `test-results/`).
