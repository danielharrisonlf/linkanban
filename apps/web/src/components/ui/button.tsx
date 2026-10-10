import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renderiza o filho no lugar do `<button>` (link, ou trigger do Radix). */
  asChild?: boolean;
  /** Trava o clique repetido e mostra que está trabalhando. */
  loading?: boolean;
}

/**
 * A cor do texto nunca convive com utilitário de tamanho de texto no mesmo
 * elemento: `text-label`/`text-body` são lidos pelo `tailwind-merge` como COR, e
 * ter os dois apaga um deles em silêncio. Por isso a cor vem do variant e o
 * tamanho vem da classe, sem `text-white` no meio.
 */
const VARIANTES: Record<Variant, string> = {
  primary:
    "border border-accent bg-accent text-accent-ink hover:border-accent-strong hover:bg-accent-strong",
  secondary:
    "border border-line bg-surface-raised text-ink-primary hover:border-line-strong hover:bg-surface-hover",
  ghost: "text-ink-secondary hover:bg-surface-hover hover:text-ink-primary",
  danger: "border border-danger/40 text-danger hover:border-danger hover:bg-danger-weak",
  link: "text-accent underline-offset-4 hover:underline",
};

const TAMANHOS: Record<Size, string> = {
  sm: "h-8 px-2.5 text-label gap-1.5",
  md: "h-9 px-3 text-label gap-1.5",
  lg: "h-11 px-4 text-body gap-2",
  icon: "h-9 w-9 p-0",
  "icon-sm": "h-8 w-8 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", asChild = false, loading = false, ...props },
    ref,
  ) => {
    const Componente = asChild ? Slot : "button";
    const bloqueado = props.disabled || loading;

    return (
      <Componente
        ref={ref}
        aria-busy={loading || undefined}
        {...props}
        disabled={asChild ? undefined : bloqueado}
        className={cn(
          "inline-flex select-none items-center justify-center rounded-control font-medium",
          "transition-colors duration-150 ease-out",
          "active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
          "[&_svg]:shrink-0",
          VARIANTES[variant],
          variant !== "link" && TAMANHOS[size],
          className,
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />
            <span>{props.children}</span>
          </>
        ) : (
          props.children
        )}
      </Componente>
    );
  },
);
Button.displayName = "Button";
