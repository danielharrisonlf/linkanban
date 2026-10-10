import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmpresaDialog } from "../components/EmpresaDialog";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { EmptyState, SkeletonRows } from "../components/ui/feedback";
import { InlineError } from "../components/ui/inline-error";
import { Input } from "../components/ui/input";
import { useAviso } from "../components/ui/toast";
import { mensagemDeErro } from "../lib/errors";
import { empresasKeys } from "../lib/query-keys";
import { useTituloDaPagina } from "../lib/useTitulo";
import { plural } from "../lib/utils";
import { empresasApi } from "../services/api";
import type { Empresa } from "../types";

type EmpresaComContagem = Empresa & { _count?: { candidaturas: number } };

export function EmpresasPage() {
  useTituloDaPagina("Empresas");
  const queryClient = useQueryClient();
  const { avisar } = useAviso();

  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Empresa | undefined>();
  const [formAberto, setFormAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<EmpresaComContagem | undefined>();

  const {
    data: empresas = [],
    isPending,
    error,
    refetch,
  } = useQuery({ queryKey: empresasKeys.lista(), queryFn: empresasApi.list });

  const excluir = useMutation({
    mutationFn: (empresa: EmpresaComContagem) => empresasApi.delete(empresa.id),
    onSuccess: (_r, empresa) => {
      queryClient.invalidateQueries({ queryKey: empresasKeys.all });
      setExcluindo(undefined);
      avisar({ titulo: "Empresa excluída.", descricao: empresa.nome, tom: "sucesso" });
    },
  });

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? empresas.filter((e) =>
        [e.nome, e.stack_principal, e.estado, e.modelo_trabalho].some((valor) =>
          (valor ?? "").toLowerCase().includes(termo),
        ),
      )
    : empresas;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titulo="Empresas"
        contexto={
          empresas.length === 0
            ? "Cadastre as empresas para as quais você está aplicando"
            : plural(empresas.length, "empresa cadastrada", "empresas cadastradas")
        }
        acao={
          <Button
            size="sm"
            onClick={() => {
              setEditando(undefined);
              setFormAberto(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Nova empresa
          </Button>
        }
      />

      {empresas.length > 0 ? (
        <div className="max-w-sm">
          <label htmlFor="busca-empresas" className="mb-1 block text-micro text-ink-tertiary">
            Buscar
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary"
              aria-hidden="true"
            />
            <Input
              id="busca-empresas"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, tecnologias ou região"
              className="pl-8"
              autoComplete="off"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <InlineError message={mensagemDeErro(error, "carregar")} onRetry={() => refetch()} />
      ) : null}

      {isPending ? (
        <SkeletonRows rows={5} />
      ) : empresas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma empresa cadastrada"
          descricao="Cadastre a empresa uma vez e reaproveite em todas as candidaturas para ela."
          acao={
            <Button
              onClick={() => {
                setEditando(undefined);
                setFormAberto(true);
              }}
            >
              Cadastrar empresa
            </Button>
          }
        />
      ) : filtradas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma empresa com esse filtro"
          descricao="Tente outro termo ou limpe a busca."
          acao={
            <Button variant="secondary" onClick={() => setBusca("")}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line-subtle">
          {filtradas.map((empresa: EmpresaComContagem) => (
            <li key={empresa.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-body font-medium text-ink-primary">
                    {empresa.nome}
                  </span>
                  {empresa._count ? (
                    <Badge className="tabular">
                      {plural(empresa._count.candidaturas, "candidatura", "candidaturas")}
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-micro text-ink-tertiary">
                  {[empresa.stack_principal, empresa.estado, empresa.modelo_trabalho]
                    .filter(Boolean)
                    .join(" · ") || "Sem detalhes cadastrados"}
                </span>
              </span>

              {empresa.site ? (
                <a
                  href={empresa.site}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-micro text-accent underline-offset-4 hover:underline"
                >
                  Site
                </a>
              ) : null}

              <span className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar ${empresa.nome}`}
                  onClick={() => {
                    setEditando(empresa);
                    setFormAberto(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Excluir ${empresa.nome}`}
                  className="hover:text-danger"
                  onClick={() => setExcluindo(empresa)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <EmpresaDialog
        open={formAberto}
        onOpenChange={(aberto) => {
          setFormAberto(aberto);
          if (!aberto) setEditando(undefined);
        }}
        inicial={editando}
      />

      <ConfirmDialog
        open={Boolean(excluindo)}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setExcluindo(undefined);
            excluir.reset();
          }
        }}
        titulo="Excluir empresa"
        descricao={
          <>
            <strong className="font-medium text-ink-primary">{excluindo?.nome}</strong> sai do seu
            cadastro.
            {excluindo?._count?.candidaturas
              ? ` Existem ${plural(excluindo._count.candidaturas, "candidatura ligada", "candidaturas ligadas")} a ela — exclua ou mova antes.`
              : ""}
          </>
        }
        onConfirm={() => excluindo && excluir.mutate(excluindo)}
        loading={excluir.isPending}
        erro={excluir.isError ? mensagemDeErro(excluir.error, "excluir") : null}
      />

      {empresas.length === 0 && !isPending ? (
        <p className="flex items-center gap-1.5 text-micro text-ink-tertiary">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          Dá para cadastrar uma empresa direto do formulário de candidatura.
        </p>
      ) : null}
    </div>
  );
}
