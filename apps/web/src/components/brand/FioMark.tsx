import { cn } from "../../lib/utils";

/**
 * Símbolo do Fio: um traço contínuo que percorre na horizontal e sobe uma vez —
 * o percurso de um processo que avança de etapa, agora com dois nós de sinal.
 *
 * Um traço só, sem preenchimento, sem gradiente, sem caixa em volta. Desenhado
 * numa grade de 24 com traço de 2 e ponta arredondada, funciona de 16px
 * (favicon) a 200px sem virar outra coisa.
 */
export function FioMark({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      {...props}
    >
      <path d="M2 18h9.5a3 3 0 0 0 2.4-1.2L20 7" />
      <circle cx="2" cy="18" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="20" cy="7" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Assinatura completa: símbolo + palavra em sans preciso de interface.
 */
export function FioWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <FioMark className="h-4 w-4 text-accent" />
      <span className="font-display text-title font-semibold leading-none text-ink-primary">
        Fio
      </span>
    </span>
  );
}
