import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { mensagemDeErro } from "../lib/errors";
import { MODELOS_DE_TRABALHO } from "../lib/opcoes";
import { empresasKeys, resumoKeys } from "../lib/query-keys";
import { empresasApi } from "../services/api";
import type { Empresa } from "../types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAviso } from "./ui/toast";

interface FormState {
  nome: string;
  tecnologias: string;
  estado: string;
  modelo: string;
  site: string;
  anotacoes: string;
}

function estadoInicial(empresa?: Empresa): FormState {
  return {
    nome: empresa?.nome ?? "",
    tecnologias: empresa?.stack_principal ?? "",
    estado: empresa?.estado ?? "",
    modelo: empresa?.modelo_trabalho ?? "",
    site: empresa?.site ?? "",
    anotacoes: empresa?.observacoes ?? "",
  };
}

/**
 * Formulário de empresa num só lugar. A tela de Empresas e o formulário de
 * candidatura usam este mesmo diálogo – antes o pré-requisito ("precisa de uma
 * empresa") era um beco sem saída, porque a tela que resolve morava em outro
 * lugar e nada levava até ela.
 */
export function EmpresaDialog({
  open,
  onOpenChange,
  inicial,
  onSalva,
}: {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  inicial?: Empresa;
  onSalva?: (empresa: Empresa) => void;
}) {
  const queryClient = useQueryClient();
  const { avisar } = useAviso();
  const [form, setForm] = useState<FormState>(() => estadoInicial(inicial));
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(estadoInicial(inicial));
      setTocado(false);
    }
  }, [open, inicial]);

  const salvar = useMutation({
    mutationFn: (dados: FormState) => {
      const payload = {
        nome: dados.nome.trim(),
        tecnologias: dados.tecnologias.trim() || undefined,
        estado: dados.estado.trim() || undefined,
        modelo_trabalho: dados.modelo.trim() || undefined,
        site: dados.site.trim() || undefined,
        observacoes: dados.anotacoes.trim() || undefined,
      };
      return inicial ? empresasApi.update(inicial.id, payload) : empresasApi.create(payload);
    },
    onSuccess: (empresa) => {
      queryClient.invalidateQueries({ queryKey: empresasKeys.all });
      queryClient.invalidateQueries({ queryKey: resumoKeys.all });
      avisar({ titulo: inicial ? "Empresa atualizada." : "Empresa cadastrada.", tom: "sucesso" });
      onSalva?.(empresa);
      onOpenChange(false);
    },
  });

  const set = (campo: keyof FormState, valor: string) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const erroNome = tocado && !form.nome.trim() ? "Informe o nome da empresa." : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (!aberto) {
          setTocado(false);
          setForm(estadoInicial(inicial));
          salvar.reset();
        }
        onOpenChange(aberto);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{inicial ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          <DialogDescription>
            Só o nome é obrigatório. O resto ajuda a lembrar do contexto quando a conversa voltar.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(evento) => {
            evento.preventDefault();
            setTocado(true);
            if (!form.nome.trim()) return;
            salvar.mutate(form);
          }}
          className="flex flex-col gap-4"
        >
          <Field
            label="Nome da empresa"
            htmlFor="emp-nome"
            obrigatorio
            error={erroNome}
            className="[&>label]:flex [&>label]:items-baseline [&>label]:gap-1.5"
          >
            <Input
              id="emp-nome"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder="Ex: Nubank"
              autoComplete="organization"
              invalid={Boolean(erroNome)}
              describedBy={erroNome ? "emp-nome-erro" : undefined}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tecnologias"
              htmlFor="emp-tec"
              hint="O que a empresa usa, pelo que você viu"
            >
              <Input
                id="emp-tec"
                value={form.tecnologias}
                onChange={(e) => set("tecnologias", e.target.value)}
                placeholder="React, Node.js, Go"
              />
            </Field>

            <Field label="Estado" htmlFor="emp-estado">
              <Input
                id="emp-estado"
                value={form.estado}
                onChange={(e) => set("estado", e.target.value)}
                placeholder="SP, RJ, Minas"
              />
            </Field>

            <Field label="Modelo de trabalho" htmlFor="emp-modelo">
              <Select value={form.modelo} onValueChange={(v) => set("modelo", v)}>
                <SelectTrigger id="emp-modelo">
                  <SelectValue placeholder="Não sei ainda" />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS_DE_TRABALHO.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Site" htmlFor="emp-site">
              <Input
                id="emp-site"
                type="url"
                inputMode="url"
                value={form.site}
                onChange={(e) => set("site", e.target.value)}
                placeholder="https://"
              />
            </Field>
          </div>

          <Field label="Anotações" htmlFor="emp-obs">
            <Textarea
              id="emp-obs"
              value={form.anotacoes}
              onChange={(e) => set("anotacoes", e.target.value)}
              placeholder="Como foi o processo, com quem você falou, o que ouviu"
              rows={3}
            />
          </Field>

          {salvar.isError ? <InlineError message={mensagemDeErro(salvar.error, "salvar")} /> : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={salvar.isPending}>
              {inicial ? "Salvar" : "Cadastrar empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
