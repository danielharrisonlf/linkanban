import type { ReactNode } from "react";
import { cn, STATUS_CHIP, STATUS_DOT, STATUS_LABELS } from "../../lib/utils";
import type { StatusCandidatura } from "../../types";

/** Pílula neutra: contagem, rótulo curto. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs border border-line bg-surface-sunken px-1.5 py-0.5",
        "font-mono text-micro font-medium tabular text-ink-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Etapa do processo. O ponto colorido é reforço: o rótulo escrito está sempre
 * ao lado, então a cor nunca é o único canal de informação.
 */
export function StageChip({
  status,
  label,
  className,
}: {
  status: StatusCandidatura;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("stage-chip", STATUS_CHIP[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}

/** Só o ponto, quando o rótulo está no contexto ao lado. */
export function StageDot({ status, className }: { status: StatusCandidatura; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status], className)}
      aria-hidden="true"
    />
  );
}
