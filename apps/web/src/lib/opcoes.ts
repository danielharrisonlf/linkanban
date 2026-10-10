/**
 * Opções fixas do produto. Ficam num só lugar para o formulário, o filtro e o
 * rótulo nunca divergirem.
 */

/** Modelo de trabalho é escolha, não texto livre: "SP, Remoto, Híbrido" no mesmo
 * campo misturava duas coisas e sujava o filtro. */
export const MODELOS_DE_TRABALHO = ["Remoto", "Híbrido", "Presencial"] as const;

/** Onde a vaga apareceu. Lista curta e cobrível; o campo aceita outro valor. */
export const ORIGENS_SUGERIDAS = [
  "LinkedIn",
  "Gupy",
  "Indicação",
  "Site da empresa",
  "Programa de diversidade",
  "Comunidade ou evento",
] as const;

export const SUGESTOES_SALARIO = [
  "A combinar",
  "Até R$ 5.000",
  "R$ 5.000 a R$ 8.000",
  "R$ 8.000 a R$ 12.000",
  "R$ 12.000 a R$ 18.000",
  "Acima de R$ 18.000",
] as const;

/** Motivos de recusa, para o fechamento de um processo não virar um vazio. */
export const MOTIVOS_DE_RECUSA = [
  "Sem retorno depois das etapas",
  "Perfil não bateu com a vaga",
  "Faltou experiência em algo específico",
  "Pretensão acima da faixa",
  "Vaga congelada ou cancelada",
  "Escolheram outra pessoa",
] as const;
