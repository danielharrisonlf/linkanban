import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Estado vazio que ensina: diz o que aquela área é e qual é o próximo passo.
 * A ação é opcional, mas quando existe é o caminho mais curto para sair do vazio.
 */
export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  acao,
  className,
}: {
  icon?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5 px-1 py-8 text-center sm:items-center",
        className,
      )}
    >
      {Icon ? <Icon className="mb-1 h-5 w-5 text-ink-tertiary" aria-hidden="true" /> : null}
      <p className="text-prose font-medium text-ink-primary">{titulo}</p>
      {descricao ? <p className="max-w-md text-body text-ink-secondary">{descricao}</p> : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}

/** Bloco de carregamento com a forma do conteúdo — nunca spinner solto. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton h-4 w-full", className)} aria-hidden="true" {...props} />;
}

const LINHAS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/** Linhas fantasma com a altura real da lista, para a troca não pular. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col", className)} aria-busy="true">
      <span className="apenas-leitor">Carregando</span>
      {LINHAS.slice(0, rows).map((chave) => (
        <div key={chave} className="flex items-center gap-4 border-b border-line-subtle py-3">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="hidden h-3.5 w-28 sm:block" />
          <Skeleton className="ml-auto h-5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)} aria-busy="true">
      <span className="apenas-leitor">Carregando</span>
      {LINHAS.slice(0, count).map((chave) => (
        <div key={chave} className="rounded-card border border-line-subtle bg-surface-raised p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Esqueleto de tela inteira, para rota carregada sob demanda. */
export function SkeletonTela() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6" aria-busy="true">
      <span className="apenas-leitor">Carregando a tela</span>
      <Skeleton className="h-8 w-44" />
      <SkeletonCards count={4} />
      <Skeleton className="h-56 w-full rounded-card" />
    </div>
  );
}
