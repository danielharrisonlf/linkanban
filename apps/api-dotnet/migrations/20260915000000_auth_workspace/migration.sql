-- A primeira identidade pertence aos dados já existentes. O bootstrap apenas
-- emite o primeiro token para este workspace e não precisa conhecer IDs fixos.
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspaces_owner_user_id_key" ON "workspaces"("owner_user_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "api_tokens_token_hash_key" ON "api_tokens"("token_hash");
CREATE INDEX "api_tokens_workspace_id_revoked_at_idx" ON "api_tokens"("workspace_id", "revoked_at");

ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "users" ("id", "email", "nome")
VALUES ('00000000-0000-4000-8000-000000000001', 'local@linkanban.local', 'Usuário local')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "workspaces" ("id", "nome", "owner_user_id")
VALUES ('00000000-0000-4000-8000-000000000001', 'Meu workspace', '00000000-0000-4000-8000-000000000001')
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "empresas" ADD COLUMN "workspace_id" TEXT NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "candidaturas" ADD COLUMN "workspace_id" TEXT NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001';
ALTER TABLE "followups" ADD COLUMN "workspace_id" TEXT NOT NULL
  DEFAULT '00000000-0000-4000-8000-000000000001';

ALTER TABLE "empresas" ADD CONSTRAINT "empresas_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "followups" ADD CONSTRAINT "followups_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "empresas" ADD CONSTRAINT "empresas_id_workspace_id_key"
  UNIQUE ("id", "workspace_id");
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_id_workspace_id_key"
  UNIQUE ("id", "workspace_id");
ALTER TABLE "followups" ADD CONSTRAINT "followups_id_workspace_id_key"
  UNIQUE ("id", "workspace_id");

ALTER TABLE "candidaturas" DROP CONSTRAINT "candidaturas_empresa_id_fkey";
ALTER TABLE "followups" DROP CONSTRAINT "followups_candidatura_id_fkey";

ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_empresa_id_workspace_id_fkey"
  FOREIGN KEY ("empresa_id", "workspace_id") REFERENCES "empresas"("id", "workspace_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "followups" ADD CONSTRAINT "followups_candidatura_id_workspace_id_fkey"
  FOREIGN KEY ("candidatura_id", "workspace_id") REFERENCES "candidaturas"("id", "workspace_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "empresas_workspace_id_idx" ON "empresas"("workspace_id");
CREATE INDEX "candidaturas_workspace_id_idx" ON "candidaturas"("workspace_id");
CREATE INDEX "followups_workspace_id_idx" ON "followups"("workspace_id");

ALTER TABLE "empresas" ALTER COLUMN "workspace_id" DROP DEFAULT;
ALTER TABLE "candidaturas" ALTER COLUMN "workspace_id" DROP DEFAULT;
ALTER TABLE "followups" ALTER COLUMN "workspace_id" DROP DEFAULT;
