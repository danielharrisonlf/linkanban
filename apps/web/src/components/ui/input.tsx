import * as React from "react";
import { cn } from "../../lib/utils";

export interface FieldProps {
  label: string;
  htmlFor: string;
  /** Orientação curta. Não some quando há erro: o formato continua útil. */
  hint?: string;
  error?: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Rótulo + controle + mensagem. O `<label for>` faz clicar no rótulo focar o
 * campo; o erro aparece junto do campo e não substitui a orientação — perder a
 * dica exatamente quando o campo erra é quando ela mais faz falta.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  obrigatorio,
  children,
  className,
}: FieldProps) {
  const idErro = `${htmlFor}-erro`;
  const idDica = `${htmlFor}-dica`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="font-mono text-label font-medium text-ink-secondary">
        {label}
        {obrigatorio ? (
          <span className="ml-1 text-micro text-ink-tertiary">obrigatório</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={idErro} role="alert" className="text-micro font-medium text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={idDica} className="text-micro text-ink-tertiary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Ids de erro/dica, para o leitor de tela anunciar junto do campo. */
  describedBy?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, describedBy, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        "flex h-10 w-full rounded-control border bg-surface-sunken px-2.5 py-1 text-ink-primary",
        "transition-colors duration-150",
        "focus:border-accent focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent/20",
        "disabled:cursor-not-allowed disabled:bg-surface-base disabled:opacity-60",
        invalid ? "border-danger" : "border-line hover:border-line-strong",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  describedBy?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, describedBy, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        "flex min-h-20 w-full resize-y rounded-control border bg-surface-sunken px-2.5 py-2 text-ink-primary",
        "transition-colors duration-150",
        "focus:border-accent focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent/20",
        "disabled:cursor-not-allowed disabled:bg-surface-base disabled:opacity-60",
        invalid ? "border-danger" : "border-line hover:border-line-strong",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
