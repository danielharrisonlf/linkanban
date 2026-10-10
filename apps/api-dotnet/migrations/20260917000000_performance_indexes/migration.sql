-- Índices compostos para os filtros e joins mais frequentes da API.
CREATE INDEX "candidaturas_workspace_empresa_idx"
  ON "candidaturas"("workspace_id", "empresa_id");

CREATE INDEX "candidaturas_workspace_ativa_data_idx"
  ON "candidaturas"("workspace_id", "ativa", "data_aplicacao" DESC);

CREATE INDEX "empresas_workspace_created_at_idx"
  ON "empresas"("workspace_id", "created_at" DESC);

CREATE INDEX "followups_workspace_candidatura_data_idx"
  ON "followups"("workspace_id", "candidatura_id", "data_prevista" DESC);
