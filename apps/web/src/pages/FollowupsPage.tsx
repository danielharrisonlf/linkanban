import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarClock, Check, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ConfirmationDeResultado } from "../components/ResultadoDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { EmptyState, SkeletonRows } from "../components/ui/feedback";
import { InlineError, Notice } from "../components/ui/inline-error";
import { Field, Input, Textarea } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAviso } from "../components/ui/toast";
import { mensagemDeErro } from "../lib/errors";
import { candidaturasKeys, followupsKeys, resumoKeys } from "../lib/query-keys";
import { useTituloDaPagina } from "../lib/useTitulo";
import {
  cn,
  formatDateTime,
  plural,
  toDateTimeLocal,
  type Urgencia,
  urgenciaFollowup,
} from "../lib/utils";
import { candidaturasApi, followupsApi } from "../services/api";
import type { FollowUp, ResultadoFollowup } from "../types";

const ESTILO_URGENCIA: Record<Urgencia, string> = {
  atrasado: "text-danger",
  hoje: "text-warning",
  futuro: "text-ink-secondary",
  concluido: "text-ink-tertiary",
};

const ROTULO_URGENCIA: Record<Urgencia, string> = {
  atrasado: "Vencida",
  hoje: "Hoje",
  futuro: "Agendada",
  concluido: "Concluída",
};

export const ROTULO_RESULTADO: Record<ResultadoFollowup, string> = {
  RESPONDERAM: "Responderam",
  SEM_RESPOSTA: "Sem resposta",
  ADIARAM: "Pediram para aguardar",
  ENCERRARAM: "Encerraram o processo",
};

function FormularioNovoFollowup({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { avisar } = useAviso();
  const [candidaturaId, setCandidaturaId] = useState("");
  const [dataPrevista, setDataPrevista] = useState(
    toDateTimeLocal(new Date(Date.now() + 3 * 86400000)),
  );
  const [nota, setNota] = useState("");
  const [tocado, setTocado] = useState(false);

  const { data } = useQuery({
    queryKey: candidaturasKeys.lista({ ordenar: "paradas" }),
    queryFn: () => candidaturasApi.list({ ordenar: "paradas" }),
  });
  const candidaturas = data?.itens ?? [];

  const criar = useMutation({
    mutationFn: () =>
      followupsApi.create({
        candidatura_id: candidaturaId,
        data_prevista: new Date(dataPrevista).toISOString(),
        nota: nota.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all });
      queryClient.invalidateQueries({ queryKey: resumoKeys.all });
      avisar({ titulo: "Cobrança agendada.", tom: "sucesso" });
      onSuccess();
    },
  });

  if (candidaturas.length === 0) {
    return (
      <EmptyState
        titulo="Nenhuma candidatura para acompanhar"
        descricao="Todo follow-up pertence a uma candidatura. Registre a primeira para poder agendar."
        acao={
          <Button asChild>
            <Link to="/candidaturas">Ver candidaturas</Link>
          </Button>
        }
      />
    );
  }

  const erroData = tocado && !dataPrevista ? "Escolha quando quer cobrar." : undefined;

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        setTocado(true);
        if (!candidaturaId || !dataPrevista) return;
        criar.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Qual candidatura" htmlFor="fu-candidatura" obrigatorio>
        <Select value={candidaturaId} onValueChange={setCandidaturaId}>
          <SelectTrigger id="fu-candidatura">
            <SelectValue placeholder="Escolher candidatura" />
          </SelectTrigger>
          <SelectContent>
            {candidaturas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.vaga_nome} – {c.empresa?.nome ?? "sem empresa"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Quando cobrar"
        htmlFor="fu-data"
        obrigatorio
        error={erroData}
        hint="A data e a hora em que você quer retomar esse contato"
      >
        <Input
          id="fu-data"
          type="datetime-local"
          value={dataPrevista}
          onChange={(e) => setDataPrevista(e.target.value)}
          invalid={Boolean(erroData)}
          describedBy={erroData ? "fu-data-erro" : "fu-data-dica"}
        />
      </Field>

      <Field
        label="O que você combinou"
        htmlFor="fu-nota"
        hint="Opcional, mas ajuda na hora de escrever"
      >
        <Textarea
          id="fu-nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ex: falaram que retornam até sexta"
          rows={2}
        />
      </Field>

      {criar.isError ? <InlineError message={mensagemDeErro(criar.error, "salvar")} /> : null}

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" loading={criar.isPending} disabled={!candidaturaId || !dataPrevista}>
          Agendar
        </Button>
      </DialogFooter>
    </form>
  );
}

function ItemDeFollowup({
  followup,
  onRegistrar,
  onAlternar,
}: {
  followup: FollowUp;
  onRegistrar: (followup: FollowUp) => void;
  onAlternar: (followup: FollowUp) => void;
}) {
  const urgencia = urgenciaFollowup(followup.data_prevista, followup.feito);
  const id = `followup-${followup.id}`;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={followup.feito}
          onChange={() => onAlternar(followup)}
          className={cn(
            "peer h-5 w-5 cursor-pointer appearance-none rounded-xs border bg-surface-raised",
            "transition-colors duration-100",
            "checked:border-success checked:bg-success/15",
            followup.feito ? "border-line" : "border-line-strong hover:border-accent",
          )}
        />
        <Check
          className={cn(
            "pointer-events-none absolute h-3 w-3 text-success",
            followup.feito ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
      </span>

      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span
          className={cn(
            "block truncate text-body font-medium",
            followup.feito ? "text-ink-tertiary line-through" : "text-ink-primary",
          )}
        >
          {followup.candidatura?.vaga_nome ?? "Candidatura removida"}
        </span>
        <span className="block truncate text-micro text-ink-tertiary">
          {followup.candidatura?.empresa?.nome ?? "–"}
          {followup.nota ? ` · ${followup.nota}` : ""}
        </span>
      </label>

      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-micro tabular",
          ESTILO_URGENCIA[urgencia],
        )}
      >
        <CalendarClock className="h-3 w-3" aria-hidden="true" />
        <span className="font-medium">{ROTULO_URGENCIA[urgencia]}</span>
        <span className="max-sm:hidden">{formatDateTime(followup.data_prevista)}</span>
      </span>

      {followup.resultado ? (
        <Badge className="shrink-0">{ROTULO_RESULTADO[followup.resultado]}</Badge>
      ) : !followup.feito ? (
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={() => onRegistrar(followup)}
        >
          Registrar resultado
        </Button>
      ) : null}
    </li>
  );
}

export function FollowupsPage() {
  useTituloDaPagina("Follow-ups");
  const queryClient = useQueryClient();
  const [novoAberto, setNovoAberto] = useState(false);
  const [registrando, setRegistrando] = useState<FollowUp | undefined>();

  const {
    data: followups = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: followupsKeys.lista(),
    queryFn: followupsApi.list,
  });

  const alternar = useMutation({
    mutationFn: (followup: FollowUp) =>
      followupsApi.update(followup.id, { feito: !followup.feito }),
    onMutate: async (followup) => {
      await queryClient.cancelQueries({ queryKey: followupsKeys.all });
      const anterior = queryClient.getQueryData<FollowUp[]>(followupsKeys.lista());
      queryClient.setQueryData<FollowUp[]>(
        followupsKeys.lista(),
        (atual) => atual?.map((f) => (f.id === followup.id ? { ...f, feito: !f.feito } : f)) ?? [],
      );
      return { anterior };
    },
    onError: (_e, _v, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(followupsKeys.lista(), contexto.anterior);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: followupsKeys.all });
      queryClient.invalidateQueries({ queryKey: resumoKeys.all });
    },
  });

  const pendentes = followups
    .filter((f) => !f.feito)
    .sort((a, b) => new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime());
  const concluidos = followups.filter((f) => f.feito);
  const atrasadas = pendentes.filter(
    (f) => urgenciaFollowup(f.data_prevista, f.feito) === "atrasado",
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titulo="Follow-ups"
        contexto={
          pendentes.length === 0
            ? "Nenhuma cobrança pendente"
            : `${plural(pendentes.length, "cobrança pendente", "cobranças pendentes")}${
                atrasadas > 0 ? ` · ${plural(atrasadas, "vencida", "vencidas")}` : ""
              }`
        }
        acao={
          <Button size="sm" onClick={() => setNovoAberto(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Novo follow-up
          </Button>
        }
      />

      {error ? (
        <InlineError message={mensagemDeErro(error, "carregar")} onRetry={() => refetch()} />
      ) : null}
      {alternar.isError ? (
        <InlineError
          message={mensagemDeErro(alternar.error, "salvar")}
          onRetry={() => alternar.reset()}
        />
      ) : null}

      {isPending ? (
        <SkeletonRows rows={5} />
      ) : followups.length === 0 ? (
        <EmptyState
          titulo="Nenhuma cobrança agendada"
          descricao="Agende quando cobrar retorno. O que você não cobra é o que fica sem resposta – e o Fio lembra por você."
          acao={<Button onClick={() => setNovoAberto(true)}>Agendar cobrança</Button>}
        />
      ) : (
        <>
          <section className="flex flex-col" aria-labelledby="titulo-pendentes">
            <div className="flex items-center justify-between gap-3 border-b border-line-subtle pb-2">
              <h2 id="titulo-pendentes" className="text-body font-semibold text-ink-primary">
                Pendentes
              </h2>
              <Badge className="tabular">{pendentes.length}</Badge>
            </div>
            {pendentes.length === 0 ? (
              <p className="py-3 text-label text-ink-tertiary">
                Nada pendente. Agende uma cobrança e ela aparece aqui.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line-subtle">
                {pendentes.map((f) => (
                  <ItemDeFollowup
                    key={f.id}
                    followup={f}
                    onRegistrar={setRegistrando}
                    onAlternar={(alvo) => alternar.mutate(alvo)}
                  />
                ))}
              </ul>
            )}
          </section>

          {concluidos.length > 0 ? (
            <section className="flex flex-col" aria-labelledby="titulo-concluidos">
              <div className="flex items-center justify-between gap-3 border-b border-line-subtle pb-2">
                <h2 id="titulo-concluidos" className="text-body font-semibold text-ink-secondary">
                  Concluídos
                </h2>
                <Badge className="tabular">{concluidos.length}</Badge>
              </div>
              <ul className="flex flex-col divide-y divide-line-subtle">
                {concluidos.map((f) => (
                  <ItemDeFollowup
                    key={f.id}
                    followup={f}
                    onRegistrar={setRegistrando}
                    onAlternar={(alvo) => alternar.mutate(alvo)}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {pendentes.some((f) => urgenciaFollowup(f.data_prevista, f.feito) === "atrasado") ? (
        <Notice>
          Cobrança vencida não é atraso seu – é processo parado. Registrar o resultado move a
          candidatura sozinho.
        </Notice>
      ) : null}

      <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova cobrança</DialogTitle>
            <DialogDescription>
              Marque quando cobrar retorno. O que vence aparece no resumo.
            </DialogDescription>
          </DialogHeader>
          <FormularioNovoFollowup onSuccess={() => setNovoAberto(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmationDeResultado
        followup={registrando}
        onOpenChange={(aberto) => {
          if (!aberto) setRegistrando(undefined);
        }}
      />

      {pendentes.length === 0 && followups.length > 0 ? (
        <p className="flex items-center gap-1.5 text-micro text-ink-tertiary">
          <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          Nada vencido. {plural(concluidos.length, "cobrança concluída", "cobranças concluídas")}{" "}
          até agora.
        </p>
      ) : null}
    </div>
  );
}
