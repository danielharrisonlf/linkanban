# 1. Registrar decisões de arquitetura

Data: 2026-09-13

## Status

Aceito

## Contexto

Trabalhamos principalmente em um **ambiente assíncrono**, no qual manter as decisões visíveis e acessíveis para todos — independentemente de fuso horário ou horário de trabalho — é essencial.

Conforme o projeto evolui, uma série de decisões técnicas e arquiteturais será tomada. Sem um registro consistente, a justificativa dessas decisões se perde em revisões de código, issues ou conhecimento tribal. Isso dificulta que novas pessoas contribuidoras entendam *por que* as coisas estão como estão e que o time revise ou substitua decisões passadas com clareza.

O artigo de Michael Nygard, [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), introduziu o conceito de ADRs (Architecture Decision Records) como uma forma leve e versionada de capturar essas decisões.

## Decisão

Vamos documentar decisões técnicas e arquiteturais relevantes usando **Architecture Decision Records (ADRs)**.

Cada ADR será:

- Armazenado no repositório em `docs/architecture/decisions/`.
- Numerado sequencialmente (`0001-...`, `0002-...`, etc.).
- Escrito em Markdown, com uma decisão por arquivo.
- Revisado e mesclado como código, via pull request.
- Marcado com um status claro: *Proposto*, *Aceito*, *Depreciado* ou *Substituído*.

Os ADRs são imutáveis: uma decisão não é editada depois de aceita. Quando uma decisão muda, cria-se um novo ADR que **substitui** o anterior, e o ADR antigo passa a apontar para o novo.

Cada ADR deve conter, no mínimo, as seções: **Título**, **Data**, **Status**, **Contexto**, **Decisão** e **Consequências**.

## Consequências

- Criamos um histórico pesquisável e versionado das decisões e do seu contexto.
- Novas pessoas no time fazem onboarding mais rápido lendo os ADRs anteriores.
- Decisões podem ser substituídas de forma explícita, preservando o registro histórico.
- Escrever ADRs exige disciplina: nem toda decisão pequena deve ser registrada.
- O time precisa concordar sobre quando um ADR é necessário (decisões de arquitetura, infraestrutura ou que impactam a API).
