-- AlterEnum
CREATE TYPE "ResultadoFollowup" AS ENUM ('RESPONDERAM', 'SEM_RESPOSTA', 'ADIARAM', 'ENCERRARAM');

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN "modelo_trabalho" TEXT;

-- AlterTable
ALTER TABLE "candidaturas"
  ADD COLUMN "ativa" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "etapa_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "motivo_recusa" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- A etapa atual já vale desde a candidatura para os registros existentes.
UPDATE "candidaturas" SET "etapa_desde" = "created_at", "updated_at" = "created_at";

-- AlterTable
ALTER TABLE "followups"
  ADD COLUMN "resultado" "ResultadoFollowup",
  ADD COLUMN "nota" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "followups" SET "updated_at" = "created_at";

-- CreateIndex
CREATE INDEX "candidaturas_ativa_status_idx" ON "candidaturas"("ativa", "status");
CREATE INDEX "candidaturas_etapa_desde_idx" ON "candidaturas"("etapa_desde");
CREATE INDEX "followups_feito_data_prevista_idx" ON "followups"("feito", "data_prevista");
