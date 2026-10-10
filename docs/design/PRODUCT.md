# Produto — Fio

> Contexto durável do produto. Design, arquitetura de informação e copy derivam daqui.
> Capturado em 2026-09-14; revisar quando o produto mudar de escopo.
> Nome, símbolo, vocabulário e tom ficam em [BRAND.md](./BRAND.md); o sistema visual, em
> [DESIGN.md](./DESIGN.md).

## O que é

Um caderno de candidaturas que se comporta como um quadro de etapas. A pessoa registra cada
vaga a que aplicou, move o cartão conforme o processo anda e agenda quando cobrar retorno.

Não é um ATS (sistema de recrutamento), não é uma rede profissional e não é um agregador de
vagas. É o **lado de quem aplica**: um lugar para não deixar o processo morrer no silêncio.

## Quem usa

Uma pessoa em busca de recolocação, sozinha, sem equipe e sem treinamento. Tipicamente:

- **Em transição ativa** (aplica em 3 a 10 vagas por semana): precisa de velocidade para
  registrar e de um lugar para não esquecer quem não respondeu.
- **Em busca passiva/qualificada** (poucas vagas, processos longos): precisa de histórico e
  de contexto — o que foi combinado, com quem, quando.
- **Recém-formada ou primeira busca estruturada**: precisa aprender o próprio processo; o
  produto precisa ensinar sem parecer tutorial.

Contexto emocional que o produto **não pode ignorar**: procurar emprego é uma sequência de
silêncios e recusas. A tela vai ser aberta em dias ruins. O produto não comemora demais nem
trata a pessoa como funil de vendas.

## Trabalhos a serem feitos (JTBD)

1. **"Apliquei agora, quero registrar antes de esquecer."** — rápido, do celular, com o
   mínimo de campos; o resto pode ser completado depois.
2. **"Quero saber em que pé está cada processo."** — leitura de relance do quadro.
3. **"Não quero deixar ninguém sem resposta."** — saber quem cobrar e quando.
4. **"Quero entender se a minha busca está funcionando."** — taxa de resposta, onde as
   candidaturas travam, ritmo por semana.
5. **"Quero lembrar o que combinei com essa empresa."** — contexto por candidatura: salário,
   origem, link, observações, histórico de follow-ups.

## O que a pessoa faz hoje (fluxo real)

Registra a candidatura (4 campos, o resto opcional) → ela aparece no quadro → move de etapa
conforme o processo anda → agenda uma cobrança → registra o que aconteceu quando cobrou →
olha o resumo para decidir o próximo passo.

## Onde a versão 2 mudou de rumo

A v1 tratava o quadro como o produto e a empresa como protagonista: as etapas descreviam o que
*eles* fazem ("Em análise", "Rejeitado"). A v2 parte de três verdades que a v1 ignorava:

1. **O silêncio é a experiência dominante**, não a exceção. Por isso "Esperando resposta" é a
   primeira métrica do resumo, e "Sem movimento" mostra há quantos dias cada processo parou.
2. **A recusa é informação.** Marcar "Não seguiu" pergunta o que eles disseram; guardar o
   motivo transforma a recusa em aprendizado em vez de sumiço.
3. **Cobrar é a aposta diferencial.** O follow-up saiu de uma página separada e virou uma ação
   no cartão de quem está parado, com registro do resultado — que move a candidatura junto.

O vocabulário acompanhou: as sete etapas passaram a descrever onde **você** está (Enviei,
Esperando resposta, Entrevista marcada, Fazendo teste, Tenho proposta, Fechou, Não seguiu).

## Princípios de produto

1. **Registrar tem que custar segundos.** Todo campo além de vaga e empresa é opcional, e
   nada bloqueia o registro por falta de dado.
2. **O estado do processo é a informação mais importante da tela.** Etapa, tempo parado e
   próximo contato vêm antes de qualquer métrica agregada.
3. **Número só entra se mudar uma decisão.** Métrica que não leva a uma ação (cobrar, abrir
   vaga, arquivar) sai da tela.
4. **Nada de gamificação de sofrimento.** Sem streak, sem badge de conquista, sem "parabéns"
   por ter sido rejeitado. O tom é de colega organizado, não de coach.
5. **Vazio ensina, erro orienta.** Toda tela sem conteúdo diz o que aquela área é e qual é o
   próximo passo; todo erro diz o que aconteceu e como resolver.

## Voz

Português do Brasil, tratamento por "você", sentence case. Direto e específico, sem
entusiasmo de marketing e sem jargão de recrutamento.

- O botão nomeia a ação e o resultado: **Registrar candidatura**, não "Enviar" nem "Salvar".
- O mesmo conceito tem o mesmo nome na interface inteira — a terminologia fixa está em
  [BRAND.md](./BRAND.md); revisá-la é parte do design, não detalhe de redação.
- Erro não pede desculpa e não é vago: nomeia o problema e o caminho de volta. Nunca vaza
  caminho de arquivo, nome de tabela ou mensagem de biblioteca.
- Frase curta em vez de frase completa quando o contexto já diz o resto.
- Nada de coach: sem "vamos lá!", sem emoji comemorando, sem parabenizar por ter sido
  recusado.

## Restrições

- **Sem conta multiusuário hoje.** Uma pessoa, um conjunto de dados. Não desenhar nada que
  dependa de colaboração, permissão ou atribuição.
- **Sem notificação por e-mail/push.** O que "avisa" é a tela.
- **Dados são locais do dono** (Postgres próprio). Nada de telemetria, nada de terceiros.
- Precisa funcionar bem em celular de uma mão e em desktop, porque os dois são usados no
  mesmo dia.

## O que este produto não vai fazer

- Buscar vagas automaticamente, candidatar-se sozinho ou preencher formulário de terceiros.
- Analisar currículo ou simular entrevista.
- Vender curso, mentoria ou assinatura de terceiros.
- Social: feed, seguir pessoas, comparar com outras pessoas.
