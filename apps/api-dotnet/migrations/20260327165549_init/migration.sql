-- CreateEnum
CREATE TYPE "StatusCandidatura" AS ENUM ('APLICADO', 'EM_ANALISE', 'ENTREVISTA', 'TESTE_TECNICO', 'PROPOSTA', 'REJEITADO', 'APROVADO');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "stack_principal" TEXT,
    "site" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidaturas" (
    "id" TEXT NOT NULL,
    "vaga_nome" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "status" "StatusCandidatura" NOT NULL DEFAULT 'APLICADO',
    "data_aplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,
    "link_vaga" TEXT,
    "salario_estimado" TEXT,
    "origem" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followups" (
    "id" TEXT NOT NULL,
    "candidatura_id" TEXT NOT NULL,
    "data_prevista" TIMESTAMP(3) NOT NULL,
    "feito" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followups" ADD CONSTRAINT "followups_candidatura_id_fkey" FOREIGN KEY ("candidatura_id") REFERENCES "candidaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
