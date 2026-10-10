export interface NavItem {
  to: string;
  label: string;
  /** Uma linha explicando a tela, usada no menu mobile e em título de página. */
  descricao: string;
}

/**
 * Quatro telas, não cinco. "Empresas" saiu da navegação principal: é cadastro de
 * apoio, usado uma vez a cada muitas candidaturas, e ocupava um lugar de destaque
 * que não corresponde à frequência. Continua alcançável em "Mais".
 *
 * A navegação é dado, não JSX duplicado: a barra do desktop e o menu do mobile
 * renderizam esta mesma lista, com o mesmo estado ativo.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Resumo", descricao: "Onde a sua busca está" },
  { to: "/quadro", label: "Quadro", descricao: "Candidaturas por etapa" },
  { to: "/candidaturas", label: "Candidaturas", descricao: "A lista completa" },
  { to: "/follow-ups", label: "Follow-ups", descricao: "Quem cobrar e quando" },
] as const;

export const NAV_SECUNDARIA: readonly NavItem[] = [
  { to: "/empresas", label: "Empresas", descricao: "Empresas cadastradas" },
] as const;
