import { cn, ETAPAS, percent, STATUS_DOT } from "../../lib/utils";
import type { StatusCandidatura } from "../../types";

/**
 * Funil como lista ordenada, não como gráfico de barras do Recharts.
 *
 * Motivo: com poucas candidaturas — o caso comum — barras por etapa dão 0 ou 1 e
 * viram ruído. Aqui a barra é proporcional à **maior** etapa, então as diferenças
 * aparecem, e o percentual sobre o total vai escrito ao lado.
 */
export function FunnelChart({
  dados,
  total,
  className,
}: {
  dados: { status: StatusCandidatura; total: number }[];
  total: number;
  className?: string;
}) {
  const maior = dados.reduce((maximo, item) => Math.max(maximo, item.total), 0);

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {dados.map(({ status, total: valor }) => (
        <li key={status} className="grid grid-cols-[minmax(0,8.5rem)_1fr_auto] items-center gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
              aria-hidden="true"
            />
            <span className="truncate text-label text-ink-secondary">{ETAPAS[status].label}</span>
          </span>

          <span className="h-1 overflow-hidden rounded-full bg-surface-sunken">
            <span
              className={cn("block h-full rounded-full", STATUS_DOT[status])}
              style={{ width: `${percent(valor, maior)}%` }}
            />
          </span>

          <span className="flex items-baseline gap-2">
            <span className="w-4 text-right text-label font-medium tabular text-ink-primary">
              {valor}
            </span>
            <span className="w-9 text-right text-micro tabular text-ink-tertiary">
              {Math.round(percent(valor, total))}%
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
