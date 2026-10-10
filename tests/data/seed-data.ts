export interface TestEmpresa {
  id: string;
  nome: string;
  stack_principal?: string | null;
  site?: string | null;
  observacoes?: string | null;
  estado?: string | null;
  modelo_trabalho?: string | null;
  created_at: string;
}

export type StatusCandidatura =
  | "APLICADO"
  | "EM_ANALISE"
  | "ENTREVISTA"
  | "TESTE_TECNICO"
  | "PROPOSTA"
  | "REJEITADO"
  | "APROVADO";

export interface TestCandidatura {
  id: string;
  vaga_nome: string;
  empresa_id: string;
  empresa: TestEmpresa;
  status: StatusCandidatura;
  data_aplicacao: string;
  descricao?: string | null;
  link_vaga?: string | null;
  salario_estimado?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  ativa: boolean;
  etapa_desde: string;
  motivo_recusa?: string | null;
  created_at: string;
  updated_at: string;
}

export type ResultadoFollowup = "RESPONDERAM" | "SEM_RESPOSTA" | "ADIARAM" | "ENCERRARAM";

export interface TestFollowUp {
  id: string;
  candidatura_id: string;
  candidatura: TestCandidatura;
  data_prevista: string;
  feito: boolean;
  resultado?: ResultadoFollowup | null;
  nota?: string | null;
  created_at: string;
}

export const INITIAL_EMPRESAS: TestEmpresa[] = [
  {
    id: "emp-1",
    nome: "Nubank",
    stack_principal: "Clojure, React, Flutter, Kafka",
    site: "https://nubank.com.br",
    estado: "SP",
    modelo_trabalho: "Híbrido",
    observacoes: "Processo estruturado e ágil",
    created_at: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "emp-2",
    nome: "Stripe",
    stack_principal: "Ruby, Go, TypeScript, React",
    site: "https://stripe.com",
    estado: "Remoto",
    modelo_trabalho: "Remoto",
    observacoes: "Foco forte em pagamentos globais",
    created_at: "2026-01-15T12:00:00.000Z",
  },
  {
    id: "emp-3",
    nome: "Vercel",
    stack_principal: "Next.js, TypeScript, Rust, Turbo",
    site: "https://vercel.com",
    estado: "Remoto",
    modelo_trabalho: "Remoto",
    observacoes: "Ecossistema frontend moderno",
    created_at: "2026-02-01T14:00:00.000Z",
  },
];

export const INITIAL_CANDIDATURAS: TestCandidatura[] = [
  {
    id: "cand-1",
    vaga_nome: "Senior Frontend Engineer",
    empresa_id: "emp-1",
    empresa: INITIAL_EMPRESAS[0]!,
    status: "ENTREVISTA",
    data_aplicacao: "2026-02-10T10:00:00.000Z",
    salario_estimado: "R$ 18.000",
    link_vaga: "https://nubank.com.br/careers/123",
    origem: "LinkedIn",
    descricao: "Desenvolvimento de interfaces bancárias com alta escalabilidade",
    observacoes: "Passou pelo screening de RH",
    ativa: true,
    etapa_desde: "2026-02-15T10:00:00.000Z",
    created_at: "2026-02-10T10:00:00.000Z",
    updated_at: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "cand-2",
    vaga_nome: "Staff Software Engineer",
    empresa_id: "emp-2",
    empresa: INITIAL_EMPRESAS[1]!,
    status: "APLICADO",
    data_aplicacao: "2026-02-20T14:00:00.000Z",
    salario_estimado: "$ 150k USD",
    link_vaga: "https://stripe.com/jobs/456",
    origem: "Indicação",
    descricao: "Arquitetura de pagamentos transfronteiriços",
    observacoes: "Currículo enviado para recrutador",
    ativa: true,
    etapa_desde: "2026-02-20T14:00:00.000Z",
    created_at: "2026-02-20T14:00:00.000Z",
    updated_at: "2026-02-20T14:00:00.000Z",
  },
  {
    id: "cand-3",
    vaga_nome: "Tech Lead Frontend",
    empresa_id: "emp-3",
    empresa: INITIAL_EMPRESAS[2]!,
    status: "TESTE_TECNICO",
    data_aplicacao: "2026-01-28T09:00:00.000Z",
    salario_estimado: "R$ 22.000",
    link_vaga: "https://vercel.com/careers/789",
    origem: "Gupy",
    descricao: "Liderança técnica do time de Developer Experience",
    observacoes: "Teste prático para entregar nesta semana",
    ativa: true,
    etapa_desde: "2026-02-05T09:00:00.000Z",
    created_at: "2026-01-28T09:00:00.000Z",
    updated_at: "2026-02-05T09:00:00.000Z",
  },
];

export const INITIAL_FOLLOWUPS: TestFollowUp[] = [
  {
    id: "fol-1",
    candidatura_id: "cand-1",
    candidatura: INITIAL_CANDIDATURAS[0]!,
    data_prevista: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem (atrasado)
    feito: false,
    nota: "Checar retorno sobre a entrevista técnica",
    created_at: "2026-02-15T11:00:00.000Z",
  },
  {
    id: "fol-2",
    candidatura_id: "cand-3",
    candidatura: INITIAL_CANDIDATURAS[2]!,
    data_prevista: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Em 2 dias (futuro)
    feito: false,
    nota: "Confirmar recebimento do teste prático",
    created_at: "2026-02-16T15:00:00.000Z",
  },
];

export function buildResumoMock(
  candidaturas: TestCandidatura[],
  followups: TestFollowUp[],
) {
  const ativas = candidaturas.filter((c) => c.ativa);
  const por_status: Record<StatusCandidatura, number> = {
    APLICADO: 0,
    EM_ANALISE: 0,
    ENTREVISTA: 0,
    TESTE_TECNICO: 0,
    PROPOSTA: 0,
    REJEITADO: 0,
    APROVADO: 0,
  };

  for (const c of ativas) {
    por_status[c.status] = (por_status[c.status] ?? 0) + 1;
  }

  const total = ativas.length;
  const total_entrevistas =
    por_status.ENTREVISTA +
    por_status.TESTE_TECNICO +
    por_status.PROPOSTA +
    por_status.APROVADO;
  const total_respondidas = total - por_status.APLICADO;
  const pendentes = followups.filter((f) => !f.feito);
  const agora = Date.now();
  const vencidos = pendentes.filter((f) => new Date(f.data_prevista).getTime() < agora);

  return {
    total,
    ativas: total,
    por_status,
    taxa_conversao: total > 0 ? `${((total_entrevistas / total) * 100).toFixed(1)}%` : "0%",
    total_entrevistas,
    taxa_resposta: total > 0 ? `${((total_respondidas / total) * 100).toFixed(1)}%` : "0%",
    total_respondidas,
    total_pendentes: pendentes.length,
    sem_resposta: por_status.APLICADO,
    paradas: [
      {
        candidatura: candidaturas[0]!,
        dias: 12,
        motivo: "sem-retorno" as const,
      },
    ],
    followups_pendentes: pendentes.length,
    followups_vencidos: vencidos.length,
    atividade_semanal: [
      { semana: "2026-02-02T00:00:00.000Z", label: "02/02", candidaturas: 1 },
      { semana: "2026-02-09T00:00:00.000Z", label: "09/02", candidaturas: 2 },
      { semana: "2026-02-16T00:00:00.000Z", label: "16/02", candidaturas: 1 },
    ],
  };
}

export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
