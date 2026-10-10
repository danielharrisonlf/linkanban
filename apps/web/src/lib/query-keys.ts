/**
 * Fábrica de chaves de cache. Uma raiz por recurso, para invalidar todas as
 * variações de uma vez — e `listas()` para invalidar toda variação de filtro.
 */
export const candidaturasKeys = {
  all: ["candidaturas"] as const,
  listas: () => [...candidaturasKeys.all, "lista"] as const,
  lista: (filtro: unknown) => [...candidaturasKeys.listas(), filtro] as const,
  detalhe: (id: string) => [...candidaturasKeys.all, "detalhe", id] as const,
};

export const empresasKeys = {
  all: ["empresas"] as const,
  listas: () => [...empresasKeys.all, "lista"] as const,
  lista: () => [...empresasKeys.listas()] as const,
};

export const opcoesKeys = {
  all: ["opcoes"] as const,
};

export const followupsKeys = {
  all: ["followups"] as const,
  listas: () => [...followupsKeys.all, "lista"] as const,
  lista: () => [...followupsKeys.listas()] as const,
};

export const resumoKeys = {
  all: ["resumo"] as const,
};

/** Tudo que muda quando uma candidatura ou follow-up muda. */
export const RECURSOS_DERIVADOS = [
  candidaturasKeys.all,
  followupsKeys.all,
  resumoKeys.all,
] as const;
