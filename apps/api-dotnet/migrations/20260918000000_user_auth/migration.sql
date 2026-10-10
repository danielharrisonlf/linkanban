-- Migra o isolamento de workspace para o usuário autenticado.
-- Os dados existentes preservam o dono do workspace antes da remoção da tabela.
ALTER TABLE "empresas" ADD COLUMN "user_id" TEXT;
ALTER TABLE "candidaturas" ADD COLUMN "user_id" TEXT;
ALTER TABLE "followups" ADD COLUMN "user_id" TEXT;

UPDATE "empresas" e
SET "user_id" = w."owner_user_id"
FROM "workspaces" w
WHERE e."workspace_id" = w."id";

UPDATE "candidaturas" c
SET "user_id" = w."owner_user_id"
FROM "workspaces" w
WHERE c."workspace_id" = w."id";

UPDATE "followups" f
SET "user_id" = w."owner_user_id"
FROM "workspaces" w
WHERE f."workspace_id" = w."id";

ALTER TABLE "empresas" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "candidaturas" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "followups" ALTER COLUMN "user_id" SET NOT NULL;

DROP INDEX IF EXISTS "candidaturas_workspace_empresa_idx";
DROP INDEX IF EXISTS "candidaturas_workspace_ativa_data_idx";
DROP INDEX IF EXISTS "empresas_workspace_created_at_idx";
DROP INDEX IF EXISTS "followups_workspace_candidatura_data_idx";

ALTER TABLE "candidaturas" DROP CONSTRAINT "candidaturas_empresa_id_workspace_id_fkey";
ALTER TABLE "followups" DROP CONSTRAINT "followups_candidatura_id_workspace_id_fkey";
ALTER TABLE "api_tokens" DROP CONSTRAINT "api_tokens_workspace_id_fkey";
ALTER TABLE "empresas" DROP CONSTRAINT "empresas_workspace_id_fkey";
ALTER TABLE "candidaturas" DROP CONSTRAINT "candidaturas_workspace_id_fkey";
ALTER TABLE "followups" DROP CONSTRAINT "followups_workspace_id_fkey";

ALTER TABLE "empresas" DROP CONSTRAINT "empresas_id_workspace_id_key";
ALTER TABLE "candidaturas" DROP CONSTRAINT "candidaturas_id_workspace_id_key";
ALTER TABLE "followups" DROP CONSTRAINT "followups_id_workspace_id_key";

DROP INDEX IF EXISTS "api_tokens_workspace_id_revoked_at_idx";
DROP INDEX IF EXISTS "empresas_workspace_id_idx";
DROP INDEX IF EXISTS "candidaturas_workspace_id_idx";
DROP INDEX IF EXISTS "followups_workspace_id_idx";

ALTER TABLE "api_tokens" DROP COLUMN "workspace_id";
ALTER TABLE "empresas" DROP COLUMN "workspace_id";
ALTER TABLE "candidaturas" DROP COLUMN "workspace_id";
ALTER TABLE "followups" DROP COLUMN "workspace_id";

ALTER TABLE "empresas" ADD CONSTRAINT "empresas_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "followups" ADD CONSTRAINT "followups_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "empresas" ADD CONSTRAINT "empresas_id_user_id_key" UNIQUE ("id", "user_id");
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_id_user_id_key" UNIQUE ("id", "user_id");
ALTER TABLE "followups" ADD CONSTRAINT "followups_id_user_id_key" UNIQUE ("id", "user_id");

ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_empresa_id_user_id_fkey"
  FOREIGN KEY ("empresa_id", "user_id") REFERENCES "empresas"("id", "user_id") ON DELETE RESTRICT;
ALTER TABLE "followups" ADD CONSTRAINT "followups_candidatura_id_user_id_fkey"
  FOREIGN KEY ("candidatura_id", "user_id") REFERENCES "candidaturas"("id", "user_id") ON DELETE CASCADE;

DROP TABLE "workspaces";

CREATE INDEX "api_tokens_user_id_revoked_at_idx" ON "api_tokens"("user_id", "revoked_at");
CREATE INDEX "empresas_user_id_idx" ON "empresas"("user_id");
CREATE INDEX "candidaturas_user_id_idx" ON "candidaturas"("user_id");
CREATE INDEX "candidaturas_user_empresa_idx" ON "candidaturas"("user_id", "empresa_id");
CREATE INDEX "candidaturas_user_ativa_data_idx" ON "candidaturas"("user_id", "ativa", "data_aplicacao" DESC);
CREATE INDEX "empresas_user_created_at_idx" ON "empresas"("user_id", "created_at" DESC);
CREATE INDEX "followups_user_id_idx" ON "followups"("user_id");
CREATE INDEX "followups_user_candidatura_data_idx" ON "followups"("user_id", "candidatura_id", "data_prevista" DESC);
