# Fio — sistema visual Signal Desk

Superfície: aplicação de uso contínuo, modo **Operate**. O Fio transforma candidaturas em sinais
legíveis: etapa, tempo parado e próxima ação aparecem juntos para a pessoa decidir o que fazer.
O modo escuro continua sendo a identidade principal. O modo claro é uma variação completa para
ambientes muito iluminados, acionada pelo toggle no topo e persistida no navegador.

## Direção

O Signal Desk combina superfícies de estação de trabalho, tinta azul-petróleo e sinais de etapa.
No escuro, a interface tem presença de console: contraste alto, grafite e verde-elétrico. No
claro, a mesma gramática vira um desk técnico: papel frio, tinta profunda e teal controlado.
A tecnologia aparece na precisão do grid, nos metadados, na densidade de listas e nos estados —
nunca em neon, vidro ou sombras sem função.

## Temas e tokens

Os componentes usam tokens semânticos em `apps/web/src/index.css`. O `@theme` define o modo escuro
default; `:root[data-theme="light"]` sobrescreve os mesmos papéis. Não crie cores por página.

### Superfícies e fios

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `surface-base` | `#090D12` | `#F4F8F9` | fundo da aplicação |
| `surface-raised` | `#0F151C` | `#FFFFFF` | painéis e leitura |
| `surface-sunken` | `#06090D` | `#E9F0F2` | campos e áreas de baixa ênfase |
| `surface-hover` | `#151E27` | `#E4EDEF` | hover de item e controle |
| `surface-overlay` | `#121A23` | `#FFFFFF` | diálogos, menus e popovers |
| `scrim` | `#000000` | `#132B33` | camada de foco sobre o conteúdo |
| `line-subtle` | `#1A2732` | `#DBE5E8` | divisória de lista |
| `line` | `#293845` | `#C5D3D8` | contorno de controle |
| `line-strong` | `#405565` | `#96AEB6` | hover, arraste e contraste secundário |

### Tinta e ação

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `ink-primary` | `#EEF5F4` | `#132B33` | títulos, nomes e valores |
| `ink-secondary` | `#A7B8C0` | `#425A62` | contexto e rótulos |
| `ink-tertiary` | `#718590` | `#4F6871` | meta, placeholder e eixo |
| `accent` | `#55DFB1` | `#056D63` | ação, seleção e foco |
| `accent-strong` | `#7AF4C9` | `#04564D` | hover e ação pressionada |
| `accent-weak` | `#102E2A` | `#D9F3ED` | navegação atual e sinal contextual |
| `accent-ink` | `#061310` | `#FFFFFF` | texto do botão primário |

### Etapas

As etapas têm uma paleta própria por tema para manter contraste em chips, barras e listas. O ponto
é reforço visual; o rótulo escrito continua sendo obrigatório.

| Etapa | Escuro | Claro |
|---|---|---|
| Enviei | `#69B9FF` | `#1F6E9F` |
| Esperando resposta | `#FFCB73` | `#8B5E00` |
| Entrevista marcada | `#C19CFF` | `#7654A6` |
| Fazendo teste | `#FF9B76` | `#9F4A24` |
| Tenho proposta | `#76D9E8` | `#006879` |
| Fechou | `#70E7A7` | `#1F7A4D` |
| Não seguiu | `#FF7E8C` | `#B13C4F` |

`node scripts/check-contrast.mjs` verifica as combinações dos dois temas: tinta sobre superfícies,
chips tingidos, preenchimentos sólidos e ação primária. O alvo é AA para texto normal.

## Tipografia

- **Geist Variable** é a voz principal: legível, compacta e consistente em listas densas.
- **Monospace do sistema** fica reservado para medição: percentuais, datas, estados, contagens e
  etiquetas de sistema. Não é fantasia de “produto para dev”.
- Título de tela: 32px, 600, tracking `-0.035em`.
- Título de seção: 15px–18px, 600.
- Corpo: 15px, altura 1.5; campos continuam em 16px no mobile.
- Números usam `font-variant-numeric: tabular-nums`.

## Forma, espaço e profundidade

- Grid base de 4px; decisão tem respiro, lista tem densidade.
- Raio de 4px em controles e 6px em painéis: ferramenta precisa, sem virar terminal bruto.
- Fios de 1px organizam informação. Painéis existem quando o conteúdo precisa ser lido junto.
- Sombras ficam restritas a painéis e overlays, com profundidade ajustada por tema.
- Interações duram entre 100ms e 150ms e respeitam `prefers-reduced-motion`.
- Troca de tema é imediata e não anima superfícies, evitando uma transição cansativa.

## Shell e navegação

- Desktop: rail fixo de 240px, com superfície e contraste derivados do tema ativo.
- Item atual: fundo `accent-weak`, tinta `accent` e linha de sinal.
- Mobile: topo compacto com menu acessível, marca, toggle e ação Registrar.
- Cabeçalho de rota: contexto, título, situação atual e uma ação primária única.
- O toggle anuncia o próximo tema, tem alvo confortável e persiste `fio-theme` no localStorage.

## Componentes

Todos mantêm default, hover, focus, active, disabled, loading, error e empty quando aplicável:

- `Button`: primário, secundário, ghost, danger e link, usando a tinta do tema ativo.
- `ThemeToggle`: alterna entre claro e escuro sem alterar dados ou rota.
- `Input`, `Textarea`, `Select`: superfície sunken, foco accent, label real e dica/erro coexistentes.
- `Card`/`Secao`: painéis com cabeçalho por fio; listas continuam sem caixas redundantes.
- `StageChip`/`StageDot`: estado com cor, ponto e rótulo escrito.
- `Skeleton`: repete a forma do conteúdo e para sob redução de movimento.
- `EmptyState`: explica a área e oferece o próximo passo.
- `Dialog`, `ConfirmDialog`, `Toast`, `InlineError`: scrim e profundidade adaptados ao tema.

## Responsividade e acessibilidade

- 320px, 360px, 390px e 768px sem rolagem horizontal acidental.
- O quadro mantém seu próprio scroll horizontal para preservar comparação entre etapas.
- Áreas clicáveis têm pelo menos 44px em mobile; navegação por teclado continua completa.
- Contraste AA, foco sempre visível, `aria-label` em ícones isolados e sem informação transmitida
  apenas por cor.
- `color-scheme` acompanha o tema ativo para campos, scrollbar e superfícies nativas.

## Anti-padrões removidos

- neon e glow como sinônimo de tecnologia;
- gradientes e glassmorphism sem função;
- monospace em toda a interface;
- fileira universal de métricas decorativas;
- toggle sem persistência ou sem nomear o próximo estado;
- textos de coach, celebração artificial e mensagens vagas.
