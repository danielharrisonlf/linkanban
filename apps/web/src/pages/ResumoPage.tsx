import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ActivityChart } from "../components/ui/activity-chart";
import { StageChip } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, Secao } from "../components/ui/card";
import { EmptyState, Skeleton, SkeletonCards } from "../components/ui/feedback";
import { FunnelChart } from "../components/ui/funnel-chart";
import { InlineError } from "../components/ui/inline-error";
import { StatCard, StatRow } from "../components/ui/stat-card";
import { mensagemDeErro } from "../lib/errors";
import { RECURSOS_DERIVADOS } from "../lib/query-keys";
import { useResumo } from "../lib/useResumo";
import { useTituloDaPagina } from "../lib/useTitulo";
import { ALL_STATUSES, ETAPAS, formatShortDate, plural } from "../lib/utils";
import { useRegistrar } from "../registrar";
import { followupsApi } from "../services/api";
import type { StatusCandidatura } from "../types";

function formatarPercentual(valor: string): string {
  const numero = Number.parseFloat(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: numero % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

const MOTIVO: Record<string, string> = {
  "sem-retorno": "sem retorno",
  "sem-followup": "sem cobrança agendada",
  "followup-vencido": "cobrança vencida",
};

export function ResumoPage() {
  useTituloDaPagina("Resumo");
  const { abrir } = useRegistrar();
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useResumo();

  /** Cobrar direto daqui: agenda para daqui a uma hora e sai do silêncio. */
  const cobrar = useMutation({
    mutationFn: (candidaturaId: string) =>
      followupsApi.create({
        candidatura_id: candidaturaId,
        data_prevista: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        nota: "Cobrança criada a partir do resumo",
      }),
    onSuccess: () => {
      for (const chave of RECURSOS_DERIVADOS) {
        queryClient.invalidateQueries({ queryKey: chave });
      }
    },
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <SkeletonCards count={4} />
        <Skeleton className="h-56 w-full rounded-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader titulo="Resumo" />
        <InlineError message={mensagemDeErro(error, "carregar")} onRetry={() => refetch()} />
      </div>
    );
  }

  const contagem = (status: StatusCandidatura) => data.por_status[status] ?? 0;
  const funil = ALL_STATUSES.map((status) => ({ status, total: contagem(status) }));
  const semResposta = contagem("APLICADO");
  const paradas = data.paradas ?? [];
  const vencidas = paradas.filter((item) => item.motivo === "followup-vencido");

  if (data.total === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          titulo="Resumo"
          contexto="Ainda sem candidaturas — o acompanhamento começa no primeiro registro."
        />
        <Card>
          <CardContent className="p-0">
            <EmptyState
              titulo="Nada para acompanhar ainda"
              descricao="Registre a primeira candidatura e o Fio passa a mostrar quem respondeu, quem sumiu e o que cobrar."
              acao={<Button onClick={abrir}>Registrar candidatura</Button>}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Resumo"
        contexto={plural(data.ativas, "candidatura em andamento", "candidaturas em andamento")}
        acao={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/quadro">Abrir o quadro</Link>
          </Button>
        }
      />

      <StatRow>
        <StatCard
          label="Esperando resposta"
          value={String(semResposta)}
          detalhe={semResposta === 0 ? "Nenhuma no silêncio" : "Ainda não disseram nada"}
        />
        <StatCard
          label="Taxa de resposta"
          value={formatarPercentual(data.taxa_resposta)}
          sufixo="%"
          detalhe={`${data.total_respondidas} de ${data.ativas} deram algum retorno`}
        />
        <StatCard
          label="Chegaram a entrevista"
          value={formatarPercentual(data.taxa_conversao)}
          sufixo="%"
          detalhe={`${data.total_entrevistas} avançaram`}
        />
        <StatCard
          label="Cobranças"
          value={String(data.followups_pendentes)}
          detalhe={data.followups_pendentes === 0 ? "Nenhuma agendada" : "Agendadas ou pendentes"}
          alerta={
            data.followups_vencidos > 0
              ? plural(data.followups_vencidos, "vencida", "vencidas")
              : undefined
          }
        />
      </StatRow>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Como está distribuído</CardTitle>
            <p className="text-micro text-ink-tertiary">
              Barra na escala da maior etapa, com o percentual sobre o total
            </p>
          </CardHeader>
          <CardContent>
            <FunnelChart dados={funil} total={data.ativas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ritmo de candidaturas</CardTitle>
            <p className="text-micro text-ink-tertiary">Últimas 8 semanas</p>
          </CardHeader>
          <CardContent>
            <ActivityChart dados={data.atividade_semanal} />
          </CardContent>
        </Card>
      </div>

      {paradas.length > 0 ? (
        <Secao
          titulo="Sem movimento"
          descricao="Passou de duas semanas sem mudar de etapa. Vale uma mensagem."
        >
          <ul className="flex flex-col divide-y divide-line-subtle">
            {paradas.slice(0, 5).map(({ candidatura, dias, motivo }) => (
              <li
                key={candidatura.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-ink-primary">
                    {candidatura.vaga_nome}
                  </span>
                  <span className="block truncate text-micro text-ink-tertiary">
                    {candidatura.empresa?.nome ?? "—"} · {ETAPAS[candidatura.status].frase} ·{" "}
                    {MOTIVO[motivo]}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-1 text-micro tabular text-ink-secondary">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {plural(dias, "dia", "dias")}
                </span>

                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  loading={cobrar.isPending && cobrar.variables === candidatura.id}
                  onClick={() => cobrar.mutate(candidatura.id)}
                >
                  Agendar cobrança
                </Button>
              </li>
            ))}
          </ul>
          {cobrar.isError ? (
            <InlineError
              message={mensagemDeErro(cobrar.error, "salvar")}
              className="mt-3"
              onRetry={() => cobrar.reset()}
            />
          ) : null}
        </Secao>
      ) : null}

      {vencidas.length > 0 ? (
        <Secao
          titulo="Cobranças vencidas"
          acao={
            <Button variant="link" size="sm" asChild>
              <Link to="/follow-ups">Ver todas</Link>
            </Button>
          }
        >
          <ul className="flex flex-col divide-y divide-line-subtle">
            {vencidas.slice(0, 3).map(({ candidatura }) => (
              <li key={candidatura.id} className="flex items-center gap-3 py-2.5">
                <BellRing className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-body text-ink-primary">
                  {candidatura.vaga_nome}
                </span>
                <StageChip status={candidatura.status} />
                <span className="shrink-0 text-micro text-ink-tertiary">
                  {formatShortDate(candidatura.etapa_desde)}
                </span>
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}
    </div>
  );
}
