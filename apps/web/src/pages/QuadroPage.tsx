import {
  type Announcements,
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  type ScreenReaderInstructions,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, GripVertical, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CandidaturaDialog, useCandidaturaDialog } from "../components/CandidaturaDialog";
import { PageHeader } from "../components/layout/PageHeader";
import { MenuDeAcoes } from "../components/MenuDeAcoes";
import { StageDot } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { EmptyState, Skeleton } from "../components/ui/feedback";
import { InlineError } from "../components/ui/inline-error";
import { mensagemDeErro } from "../lib/errors";
import { candidaturasKeys, resumoKeys } from "../lib/query-keys";
import { useTituloDaPagina } from "../lib/useTitulo";
import { ALL_STATUSES, cn, ETAPAS, formatShortDate, plural, salarioCurto } from "../lib/utils";
import { useRegistrar } from "../registrar";
import { candidaturasApi } from "../services/api";
import type { Candidatura, StatusCandidatura } from "../types";

/** Etapas de desfecho: onde o processo terminou, não onde ele está. */
const DESFECHOS: readonly StatusCandidatura[] = ["APROVADO", "REJEITADO"];

function diasParada(etapaDesde: string): number {
  const inicio = new Date(etapaDesde).getTime();
  if (Number.isNaN(inicio)) return 0;
  return Math.max(0, Math.floor((Date.now() - inicio) / (24 * 60 * 60 * 1000)));
}

/** Instrução e anúncio do dnd-kit em português, com o nome do cartão e da coluna. */
const instrucoesAtalho: ScreenReaderInstructions = {
  draggable:
    "Pressione espaço para pegar o cartão, use as setas para escolher a coluna e espaço de novo para soltar. Escape cancela.",
};

function anuncios(nomePorId: Map<string, string>): Announcements {
  return {
    onDragStart: ({ active }) => {
      const nome = nomePorId.get(String(active.id)) ?? "Cartão";
      return `${nome} levantado. Use as setas para escolher a coluna e espaço para soltar.`;
    },
    onDragOver: ({ active, over }) => {
      const nome = nomePorId.get(String(active.id)) ?? "Cartão";
      if (!over) return `${nome} fora de qualquer coluna.`;
      const alvo = ETAPAS[over.id as StatusCandidatura]?.label ?? nomePorId.get(String(over.id));
      return alvo ? `${nome} sobre a coluna ${alvo}.` : `${nome} em movimento.`;
    },
    onDragEnd: ({ active, over }) => {
      const nome = nomePorId.get(String(active.id)) ?? "Cartão";
      if (!over) return `${nome} voltou para o lugar.`;
      const alvo = ETAPAS[over.id as StatusCandidatura]?.label;
      return alvo ? `${nome} movido para ${alvo}.` : `${nome} solto.`;
    },
    onDragCancel: ({ active }) =>
      `Movimento cancelado. ${nomePorId.get(String(active.id)) ?? "O cartão"} voltou para o lugar.`,
  };
}

function CartaoDoQuadro({
  candidatura,
  aoEditar,
  aoMover,
  isOverlay,
}: {
  candidatura: Candidatura;
  aoEditar?: (candidatura: Candidatura) => void;
  aoMover?: (candidatura: Candidatura, status: StatusCandidatura) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidatura.id,
  });

  const dias = diasParada(candidatura.etapa_desde);
  const salario = salarioCurto(candidatura.salario_estimado);
  const silencio = dias >= 14 && !DESFECHOS.includes(candidatura.status);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group rounded-card border border-line-subtle bg-surface-raised p-2.5",
        "transition-colors duration-100",
        isDragging && !isOverlay && "opacity-40",
        isOverlay ? "rotate-1 border-accent/50 shadow-overlay" : "hover:border-line",
      )}
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium leading-snug text-ink-primary">
            {candidatura.vaga_nome}
          </p>
          <p className="mt-0.5 truncate text-micro text-ink-tertiary">
            {candidatura.empresa?.nome ?? "–"}
          </p>
        </div>

        {aoMover && aoEditar ? (
          <MenuDeAcoes
            rotulo={`Ações de ${candidatura.vaga_nome}`}
            gatilho={
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-xs text-ink-tertiary transition-colors duration-100 hover:bg-surface-sunken hover:text-ink-primary">
                <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            }
            moverPara={ALL_STATUSES.filter((s) => s !== candidatura.status)}
            aoMover={(status) => aoMover(candidatura, status)}
            aoEditar={() => aoEditar(candidatura)}
          />
        ) : null}

        {!isOverlay ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Mover ${candidatura.vaga_nome} de etapa`}
            className={cn(
              "shrink-0 cursor-grab touch-none rounded-xs p-1.5 text-ink-tertiary active:cursor-grabbing",
              "transition-colors duration-100 hover:bg-surface-sunken hover:text-ink-primary",
            )}
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-2 text-micro tabular text-ink-tertiary">
        <span className="shrink-0">{formatShortDate(candidatura.data_aplicacao)}</span>

        {dias > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            {/* Peso maior quando o silêncio já passa de duas semanas: é o sinal
                que faz a pessoa agir, e o motivo de o cartão existir. */}
            <span className={cn("truncate", silencio && "font-medium text-danger")}>
              {plural(dias, "dia", "dias")} parada
            </span>
          </>
        ) : null}

        {candidatura.link_vaga ? (
          <a
            href={candidatura.link_vaga}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir o anúncio de ${candidatura.vaga_nome}`}
            className="ml-auto shrink-0 rounded-xs p-0.5 text-ink-tertiary transition-colors duration-100 hover:text-accent"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {salario ? (
        <p
          className="mt-1 truncate text-micro text-ink-secondary"
          title={candidatura.salario_estimado ?? undefined}
        >
          {salario}
        </p>
      ) : null}

      {candidatura.motivo_recusa && candidatura.status === "REJEITADO" ? (
        <p className="mt-1.5 line-clamp-2 text-micro text-ink-tertiary">
          {candidatura.motivo_recusa}
        </p>
      ) : null}
    </article>
  );
}

function Coluna({
  status,
  candidaturas,
  aoEditar,
  aoMover,
}: {
  status: StatusCandidatura;
  candidaturas: Candidatura[];
  aoEditar: (candidatura: Candidatura) => void;
  aoMover: (candidatura: Candidatura, status: StatusCandidatura) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className="flex min-w-0 flex-col gap-2 min-[900px]:h-full">
      <header className="flex items-center justify-between gap-1.5 border-b border-line-subtle pb-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <StageDot status={status} />
          {/* Rótulo curto no cabeçalho: sete colunas em 896px não comportam
              "Esperando resposta" sem truncar. O nome completo continua no menu
              do cartão, no filtro e no formulário. */}
          <h2 className="truncate text-label font-medium text-ink-primary">
            {ETAPAS[status].curto}
          </h2>
        </span>
        <span className="shrink-0 text-micro tabular text-ink-tertiary">{candidaturas.length}</span>
      </header>

      <ul
        ref={setNodeRef}
        aria-label={`${ETAPAS[status].label} – ${plural(candidaturas.length, "candidatura", "candidaturas")}`}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-card border border-dashed p-1.5 transition-colors duration-100",
          "min-[900px]:min-h-32",
          isOver ? "border-accent bg-accent-weak/50" : "border-line-subtle bg-surface-sunken/50",
        )}
      >
        <SortableContext
          items={candidaturas.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {candidaturas.map((c) => (
            <li key={c.id}>
              <CartaoDoQuadro candidatura={c} aoEditar={aoEditar} aoMover={aoMover} />
            </li>
          ))}
        </SortableContext>

        {candidaturas.length === 0 ? (
          <li className="flex min-h-20 items-center justify-center px-2 text-center text-micro text-ink-tertiary">
            {isOver ? "Solte aqui" : "Nada nesta etapa"}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

const deteccaoDeColisao: CollisionDetection = (args) => {
  const porPonteiro = pointerWithin(args);
  if (porPonteiro.length > 0) return porPonteiro;
  return closestCenter(args);
};

export function QuadroPage() {
  useTituloDaPagina("Quadro");
  const { abrir } = useRegistrar();
  const queryClient = useQueryClient();
  const [ativo, setAtivo] = useState<string | null>(null);
  const dialog = useCandidaturaDialog();

  const { data, isPending, error, refetch } = useQuery({
    queryKey: candidaturasKeys.lista({ ordenar: "paradas" }),
    queryFn: () => candidaturasApi.list({ ordenar: "paradas" }),
  });

  const candidaturas = data?.itens ?? [];

  const mover = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusCandidatura }) =>
      candidaturasApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturasKeys.all });
      queryClient.invalidateQueries({ queryKey: resumoKeys.all });
    },
  });

  // Arrastar funciona com mouse, toque (com atraso curto, para não virar scroll) e
  // teclado. O passo do teclado usa a coordenada da coluna, não 25px fixos.
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const porEtapa = ALL_STATUSES.reduce(
    (acc, status) => {
      acc[status] = candidaturas.filter((c) => c.status === status);
      return acc;
    },
    {} as Record<StatusCandidatura, Candidatura[]>,
  );

  const nomePorId = new Map(candidaturas.map((c) => [c.id, c.vaga_nome]));
  const cartaoAtivo = ativo ? candidaturas.find((c) => c.id === ativo) : null;

  function aoSoltar(evento: DragEndEvent) {
    setAtivo(null);
    const { active, over } = evento;
    if (!over) return;

    const idSobre = String(over.id);
    const destino = (ALL_STATUSES as readonly string[]).includes(idSobre)
      ? (idSobre as StatusCandidatura)
      : candidaturas.find((c) => c.id === idSobre)?.status;

    const candidatura = candidaturas.find((c) => c.id === String(active.id));
    if (!destino || !candidatura || candidatura.status === destino) return;

    mover.mutate({ id: candidatura.id, status: destino });
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4 xl:grid-cols-7">
          {ALL_STATUSES.map((status) => (
            <Skeleton key={status} className="h-44 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titulo="Quadro"
        contexto={
          candidaturas.length === 0
            ? "Nada no quadro ainda"
            : `${plural(candidaturas.length, "candidatura ativa", "candidaturas ativas")} organizadas por etapa`
        }
        acao={
          <Button size="sm" onClick={abrir}>
            Registrar candidatura
          </Button>
        }
      />

      {error ? (
        <InlineError message={mensagemDeErro(error, "carregar")} onRetry={() => refetch()} />
      ) : null}
      {mover.isError ? (
        <InlineError
          message={mensagemDeErro(mover.error, "salvar")}
          onRetry={() => mover.reset()}
        />
      ) : null}

      {candidaturas.length === 0 && !error ? (
        <EmptyState
          titulo="O quadro está vazio"
          descricao="Cada candidatura registrada vira um cartão aqui, e você move conforme o processo anda."
          acao={<Button onClick={abrir}>Registrar candidatura</Button>}
        />
      ) : (
        <DndContext
          sensors={sensores}
          collisionDetection={deteccaoDeColisao}
          accessibility={{
            announcements: anuncios(nomePorId),
            screenReaderInstructions: instrucoesAtalho,
          }}
          onDragStart={(e: DragStartEvent) => setAtivo(String(e.active.id))}
          onDragOver={(_e: DragOverEvent) => undefined}
          onDragEnd={aoSoltar}
          onDragCancel={() => setAtivo(null)}
        >
          {/* Abaixo de 900px as colunas rolam na horizontal; acima, cabem na tela. */}
          <div className="-mx-4 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 min-[900px]:mx-0 min-[900px]:grid min-[900px]:grid-cols-4 min-[900px]:items-stretch min-[900px]:overflow-visible min-[900px]:px-0 xl:grid-cols-7">
            {ALL_STATUSES.map((status) => (
              <div
                key={status}
                className="w-[240px] shrink-0 snap-start min-[900px]:h-full min-[900px]:w-auto"
              >
                <Coluna
                  status={status}
                  candidaturas={porEtapa[status] ?? []}
                  aoEditar={dialog.abrirEdicao}
                  aoMover={(candidatura, destino) =>
                    mover.mutate({ id: candidatura.id, status: destino })
                  }
                />
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
            {cartaoAtivo ? <CartaoDoQuadro candidatura={cartaoAtivo} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {candidaturas.length > 0 ? (
        <p className="text-micro text-ink-tertiary">
          Arraste para mover de etapa, ou use o menu do cartão.{" "}
          <Link to="/candidaturas" className="text-accent underline-offset-4 hover:underline">
            Ver a lista completa
          </Link>
        </p>
      ) : null}

      <CandidaturaDialog
        open={dialog.aberto}
        onOpenChange={dialog.onOpenChange}
        inicial={dialog.editando}
      />
    </div>
  );
}
