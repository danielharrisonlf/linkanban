import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { mensagemDeErro } from "../lib/errors";
import { candidaturasKeys, followupsKeys, resumoKeys } from "../lib/query-keys";
import { cn, toDateTimeLocal } from "../lib/utils";
import { followupsApi } from "../services/api";
import type { FollowUp, ResultadoFollowup } from "../types";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { InlineError } from "./ui/inline-error";
import { Field, Input, Textarea } from "./ui/input";
import { useAviso } from "./ui/toast";

const OPCOES: { valor: ResultadoFollowup; titulo: string; descricao: string }[] = [
  {
    valor: "RESPONDERAM",
    titulo: "Responderam",
    descricao: "A candidatura sai do silêncio e passa a esperar resposta.",
  },
  {
    valor: "SEM_RESPOSTA",
    titulo: "Não responderam",
    descricao: "Continua parada. Você pode agendar outra cobrança depois.",
  },
  {
    valor: "ADIARAM",
    titulo: "Pediram para aguardar",
    descricao: "Você escolhe a nova data e a cobrança continua aberta.",
  },
  {
    valor: "ENCERRARAM",
    titulo: "Encerraram o processo",
    descricao: "A candidatura é marcada como Não seguiu, com o motivo que você escrever.",
  },
];

/**
 * Registrar o que aconteceu quando você cobrou. É o que separa um lembrete de um
 * histórico: escolher "encerraram" já move a candidatura, e "responderam" tira ela
 * do silêncio — sem você ter que ir no quadro mudar de coluna.
 */
export function ConfirmationDeResultado({
  followup,
  onOpenChange,
}: {
  followup: FollowUp | undefined;
  onOpenChange: (aberto: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { avisar } = useAviso();
  const [resultado, setResultado] = useState<ResultadoFollowup>("RESPONDERAM");
  const [nota, setNota] = useState("");
  const [reagendar, setReagendar] = useState(toDateTimeLocal(new Date(Date.now() + 7 * 86400000)));

  const salvar = useMutation({
    mutationFn: () =>
      followupsApi.registrarResultado(followup?.id ?? "", {
        resultado,
        nota: nota.trim() || null,
        reagendar_para: resultado === "ADIARAM" ? new Date(reagendar).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all });
      queryClient.invalidateQueries({ queryKey: candidaturasKeys.all });
      queryClient.invalidateQueries({ queryKey: resumoKeys.all });
      avisar({ titulo: "Resultado registrado.", tom: "sucesso" });
      setNota("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={Boolean(followup)}
      onOpenChange={(aberto) => {
        if (!aberto) {
          setNota("");
          setResultado("RESPONDERAM");
          salvar.reset();
        }
        onOpenChange(aberto);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>O que aconteceu?</DialogTitle>
          <DialogDescription>
            {followup?.candidatura?.vaga_nome ?? "Candidatura"}
            {followup?.candidatura?.empresa?.nome ? ` · ${followup.candidatura.empresa.nome}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            salvar.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label font-medium text-ink-secondary">Resultado</legend>
            {OPCOES.map((opcao) => (
              <label
                key={opcao.valor}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-control border p-2.5 transition-colors duration-100",
                  resultado === opcao.valor
                    ? "border-accent bg-accent-weak"
                    : "border-line-subtle hover:bg-surface-hover",
                )}
              >
                <input
                  type="radio"
                  name="resultado"
                  value={opcao.valor}
                  checked={resultado === opcao.valor}
                  onChange={() => setResultado(opcao.valor)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-accent"
                />
                <span className="min-w-0">
                  <span className="block text-label font-medium text-ink-primary">
                    {opcao.titulo}
                  </span>
                  <span className="block text-micro text-ink-tertiary">{opcao.descricao}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {resultado === "ADIARAM" ? (
            <Field label="Nova data de cobrança" htmlFor="res-data" obrigatorio>
              <Input
                id="res-data"
                type="datetime-local"
                value={reagendar}
                onChange={(e) => setReagendar(e.target.value)}
                required
              />
            </Field>
          ) : null}

          <Field
            label={resultado === "ENCERRARAM" ? "O que eles disseram" : "Anotação"}
            htmlFor="res-nota"
            hint={
              resultado === "ENCERRARAM"
                ? "Guardar o motivo transforma a recusa em algo aproveitável"
                : "Opcional — o que ficou combinado"
            }
          >
            <Textarea
              id="res-nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={
                resultado === "ENCERRARAM"
                  ? "Ex: buscavam alguém com experiência em mensageria"
                  : "Ex: pediram para retomar na semana que vem"
              }
              rows={2}
            />
          </Field>

          {salvar.isError ? <InlineError message={mensagemDeErro(salvar.error, "salvar")} /> : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={salvar.isPending}>
              Salvar resultado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
