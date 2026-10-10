import { api } from "../lib/api";
import type {
  Candidatura,
  PaginaCandidaturas,
  ResultadoFollowup,
  StatusCandidatura,
} from "../types";

export interface FiltroCandidaturas {
  busca?: string;
  status?: StatusCandidatura;
  incluirArquivadas?: boolean;
  ordenar?: "recentes" | "antigas" | "paradas" | "empresa" | "etapa";
  pagina?: number;
  limite?: number;
}

export interface DadosCandidatura {
  vaga_nome: string;
  empresa_id: string;
  status?: StatusCandidatura;
  data_aplicacao?: string;
  descricao?: string | null;
  link_vaga?: string | null;
  salario_estimado?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  motivo_recusa?: string | null;
}

export interface DadosEmpresa {
  nome: string;
  tecnologias?: string | null;
  estado?: string | null;
  modelo_trabalho?: string | null;
  site?: string | null;
  observacoes?: string | null;
}

export const candidaturasApi = {
  list: (filtro: FiltroCandidaturas = {}) =>
    api
      .get<PaginaCandidaturas>("/candidaturas", {
        params: {
          ...filtro,
          // `undefined` some da query string; `false` precisa ser enviado.
          incluirArquivadas: filtro.incluirArquivadas ? true : undefined,
        },
      })
      .then((r) => r.data),

  get: (id: string) => api.get<Candidatura>(`/candidaturas/${id}`).then((r) => r.data),

  create: (dados: DadosCandidatura) =>
    api.post<Candidatura>("/candidaturas", dados).then((r) => r.data),

  update: (id: string, dados: Partial<DadosCandidatura>) =>
    api.put<Candidatura>(`/candidaturas/${id}`, dados).then((r) => r.data),

  updateStatus: (id: string, status: StatusCandidatura) =>
    api.patch<Candidatura>(`/candidaturas/${id}/status`, { status }).then((r) => r.data),

  arquivar: (id: string, ativa: boolean) =>
    api.patch<Candidatura>(`/candidaturas/${id}/arquivar`, { ativa }).then((r) => r.data),

  delete: (id: string) => api.delete<Candidatura>(`/candidaturas/${id}`).then((r) => r.data),

  /** Desfaz a exclusão recriando o registro com o mesmo id. */
  restaurar: (dados: Candidatura) =>
    api.post<Candidatura>("/candidaturas/restaurar", dados).then((r) => r.data),
};

export const followupsApi = {
  list: () => api.get<import("../types").FollowUp[]>("/followups").then((r) => r.data),

  create: (dados: { candidatura_id: string; data_prevista: string; nota?: string | null }) =>
    api.post<import("../types").FollowUp>("/followups", dados).then((r) => r.data),

  update: (id: string, dados: { feito?: boolean; data_prevista?: string; nota?: string | null }) =>
    api.patch<import("../types").FollowUp>(`/followups/${id}`, dados).then((r) => r.data),

  /** O que aconteceu quando você cobrou. `reagendar_para` só vale com ADIARAM. */
  registrarResultado: (
    id: string,
    dados: { resultado: ResultadoFollowup; nota?: string | null; reagendar_para?: string | null },
  ) =>
    api.post<import("../types").FollowUp>(`/followups/${id}/resultado`, dados).then((r) => r.data),

  delete: (id: string) => api.delete(`/followups/${id}`),
};

export const empresasApi = {
  list: () => api.get<import("../types").Empresa[]>("/empresas").then((r) => r.data),
  create: (dados: DadosEmpresa) =>
    api.post<import("../types").Empresa>("/empresas", dados).then((r) => r.data),
  update: (id: string, dados: DadosEmpresa) =>
    api.put<import("../types").Empresa>(`/empresas/${id}`, dados).then((r) => r.data),
  delete: (id: string) => api.delete(`/empresas/${id}`),
};

export const resumoApi = {
  get: () => api.get<import("../types").Resumo>("/resumo").then((r) => r.data),
};

export const opcoesApi = {
  get: () => api.get<{ origens: string[] }>("/opcoes").then((r) => r.data),
};
