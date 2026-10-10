import { TriangleAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

/**
 * Erro junto do gatilho: fica no formulário ou na lista que falhou, não numa
 * caixa genérica no topo da tela. Diz o que aconteceu e o que fazer.
 */
export function InlineError({
  message,
  className,
  onRetry,
}: {
  message: string;
  className?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-start gap-2 rounded-control border border-danger/40 bg-danger-weak p-2.5",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words text-label text-ink-primary">{message}</p>
      {onRetry ? (
        <Button variant="link" size="sm" onClick={onRetry} className="shrink-0">
          Tentar de novo
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Aviso de pré-requisito. Não é erro: é a ordem das coisas. Por isso não usa
 * vermelho nem ícone de alerta.
 */
export function Notice({
  children,
  acao,
  className,
}: {
  children: React.ReactNode;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-control border border-line-subtle",
        "bg-surface-sunken p-2.5",
        className,
      )}
    >
      <p className="min-w-0 flex-1 text-label text-ink-secondary">{children}</p>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}
