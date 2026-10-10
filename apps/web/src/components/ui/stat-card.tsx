import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Métrica como leitura, não como enfeite: rótulo, número em display e uma linha
 * que diz de onde o número veio. Não tem ação própria — quem age são as listas
 * logo abaixo.
 */
export function StatCard({
  label,
  value,
  sufixo,
  detalhe,
  alerta,
  className,
}: {
  label: string;
  value: string;
  sufixo?: string;
  detalhe?: string;
  /** Use só quando o número exige ação. */
  alerta?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col border-t border-line-subtle pt-3", className)}>
      <span className="flex items-center gap-2 font-mono text-micro font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        <span className="h-1.5 w-1.5 rounded-full bg-accent/70" aria-hidden="true" />
        {label}
      </span>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="metric text-ink-primary">{value}</span>
        {sufixo ? (
          <span className="font-mono text-label tabular text-ink-tertiary">{sufixo}</span>
        ) : null}
      </p>
      {alerta ? (
        <p className="mt-1 text-micro font-medium text-danger">{alerta}</p>
      ) : detalhe ? (
        <p className="mt-1 text-micro text-ink-tertiary">{detalhe}</p>
      ) : null}
    </div>
  );
}

/** Contêiner das métricas: réguas, não caixas. */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-6 border-y border-line-subtle py-5 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
