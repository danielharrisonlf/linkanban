import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Pencil } from "lucide-react";
import { cn, ETAPAS } from "../lib/utils";
import type { StatusCandidatura } from "../types";

/**
 * Menu de ações do cartão. Existe porque arrastar não é o único jeito de mover —
 * no toque é impreciso e no teclado custa muitas teclas. Aqui a mudança de etapa
 * é escolha explícita, e o mesmo menu abre a edição.
 */
export function MenuDeAcoes({
  rotulo,
  gatilho,
  moverPara,
  aoMover,
  aoEditar,
}: {
  rotulo: string;
  gatilho: React.ReactNode;
  moverPara: readonly StatusCandidatura[];
  aoMover: (status: StatusCandidatura) => void;
  aoEditar: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger aria-label={rotulo} className="shrink-0">
        {gatilho}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={cn(
            "z-50 min-w-52 rounded-card border border-line bg-surface-overlay p-1 shadow-overlay",
            "data-[state=open]:[animation:popover-in_130ms_var(--ease-out-quint)]",
          )}
        >
          <DropdownMenu.Item
            onSelect={aoEditar}
            className="flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-label text-ink-primary outline-none data-[highlighted]:bg-surface-sunken"
          >
            <Pencil className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden="true" />
            Editar candidatura
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-line-subtle" />

          <DropdownMenu.Label className="px-2 py-1 text-micro uppercase tracking-[0.06em] text-ink-tertiary">
            Mover para
          </DropdownMenu.Label>

          {moverPara.map((status) => (
            <DropdownMenu.Item
              key={status}
              onSelect={() => aoMover(status)}
              className="flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-label text-ink-primary outline-none data-[highlighted]:bg-surface-sunken"
            >
              <Check className="h-3.5 w-3.5 opacity-0" aria-hidden="true" />
              {ETAPAS[status].label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
