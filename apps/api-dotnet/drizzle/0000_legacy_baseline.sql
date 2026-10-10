CREATE TYPE "public"."ResultadoFollowup" AS ENUM('RESPONDERAM', 'SEM_RESPOSTA', 'ADIARAM', 'ENCERRARAM');--> statement-breakpoint
CREATE TYPE "public"."StatusCandidatura" AS ENUM('APLICADO', 'EM_ANALISE', 'ENTREVISTA', 'TESTE_TECNICO', 'PROPOSTA', 'REJEITADO', 'APROVADO');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"last_used_at" timestamp (3),
	"revoked_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "candidaturas" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"vaga_nome" text NOT NULL,
	"empresa_id" text NOT NULL,
	"status" "StatusCandidatura" DEFAULT 'APLICADO' NOT NULL,
	"data_aplicacao" timestamp (3) DEFAULT now() NOT NULL,
	"descricao" text,
	"link_vaga" text,
	"salario_estimado" text,
	"origem" text,
	"observacoes" text,
	"ativa" boolean DEFAULT true NOT NULL,
	"etapa_desde" timestamp (3) DEFAULT now() NOT NULL,
	"motivo_recusa" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "candidaturas_id_workspace_id_key" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"nome" text NOT NULL,
	"site" text,
	"estado" text,
	"modelo_trabalho" text,
	"stack_principal" text,
	"observacoes" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "empresas_id_workspace_id_key" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "followups" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"candidatura_id" text NOT NULL,
	"data_prevista" timestamp (3) NOT NULL,
	"feito" boolean DEFAULT false NOT NULL,
	"resultado" "ResultadoFollowup",
	"nota" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "followups_id_workspace_id_key" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_empresa_id_workspace_id_fkey" FOREIGN KEY ("empresa_id","workspace_id") REFERENCES "public"."empresas"("id","workspace_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_candidatura_id_workspace_id_fkey" FOREIGN KEY ("candidatura_id","workspace_id") REFERENCES "public"."candidaturas"("id","workspace_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "api_tokens_token_hash_key" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "api_tokens_workspace_id_revoked_at_idx" ON "api_tokens" USING btree ("workspace_id","revoked_at");--> statement-breakpoint
CREATE INDEX "candidaturas_workspace_id_idx" ON "candidaturas" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "candidaturas_ativa_status_idx" ON "candidaturas" USING btree ("ativa","status");--> statement-breakpoint
CREATE INDEX "candidaturas_etapa_desde_idx" ON "candidaturas" USING btree ("etapa_desde");--> statement-breakpoint
CREATE INDEX "empresas_workspace_id_idx" ON "empresas" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "followups_workspace_id_idx" ON "followups" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "followups_feito_data_prevista_idx" ON "followups" USING btree ("feito","data_prevista");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_owner_user_id_key" ON "workspaces" USING btree ("owner_user_id");
