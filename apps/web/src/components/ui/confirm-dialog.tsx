import type { ReactNode } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

/**
 * Confirmação para ação destrutiva. O botão que destrói é visualmente distinto do
 * que cancela: na única ação irreversível do produto, "Cancelar" e "Excluir" não
 * podem ser o mesmo botão duas vezes.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  titulo,
  descricao,
  rotuloConfirmar = "Excluir",
  onConfirm,
  loading = false,
  erro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descricao: ReactNode;
  rotuloConfirmar?: string;
  onConfirm: () => void;
  loading?: boolean;
  erro?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription asChild>
            <div className="break-words">{descricao}</div>
          </DialogDescription>
        </DialogHeader>

        {erro ? (
          <p role="alert" className="break-words text-label text-danger">
            {erro}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
