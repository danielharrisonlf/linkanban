import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import type { StatusCandidatura } from "../types";

/** Tamanhos de texto do nosso `@theme`. */
const ESCALA_DE_TEXTO = [
  "micro",
  "label",
  "body",
  "prose",
  "lead",
  "title",
  "screen",
  "metric",
] as const;

/**
 * O `tailwind-merge` precisa saber que `text-body`, `text-label` e companhia são
 * TAMANHO, não cor.
 *
 * Sem isso, `cn("text-accent-ink", "text-label")` entende que as duas classes
 * escrevem a mesma propriedade e mantém só a última — o botão primário ficava
 * com a tinta escura herdada sobre o verde, quase ilegível, sem nenhum erro de
 * build. Declarar o grupo aqui conserta na origem, em vez de proibir a
 * combinação em cada componente.
 */
const cnComEscala = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...ESCALA_DE_TEXTO] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return cnComEscala(clsx(inputs));
}

/**
 * As sete etapas, do ponto de vista de quem está procurando — não do ponto de
 * vista da empresa. "Em análise" descreve o que eles fazem com o seu currículo;
 * "Esperando resposta" descreve onde você está. A diferença é a diferença entre
 * um CRM e um caderno de quem aplica.
 *
 * `label` é o que aparece na tela; `frase` é a leitura da etapa em texto corrido
 * (usada em resumo, aria e tooltip) porque "3 esperando resposta" lê melhor que
 * "3 Esperando resposta".
 */
export const ETAPAS: Record<StatusCandidatura, { label: string; frase: string; curto: string }> = {
  APLICADO: { label: "Enviei", frase: "enviadas", curto: "Enviei" },
  EM_ANALISE: { label: "Esperando resposta", frase: "esperando resposta", curto: "Espera" },
  ENTREVISTA: { label: "Entrevista marcada", frase: "com entrevista marcada", curto: "Entrevista" },
  TESTE_TECNICO: { label: "Fazendo teste", frase: "fazendo teste", curto: "Teste" },
  PROPOSTA: { label: "Tenho proposta", frase: "com proposta na mesa", curto: "Proposta" },
  APROVADO: { label: "Fechou", frase: "fechadas", curto: "Fechou" },
  REJEITADO: { label: "Não seguiu", frase: "que não seguiram", curto: "Não seguiu" },
};

export const STATUS_LABELS: Record<StatusCandidatura, string> = Object.fromEntries(
  Object.entries(ETAPAS).map(([chave, valor]) => [chave, valor.label]),
) as Record<StatusCandidatura, string>;

/** Tinta sobre fundo tingido: a cor vem do token `stage-*`, nunca solta no JSX. */
export const STATUS_CHIP: Record<StatusCandidatura, string> = {
  APLICADO: "border-stage-applied/35 bg-stage-applied/10 text-stage-applied",
  EM_ANALISE: "border-stage-analysis/35 bg-stage-analysis/10 text-stage-analysis",
  ENTREVISTA: "border-stage-interview/35 bg-stage-interview/10 text-stage-interview",
  TESTE_TECNICO: "border-stage-test/35 bg-stage-test/10 text-stage-test",
  PROPOSTA: "border-stage-proposal/35 bg-stage-proposal/10 text-stage-proposal",
  APROVADO: "border-stage-approved/35 bg-stage-approved/10 text-stage-approved",
  REJEITADO: "border-stage-rejected/35 bg-stage-rejected/10 text-stage-rejected",
};

/** Ponto cheio e barra: mesma tinta, sem preenchimento tingido. */
export const STATUS_DOT: Record<StatusCandidatura, string> = {
  APLICADO: "bg-stage-applied",
  EM_ANALISE: "bg-stage-analysis",
  ENTREVISTA: "bg-stage-interview",
  TESTE_TECNICO: "bg-stage-test",
  PROPOSTA: "bg-stage-proposal",
  APROVADO: "bg-stage-approved",
  REJEITADO: "bg-stage-rejected",
};

/**
 * Ordem do quadro: o que está acontecendo, e depois o que terminou. "Não seguiu"
 * fica no fim, junto com "Fechou" — os dois são desfecho, não etapa de trabalho.
 */
export const KANBAN_COLUMNS: readonly StatusCandidatura[] = [
  "APLICADO",
  "EM_ANALISE",
  "ENTREVISTA",
  "TESTE_TECNICO",
  "PROPOSTA",
  "APROVADO",
  "REJEITADO",
] as const;

/** Etapas que ainda pedem ação sua (o resto é desfecho). */
export const FUNNEL_STATUSES: readonly StatusCandidatura[] = [
  "APLICADO",
  "EM_ANALISE",
  "ENTREVISTA",
  "TESTE_TECNICO",
  "PROPOSTA",
] as const;

export const ALL_STATUSES = KANBAN_COLUMNS;

const RESOLVIDOS: readonly StatusCandidatura[] = ["APROVADO", "REJEITADO"];

export function ehDesfecho(status: StatusCandidatura): boolean {
  return RESOLVIDOS.includes(status);
}

/** Percentual seguro para larguras de barra (nunca NaN, nunca acima de 100). */
export function percent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

function parse(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `27/03/2026` */
export function formatDate(value: string | Date): string {
  const date = parse(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** `27 mar` — para cartões densos. */
export function formatShortDate(value: string | Date): string {
  const date = parse(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "");
}

/** `27/03 às 14:30` */
export function formatDateTime(value: string | Date): string {
  const date = parse(value);
  if (!date) return "—";
  const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    date,
  );
  return `${dia} às ${hora}`;
}

/** Dias inteiros entre hoje e a data (negativo = passado). */
export function diasAte(value: string | Date, agora: Date = new Date()): number | null {
  const date = parse(value);
  if (!date) return null;
  const umDia = 24 * 60 * 60 * 1000;
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
  const inicioAlvo = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((inicioAlvo - inicioHoje) / umDia);
}

/** "há 12 dias", "hoje", "ontem", "em 3 dias". */
export function tempoRelativo(value: string | Date, agora: Date = new Date()): string {
  const dias = diasAte(value, agora);
  if (dias === null) return "—";
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  if (dias < 0) return `há ${Math.abs(dias)} dias`;
  return `em ${dias} dias`;
}

export type Urgencia = "atrasado" | "hoje" | "futuro" | "concluido";

/**
 * Classifica o follow-up contra um instante — recebido, não lido do relógio,
 * para as métricas serem derivadas do mesmo "agora" que a tela usa.
 */
export function urgenciaFollowup(
  value: string | Date,
  feito: boolean,
  agora: Date = new Date(),
): Urgencia {
  if (feito) return "concluido";
  const date = parse(value);
  if (!date) return "futuro";
  const mesmoDia =
    date.getFullYear() === agora.getFullYear() &&
    date.getMonth() === agora.getMonth() &&
    date.getDate() === agora.getDate();
  if (mesmoDia) return "hoje";
  return date.getTime() < agora.getTime() ? "atrasado" : "futuro";
}

/** `2026-03-27T10:00:00.000Z` → `2026-03-27T10:00` para inputs datetime-local. */
export function toDateTimeLocal(value: string | Date): string {
  const date = parse(value);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** `2026-03-27T10:00:00.000Z` → `2026-03-27` para inputs date. */
export function toDateInput(value: string | Date): string {
  const date = parse(value);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Plural simples, para contagens. */
export function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
}

/**
 * Faixa salarial em versão curta para coluna estreita: "R$ 14.000 a R$ 18.000"
 * vira "R$ 14–18k", "Acima de R$ 18.000" vira "acima de R$ 18k". Texto que não
 * segue um padrão numérico volta como veio ("A combinar").
 */
export function salarioCurto(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const texto = valor.trim();
  if (!texto) return null;

  const numeros = [...texto.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)\s*(mil|k)?/gi)].map((m) => {
    const bruto = Number(m[1]?.replace(/\./g, "") ?? "0");
    return m[2] ? bruto * 1000 : bruto;
  });
  const unicos = [...new Set(numeros)].filter((n) => n > 0);
  if (unicos.length === 0) return null;

  const moeda = /us\$|usd|\$/i.test(texto) ? "US$" : "R$";
  const emK = (n: number) => {
    const milhares = n / 1000;
    return `${milhares.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  };

  const acima = /acima/i.test(texto);
  if (unicos.length === 1) {
    const valor1 = unicos[0] ?? 0;
    const faixa = valor1 >= 1000 ? emK(valor1) : String(valor1);
    return acima ? `acima de ${moeda} ${faixa}` : `${moeda} ${faixa}`;
  }

  const menor = Math.min(...unicos);
  const maior = Math.max(...unicos);
  return `${moeda} ${emK(menor)}–${emK(maior)}`;
}
