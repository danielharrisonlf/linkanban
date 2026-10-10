# Fio — marca e linguagem

Documento de identidade da v2. Nome, símbolo, tom e vocabulário. Deriva de
[PRODUCT.md](./PRODUCT.md); o sistema visual fica em [DESIGN.md](./DESIGN.md).

## Nome

**Fio.**

Um processo de candidatura é um fio que sai daqui e vai para algum lugar: às vezes volta
(resposta, entrevista, proposta), muitas vezes não volta. O trabalho de quem procura emprego é
não deixar o fio se perder. O produto existe para manter cada fio à vista.

Substitui "Linkanban" — que era a junção literal de *link* + *kanban*, ou seja, descrevia a
categoria (um quadro de links) em vez do que o produto faz de diferente.

- **Pronúncia e escrita:** uma palavra, três letras, sem hífen, sem caixa alta no meio.
  Escrito sempre em caixa alta apenas na primeira letra quando no meio de uma frase: *o Fio*.
- **O que o nome carrega:** continuidade, rastreio, algo que liga dois pontos. Nada de
  velocidade, produtividade ou crescimento — esse não é o problema de quem usa.
- **O que evitar:** usar "fio" como verbo na interface ("fie sua candidatura") ou forçar a
  metáfora em toda frase. A metáfora trabalha no símbolo e no tom, não no microcopy.

## Símbolo

Um traço contínuo: uma linha que percorre na horizontal e sobe uma vez, como o percurso de um
processo que avança de etapa — com um nó de sinal em cada ponta. O símbolo lê como fio e como
conexão de dados sem virar um logotipo de tecnologia genérico.

- Traço de **2px** com ponta arredondada, sem preenchimento. Funciona a 16px (favicon) e a
  200px sem virar outra coisa.
- Os nós são pontos preenchidos de 1,25px; a linha permanece com ponta arredondada.
- O símbolo pode viver dentro de um contorno técnico discreto no rail, mas nunca recebe gradiente
  ou sombra própria. O contorno é estrutura de navegação, não um selo.
- Aplicação principal em `accent` sobre a superfície do tema ativo. Em tamanhos muito pequenos,
  `ink` garante a leitura do símbolo sem transformar a marca em um efeito luminoso.

## Vocabulário

Terminologia fixa da interface. Uma coisa tem um nome só, em todas as telas.

| Conceito | Termo oficial | Não usar |
|---|---|---|
| O quadro de etapas | **Quadro** | Pipeline, Kanban, Board |
| Registro de uma vaga | **Candidatura** | Vaga (a vaga é o anúncio; a candidatura é o que você registrou) |
| Etapa do processo | **Etapa** | Coluna, status, fase |
| Lembrete de cobrança | **Follow-up** (masculino) | Retorno, lembrete (follow-up é o termo que a pessoa já usa com empresas) |
| Empresa onde aplicou | **Empresa** | Companhia, organização |
| Visão agregada | **Resumo** | Dashboard, painel, overview |
| Sequência de etapas | **Funil** (só no texto analítico) | Pipeline |

## Tom

Português do Brasil, tratamento por "você", sentence case em tudo — título, botão, rótulo.
Direto, específico, sem entusiasmo de marketing.

**Regras**

1. **O botão nomeia o resultado.** "Registrar candidatura", "Salvar alterações", "Marcar como
   feito". Nunca "Enviar", "Confirmar", "OK", "Submeter".
2. **Frase curta vence frase completa.** O contexto já diz o resto. "Nenhuma candidatura
   ainda" e não "Parece que você ainda não cadastrou nenhuma candidatura no sistema".
3. **Erro nomeia o problema e o caminho.** Sem "algo deu errado", sem pedir desculpa, sem
   culpar a pessoa.
4. **Vazio ensina.** Toda tela sem conteúdo diz o que aquela área é e qual é o próximo passo
   — sem virar tutorial.
5. **Nada de coach.** Sem "vamos lá!", sem "você consegue!", sem emoji comemorando. O
   produto é um colega organizado, não uma torcida.
6. **Nenhuma promessa que o produto não cumpre.** "Acompanhe cada candidatura até a
   resposta" é verdade; "nunca mais perca uma oportunidade" é marketing.
7. **Sem jargão de recrutamento** onde a palavra comum serve: "etapa" em vez de "fase do
   processo seletivo", "empresa" em vez de "organização contratante".

**Referência de voz (antes → depois)**

| Antes | Depois |
|---|---|
| "Nada vencido por aqui. Os próximos follow-ups estão em dia." | "Nenhum follow-up vencido." |
| "Nada para medir ainda" | "Sem dados ainda" |
| "Cadastre a primeira vaga e o acompanhamento começa a aparecer aqui" | "Registre a primeira candidatura para ver os números" |
| "Quanto mais contexto você registrar agora, menos você precisa lembrar depois." | "Só vaga e empresa são obrigatórias. O resto ajuda depois." |
| "O pipeline está vazio" | "Nenhuma candidatura no quadro" |
| "Algo quebrou na interface" | "A tela não carregou" |
| "Linkanban v1.0 MVP" | (remover — versão não é informação para quem usa) |
