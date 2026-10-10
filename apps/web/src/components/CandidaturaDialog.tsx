import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mensagemDeErro } from "../lib/errors";
import { MOTIVOS_DE_RECUSA, ORIGENS_SUGERIDAS, SUGESTOES_SALARIO } from "../lib/opcoes";
import { candidaturasKeys, empresasKeys, resumoKeys } from "../lib/query-keys";
import { ALL_STATUSES, ETAPAS, toDateInput } from "../lib/utils";
import { candidaturasApi, type DadosCandidatura, empresasApi } from "../services/api";
import type { Candidatura, StatusCandidatura } from "../types";
import { EmpresaDialog } from "./EmpresaDialog";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { InlineError, Notice } from "./ui/inline-error";
import { Field, Input, Textarea } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAviso } from "./ui/toast";

interface FormState {
  cargo: string;
  empresa_id: string;
  status: StatusCandidatura;
  data_aplicacao: string;
  salario_estimado: string;
  link_vaga: string;
  origem: string;
  descricao: string;
  observacoes: string;
  motivo_recusa: string;
}

function estadoInicial(candidatura?: Candidatura): FormState {
  return {
    cargo: candidatura?.vaga_nome ?? "",
    empresa_id: candidatura?.empresa_id ?? "",
    status: candidatura?.status ?? "APLICADO",
    data_aplicacao: toDateInput(candidatura?.data_aplicacao ?? new Date()),
    salario_estimado: candidatura?.salario_estimado ?? "",
    link_vaga: candidatura?.link_vaga ?? "",
    origem: candidatura?.origem ?? "",
    descricao: candidatura?.descricao ?? "",
    observacoes: candidatura?.observacoes ?? "",
    motivo_recusa: candidatura?.motivo_recusa ?? "",
  };
}

/**
 * O formulário abre com quatro campos — onde, o quê, quando, quanto. O resto
 * ("mais detalhes") fica atrás de um clique, porque registrar tem que custar
 * segundos: quem acabou de aplicar no celular não vai preencher dez campos.
 */
export function CandidaturaDialog({
  open,
  onOpenChange,
  inicial,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  inicial?: Candidatura;
}) {
  const queryClient = useQueryClient();
  const { avisar } = useAviso();
  const [form, setForm] = useState<FormState>(() => estadoInicial(inicial));
  const [detalhes, setDetalhes] = useState(Boolean(inicial));
  const [tocado, setTocado] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(estadoInicial(inicial));
      setDetalhes(Boolean(inicial));
      setTocado(false);
    }
  }, [open, inicial]);

  const { data: empresas = [] } = useQuery({
    queryKey: empresasKeys.lista(),
    queryFn: empresasApi.list,
  });

  const salvar = useMutation({
    mutationFn: (dados: FormState) => {
      const payload: DadosCandidatura = {
        vaga_nome: dados.cargo.trim(),
        empresa_id: dados.empresa_id,
        status: dados.status,
        data_aplicacao: dados.data_aplicacao
          ? new Date(`${dados.data_aplicacao}T12:00:00`).toISOString()
          : undefined,
        salario_estimado: dados.salario_estimado.trim() || null,
        link_vaga: dados.link_vaga.trim() || null,
        origem: dados.origem.trim() || null,
        descricao: dados.descricao.trim() || null,
        observacoes: dados.observacoes.trim() || null,
        motivo_recusa: dados.status === "REJEITADO" ? dados.motivo_recusa.trim() || null : null,
      };
      return inicial
        ? candidaturasApi.update(inicial.id, payload)
        : candidaturasApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidaturasKeys.all });
      queryClient.invalidateQueries({ queryKey: resumoKeys.all });
      avisar({
        titulo: inicial ? "Candidatura atualizada." : "Candidatura registrada.",
        tom: "sucesso",
      });
      onOpenChange(false);
    },
  });

  const set = (campo: keyof FormState, valor: string) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const erroCargo = tocado && !form.cargo.trim() ? "Informe o cargo da vaga." : undefined;
  const erroEmpresa = tocado && !form.empresa_id ? "Escolha a empresa." : undefined;
  const semEmpresas = empresas.length === 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(aberto) => {
          if (!aberto) {
            setTocado(false);
            setDetalhes(Boolean(inicial));
            setForm(estadoInicial(inicial));
            salvar.reset();
          }
          onOpenChange(aberto);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{inicial ? "Editar candidatura" : "Registrar candidatura"}</DialogTitle>
            <DialogDescription>
              Só o cargo e a empresa são obrigatórios. Dá para completar depois.
            </DialogDescription>
          </DialogHeader>

          <form
            noValidate
            onSubmit={(evento) => {
              evento.preventDefault();
              setTocado(true);
              if (!form.cargo.trim() || !form.empresa_id) return;
              salvar.mutate(form);
            }}
            className="flex flex-col gap-4"
          >
            {semEmpresas ? (
              <Notice
                acao={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setNovaEmpresa(true)}
                  >
                    Cadastrar empresa
                  </Button>
                }
              >
                Toda candidatura pertence a uma empresa. Cadastre a primeira para poder registrar.
              </Notice>
            ) : null}

            <Field label="Cargo" htmlFor="cand-cargo" obrigatorio error={erroCargo}>
              <Input
                id="cand-cargo"
                value={form.cargo}
                onChange={(e) => set("cargo", e.target.value)}
                placeholder="Ex: Pessoa Desenvolvedora Frontend"
                autoComplete="off"
                invalid={Boolean(erroCargo)}
                describedBy={erroCargo ? "cand-cargo-erro" : undefined}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Empresa" htmlFor="cand-empresa" obrigatorio error={erroEmpresa}>
                <Select value={form.empresa_id} onValueChange={(v) => set("empresa_id", v)}>
                  <SelectTrigger id="cand-empresa" aria-invalid={Boolean(erroEmpresa) || undefined}>
                    <SelectValue
                      placeholder={semEmpresas ? "Cadastre uma empresa" : "Escolher empresa"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Onde você está nessa" htmlFor="cand-status">
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v as StatusCandidatura)}
                >
                  <SelectTrigger id="cand-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {ETAPAS[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Quando você aplicou" htmlFor="cand-data">
                <Input
                  id="cand-data"
                  type="date"
                  value={form.data_aplicacao}
                  onChange={(e) => set("data_aplicacao", e.target.value)}
                />
              </Field>

              <Field label="Faixa salarial" htmlFor="cand-salario" hint="Como estava no anúncio">
                <Input
                  id="cand-salario"
                  list="sugestoes-salario"
                  value={form.salario_estimado}
                  onChange={(e) => set("salario_estimado", e.target.value)}
                  placeholder="Ex: R$ 8.000 a R$ 12.000"
                />
                <datalist id="sugestoes-salario">
                  {SUGESTOES_SALARIO.map((sugestao) => (
                    <option key={sugestao} value={sugestao} />
                  ))}
                </datalist>
              </Field>
            </div>

            {form.status === "REJEITADO" ? (
              <Field
                label="O que eles disseram"
                htmlFor="cand-motivo"
                hint="Guardar o motivo transforma a recusa em algo aproveitável"
              >
                <Input
                  id="cand-motivo"
                  list="sugestoes-recusa"
                  value={form.motivo_recusa}
                  onChange={(e) => set("motivo_recusa", e.target.value)}
                  placeholder="Ex: buscavam alguém com experiência em mensageria"
                />
                <datalist id="sugestoes-recusa">
                  {MOTIVOS_DE_RECUSA.map((motivo) => (
                    <option key={motivo} value={motivo} />
                  ))}
                </datalist>
              </Field>
            ) : null}

            <div>
              <button
                type="button"
                onClick={() => setDetalhes((atual) => !atual)}
                aria-expanded={detalhes}
                className="rounded-control text-label font-medium text-accent underline-offset-4 hover:underline"
              >
                {detalhes ? "Ocultar detalhes" : "Adicionar detalhes"}
              </button>
            </div>

            {detalhes ? (
              <div className="flex flex-col gap-4">
                <Field label="Onde você encontrou" htmlFor="cand-origem">
                  <Input
                    id="cand-origem"
                    list="sugestoes-origem"
                    value={form.origem}
                    onChange={(e) => set("origem", e.target.value)}
                    placeholder="LinkedIn, indicação, site da empresa"
                  />
                  <datalist id="sugestoes-origem">
                    {ORIGENS_SUGERIDAS.map((origem) => (
                      <option key={origem} value={origem} />
                    ))}
                  </datalist>
                </Field>

                <Field label="Link do anúncio" htmlFor="cand-link">
                  <Input
                    id="cand-link"
                    type="url"
                    inputMode="url"
                    value={form.link_vaga}
                    onChange={(e) => set("link_vaga", e.target.value)}
                    placeholder="https://"
                  />
                </Field>

                <Field label="Sobre a vaga" htmlFor="cand-descricao">
                  <Textarea
                    id="cand-descricao"
                    value={form.descricao}
                    onChange={(e) => set("descricao", e.target.value)}
                    placeholder="Requisitos, tecnologias, o que chamou atenção"
                    rows={3}
                  />
                </Field>

                <Field label="Anotações" htmlFor="cand-obs">
                  <Textarea
                    id="cand-obs"
                    value={form.observacoes}
                    onChange={(e) => set("observacoes", e.target.value)}
                    placeholder="Com quem falou, o que combinaram, o que você quer lembrar"
                    rows={3}
                  />
                </Field>
              </div>
            ) : null}

            {salvar.isError ? (
              <InlineError message={mensagemDeErro(salvar.error, "salvar")} />
            ) : null}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={salvar.isPending} disabled={semEmpresas}>
                {inicial ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EmpresaDialog
        open={novaEmpresa}
        onOpenChange={setNovaEmpresa}
        onSalva={(empresa) => set("empresa_id", empresa.id)}
      />
    </>
  );
}

/** Atalho usado nas telas que precisam do diálogo com o botão próprio. */
export function useCandidaturaDialog() {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Candidatura | undefined>();
  return {
    aberto,
    editando,
    abrirNovo: () => {
      setEditando(undefined);
      setAberto(true);
    },
    abrirEdicao: (candidatura: Candidatura) => {
      setEditando(candidatura);
      setAberto(true);
    },
    fechar: () => setAberto(false),
    onOpenChange: setAberto,
  };
}

export function LinkParaCandidaturas() {
  return (
    <Button asChild variant="secondary" size="sm">
      <Link to="/candidaturas">Ver candidaturas</Link>
    </Button>
  );
}
