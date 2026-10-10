import type * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Card é agrupamento, não enfeite: existe quando há um bloco que precisa ser lido
 * junto. Onde um fio e um título bastam, use `Secao` — empilhar cards faz a página
 * virar uma pilha de retângulos iguais.
 */
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("panel", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("panel-header flex flex-col gap-1 p-4", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-body font-semibold text-ink-primary", className)} {...props} />
);

export const CardHint = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-micro text-ink-tertiary", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-4", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-center gap-2 border-t border-line-subtle px-4 py-3", className)}
    {...props}
  />
);

/**
 * Seção sem caixa: título + fio de cabelo. É o bloco padrão das telas de lista,
 * onde a separação por espaço e fio basta.
 */
export function Secao({
  titulo,
  descricao,
  acao,
  children,
  className,
  id,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("flex flex-col", className)} aria-labelledby={id}>
      <div className="flex items-end justify-between gap-4 border-b border-line-subtle pb-2">
        <div className="min-w-0">
          <h2 id={id} className="text-body font-semibold text-ink-primary">
            {titulo}
          </h2>
          {descricao ? <p className="mt-0.5 text-micro text-ink-tertiary">{descricao}</p> : null}
        </div>
        {acao ? <div className="flex shrink-0 items-center gap-1.5">{acao}</div> : null}
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
}
