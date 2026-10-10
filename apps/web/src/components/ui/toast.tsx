import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

type Tom = "neutro" | "sucesso" | "erro";

interface Aviso {
  id: number;
  titulo: string;
  descricao?: string;
  tom: Tom;
  acao?: { rotulo: string; onClick: () => void };
  duracao?: number;
}

interface ContextoAvisos {
  avisar: (aviso: Omit<Aviso, "id">) => void;
}

const Contexto = React.createContext<ContextoAvisos | null>(null);

/**
 * Aviso curto de que algo aconteceu, para ações cujo resultado não fica visível
 * onde o clique aconteceu (salvar um formulário longo fecha o painel; excluir
 * some com a linha). Feedback que dá para mostrar junto do gatilho continua
 * junto do gatilho — isto aqui não substitui o estado de erro do campo.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = React.useState<Aviso[]>([]);
  const proximoId = React.useRef(0);

  const avisar = React.useCallback((aviso: Omit<Aviso, "id">) => {
    proximoId.current += 1;
    setAvisos((atual) => [...atual.slice(-2), { ...aviso, id: proximoId.current }]);
  }, []);

  const remover = React.useCallback((id: number) => {
    setAvisos((atual) => atual.filter((a) => a.id !== id));
  }, []);

  const valor = React.useMemo(() => ({ avisar }), [avisar]);

  return (
    <Contexto.Provider value={valor}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {avisos.map((aviso) => (
          <ToastPrimitive.Root
            key={aviso.id}
            data-slot="toast"
            onOpenChange={(aberto) => {
              if (!aberto) remover(aviso.id);
            }}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-card border bg-surface-overlay p-3 shadow-overlay",
              aviso.tom === "erro" ? "border-danger/50" : "border-line",
            )}
          >
            <div className="min-w-0 flex-1">
              <ToastPrimitive.Title className="text-label font-medium text-ink-primary">
                {aviso.titulo}
              </ToastPrimitive.Title>
              {aviso.descricao ? (
                <ToastPrimitive.Description className="mt-0.5 text-micro text-ink-secondary">
                  {aviso.descricao}
                </ToastPrimitive.Description>
              ) : null}
            </div>

            {aviso.acao ? (
              <ToastPrimitive.Action
                altText={aviso.acao.rotulo}
                onClick={aviso.acao.onClick}
                className="shrink-0 rounded-control px-1.5 py-0.5 text-label font-medium text-accent hover:underline underline-offset-4"
              >
                {aviso.acao.rotulo}
              </ToastPrimitive.Action>
            ) : null}

            <ToastPrimitive.Close
              aria-label="Fechar aviso"
              className="shrink-0 rounded-control p-0.5 text-ink-tertiary transition-colors duration-100 hover:bg-surface-sunken hover:text-ink-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="pointer-events-none fixed bottom-0 right-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 max-sm:left-0 max-sm:right-0 max-sm:mx-auto" />
      </ToastPrimitive.Provider>
    </Contexto.Provider>
  );
}

export function useAviso() {
  const contexto = React.useContext(Contexto);
  if (!contexto) {
    throw new Error("useAviso precisa estar dentro de <ToastProvider>");
  }
  return contexto;
}
