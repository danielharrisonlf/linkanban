import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Cabeçalho de tela: título em display, uma linha de contexto e a ação primária.
 * A linha de contexto é conteúdo, não enfeite — se não acrescenta nada à leitura,
 * não deve existir.
 */
export function PageHeader({
  titulo,
  contexto,
  acao,
  className,
}: {
  titulo: string;
  contexto?: ReactNode;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("page-header", className)}>
      <div className="min-w-0">
        <p className="eyebrow mb-2">Fio / operação</p>
        <h1 className="font-display text-screen font-semibold text-ink-primary">{titulo}</h1>
        {contexto ? <p className="mt-2 text-body text-ink-secondary">{contexto}</p> : null}
      </div>
      {acao ? <div className="flex shrink-0 items-center gap-2">{acao}</div> : null}
    </header>
  );
}
