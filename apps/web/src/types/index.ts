export type StatusCandidatura =
  | "APLICADO"
  | "EM_ANALISE"
  | "ENTREVISTA"
  | "TESTE_TECNICO"
  | "PROPOSTA"
  | "REJEITADO"
  | "APROVADO";

export interface Empresa {
  id: string;
  nome: string;
  stack_principal?: string | null;
  site?: string | null;
  observacoes?: string | null;
  estado?: string | null;
  /** Remoto, Híbrido ou Presencial — separado de `estado`, que é a unidade federativa. */
  modelo_trabalho?: string | null;
  created_at: string;
}

export interface Candidatura {
  id: string;
  vaga_nome: string;
  empresa_id: string;
  empresa: Empresa;
  status: StatusCandidatura;
  data_aplicacao: string;
  descricao?: string | null;
  link_vaga?: string | null;
  salario_estimado?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  /** Toda candidatura registrada aqui é sua; false = você desistiu ou arquivou. */
  ativa: boolean;
  /** Quando a etapa mudou pela última vez. Base do "parada há N dias". */
  etapa_desde: string;
  /** O que a empresa disse quando recusou. Vira aprendizado em vez de sumiço. */
  motivo_recusa?: string | null;
  created_at: string;
  updated_at: string;
}

/** O que aconteceu quando você cobrou. Sem isto o follow-up era um check-box. */
export type ResultadoFollowup = "RESPONDERAM" | "SEM_RESPOSTA" | "ADIARAM" | "ENCERRARAM";

export interface FollowUp {
  id: string;
  candidatura_id: string;
  candidatura: Candidatura;
  data_prevista: string;
  feito: boolean;
  resultado?: ResultadoFollowup | null;
  /** Texto livre do que aconteceu na conversa. */
  nota?: string | null;
  created_at: string;
}

export interface PontoAtividade {
  /** Início da semana em ISO (UTC) — chave estável do ponto. */
  semana: string;
  /** Rótulo curto para o eixo: `dd/MM`. */
  label: string;
  candidaturas: number;
}

/** Uma candidatura que está parada e sobre a qual você pode agir. */
export interface Parada {
  candidatura: Candidatura;
  dias: number;
  motivo: "sem-retorno" | "sem-followup" | "followup-vencido";
}

export interface Resumo {
  total: number;
  ativas: number;
  por_status: Record<StatusCandidatura, number>;
  /** Percentual formatado, ex.: `"50.0%"`. */
  taxa_conversao: string;
  total_entrevistas: number;
  /** Candidaturas que saíram do estado inicial, sobre o total. */
  taxa_resposta: string;
  total_respondidas: number;
  total_pendentes: number;
  /** Sem nenhuma resposta há mais de 14 dias — o número que a busca realmente sente. */
  sem_resposta: number;
  paradas: Parada[];
  followups_pendentes: number;
  followups_vencidos: number;
  atividade_semanal: PontoAtividade[];
}

export interface PaginaCandidaturas {
  itens: Candidatura[];
  total: number;
}
