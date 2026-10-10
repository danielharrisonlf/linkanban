import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CandidaturaDialog, useCandidaturaDialog } from "../components/CandidaturaDialog";
import { PageHeader } from "../components/layout/PageHeader";
import { StageChip } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { EmptyState, SkeletonRows } from "../components/ui/feedback";
import { InlineError } from "../components/ui/inline-error";
import { Input } from "../components/ui/input";
import { useAviso } from "../components/ui/toast";
import { mensagemDeErro } from "../lib/errors";
import { candidaturasKeys, resumoKeys } from "../lib/query-keys";
import { useTituloDaPagina } from "../lib/useTitulo";
import { ALL_STATUSES, cn, ETAPAS, formatDate, plural } from "../lib/utils";
import { useRegistrar } from "../registrar";
import { candidaturasApi, type FiltroCandidaturas } from "../services/api";
import type { Candidatura, StatusCandidatura } from "../types";

const ORDENACOES: { valor: NonNullable<FiltroCandidaturas["ordenar"]>; label: string }[] = [
  { valor: "recentes", label: "Mais recentes" },
  { valor: "antigas", label: "Mais antigas" },
  { valor: "paradas", label: "Paradas há mais tempo" },
  { valor: "empresa", label: "Empresa" },
  { valor: "etapa", label: "Etapa" },
];

const CLASSE_SELECT =
  "h-9 rounded-control border border-line bg-surface-raised px-2 text-ink-primary transition-colors duration-100 hover:border-line-strong";
const LIMITE_PAGINA = 50;

export function CandidaturasPage() {
  useTituloDaPagina("Candidaturas");
  const abrirRegistrar = useRegistrar().abrir;
  const queryClient = useQueryClient();
  const { avisar } = useAviso();
  const dialog = useCandidaturaDialog();

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<StatusCandidatura | "">("");
  const [ordenar, setOrdenar] = useState<NonNullable<FiltroCandidaturas["ordenar"]>>("recentes");
  const [incluirArquivadas, setIncluirArquivadas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [excluindo, setExcluindo] = useState<Candidatura | undefined>();

  const filtro: FiltroCandidaturas = {
    busca: busca.trim() || undefined,
    status: status || undefined,
    ordenar,
    incluirArquivadas,
    pagina,
    limite: LIMITE_PAGINA,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: reinicia a página ao trocar qualquer filtro
  useEffect(() => {
    setPagina(1);
  }, [busca, status, ordenar, incluirArquivadas]);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: candidaturasKeys.lista(filtro),
    queryFn: () => candidaturasApi.list(filtro),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: candidaturasKeys.all });
    queryClient.invalidateQueries({ queryKey: resumoKeys.all });
  };

  const arquivar = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      candidaturasApi.arquivar(id, ativa),
    onSuccess: (candidatura) => {
      invalidar();
      avisar({
        titulo: candidatura.ativa ? "Candidatura reativada." : "Candidatura arquivada.",
        descricao: candidatura.ativa
          ? undefined
          : "Ela sai do quadro, mas o histórico continua guardado.",
        tom: "sucesso",
        acao: {
          rotulo: "Desfazer",
          onClick: () => arquivar.mutate({ id: candidatura.id, ativa: !candidatura.ativa }),
        },
      });
    },
  });

  const excluir = useMutation({
    mutationFn: (candidatura: Candidatura) => candidaturasApi.delete(candidatura.id),
    onSuccess: (apagada) => {
      invalidar();
      setExcluindo(undefined);
      // Excluir sempre oferece volta: é a única ação irreversível do produto.
      avisar({
        titulo: "Candidatura excluída.",
        descricao: apagada.vaga_nome,
        tom: "sucesso",
        acao: {
          rotulo: "Desfazer",
          onClick: () => {
            candidaturasApi
              .restaurar(apagada)
              .then(() => {
                invalidar();
                avisar({ titulo: "Candidatura restaurada.", tom: "sucesso" });
              })
              .catch(() => avisar({ titulo: "Não foi possível restaurar.", tom: "erro" }));
          },
        },
      });
    },
  });

  const itens = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_PAGINA));
  const filtrando = Boolean(busca.trim() || status || incluirArquivadas);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titulo="Candidaturas"
        contexto={
          total === 0 && !filtrando
            ? "Registre a primeira candidatura para começar"
            : plural(total, "candidatura", "candidaturas")
        }
        acao={
          <Button size="sm" onClick={abrirRegistrar}>
            Registrar candidatura
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="busca" className="mb-1 block text-micro text-ink-tertiary">
            Buscar
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary"
              aria-hidden="true"
            />
            <Input
              id="busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Cargo, empresa ou onde encontrou"
              className="pl-8"
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filtro-etapa" className="mb-1 block text-micro text-ink-tertiary">
            Etapa
          </label>
          <select
            id="filtro-etapa"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusCandidatura | "")}
            className={CLASSE_SELECT}
          >
            <option value="">Todas</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ETAPAS[s].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ordenar" className="mb-1 block text-micro text-ink-tertiary">
            Ordenar por
          </label>
          <select
            id="ordenar"
            value={ordenar}
            onChange={(e) =>
              setOrdenar(e.target.value as NonNullable<FiltroCandidaturas["ordenar"]>)
            }
            className={CLASSE_SELECT}
          >
            {ORDENACOES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex h-9 cursor-pointer items-center gap-2 text-label text-ink-secondary">
          <input
            type="checkbox"
            checked={incluirArquivadas}
            onChange={(e) => setIncluirArquivadas(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded-xs border border-line-strong accent-accent"
          />
          Incluir arquivadas
        </label>
      </div>

      {error ? (
        <InlineError message={mensagemDeErro(error, "carregar")} onRetry={() => refetch()} />
      ) : null}

      {isPending ? (
        <SkeletonRows rows={6} />
      ) : itens.length === 0 ? (
        filtrando ? (
          <EmptyState
            titulo="Nenhuma candidatura com esse filtro"
            descricao="Tente outro termo ou limpe os filtros para ver tudo."
            acao={
              <Button
                variant="secondary"
                onClick={() => {
                  setBusca("");
                  setStatus("");
                  setIncluirArquivadas(false);
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            titulo="Nenhuma candidatura registrada"
            descricao="Comece pela candidatura que você enviou. Ela aparece no quadro e no resumo."
            acao={<Button onClick={abrirRegistrar}>Registrar candidatura</Button>}
          />
        )
      ) : (
        <>
          {/* Tabela a partir de md; abaixo disso a mesma informação vira cartão. */}
          <table className="hidden w-full text-body md:table">
            <caption className="apenas-leitor">Suas candidaturas</caption>
            <thead>
              <tr className="border-b border-line text-left text-micro text-ink-tertiary">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Cargo
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Empresa
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Etapa
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Aplicou em
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Faixa
                </th>
                <th scope="col" className="w-24 py-2">
                  <span className="apenas-leitor">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.map((c) => (
                <tr
                  key={c.id}
                  className={cn(
                    "border-b border-line-subtle transition-colors duration-100 hover:bg-surface-hover",
                    !c.ativa && "opacity-60",
                  )}
                >
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-ink-primary">{c.vaga_nome}</span>
                    {!c.ativa ? (
                      <span className="ml-2 text-micro text-ink-tertiary">arquivada</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4 text-ink-secondary">{c.empresa?.nome ?? "—"}</td>
                  <td className="py-2.5 pr-4">
                    <StageChip status={c.status} />
                  </td>
                  <td className="py-2.5 pr-4 tabular text-ink-secondary">
                    {formatDate(c.data_aplicacao)}
                  </td>
                  <td className="py-2.5 pr-4 text-ink-secondary">{c.salario_estimado || "—"}</td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${c.vaga_nome}`}
                        onClick={() => dialog.abrirEdicao(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={c.ativa ? `Arquivar ${c.vaga_nome}` : `Reativar ${c.vaga_nome}`}
                        onClick={() => arquivar.mutate({ id: c.id, ativa: !c.ativa })}
                      >
                        {c.ativa ? (
                          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir ${c.vaga_nome}`}
                        className="hover:text-danger"
                        onClick={() => setExcluindo(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col divide-y divide-line-subtle md:hidden">
            {itens.map((c) => (
              <li key={c.id} className={cn("flex flex-col gap-2 py-3", !c.ativa && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body font-medium text-ink-primary">{c.vaga_nome}</p>
                    <p className="text-micro text-ink-tertiary">{c.empresa?.nome ?? "—"}</p>
                  </div>
                  <StageChip status={c.status} />
                </div>

                <p className="text-micro tabular text-ink-tertiary">
                  Aplicou em {formatDate(c.data_aplicacao)}
                  {c.salario_estimado ? ` · ${c.salario_estimado}` : ""}
                  {c.origem ? ` · ${c.origem}` : ""}
                </p>

                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => dialog.abrirEdicao(c)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => arquivar.mutate({ id: c.id, ativa: !c.ativa })}
                  >
                    {c.ativa ? (
                      <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {c.ativa ? "Arquivar" : "Reativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto hover:text-danger"
                    onClick={() => setExcluindo(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 ? (
            <div className="flex items-center justify-between gap-3 text-micro text-ink-tertiary">
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina === 1}
                  onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CandidaturaDialog
        open={dialog.aberto}
        onOpenChange={dialog.onOpenChange}
        inicial={dialog.editando}
      />

      <ConfirmDialog
        open={Boolean(excluindo)}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setExcluindo(undefined);
            excluir.reset();
          }
        }}
        titulo="Excluir candidatura"
        descricao={
          <>
            <strong className="font-medium text-ink-primary">{excluindo?.vaga_nome}</strong> sai do
            quadro, junto com os follow-ups dela. Dá para desfazer logo depois de excluir.
          </>
        }
        onConfirm={() => excluindo && excluir.mutate(excluindo)}
        loading={excluir.isPending}
        erro={excluir.isError ? mensagemDeErro(excluir.error, "excluir") : null}
      />
    </div>
  );
}
