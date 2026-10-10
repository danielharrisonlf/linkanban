#!/usr/bin/env node
/**
 * Prepara os arquivos de ambiente locais a partir dos .env.example de cada app.
 * Uso: pnpm setup:env
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const targets = ["apps/api-dotnet", "apps/web"];

let created = 0;
let skipped = 0;

for (const target of targets) {
  const example = join(repoRoot, target, ".env.example");
  const env = join(repoRoot, target, ".env");

  if (!existsSync(example)) {
    console.warn(`! ${target}/.env.example não encontrado, pulando`);
    continue;
  }

  if (existsSync(env)) {
    console.log(`= ${target}/.env já existe, mantido`);
    skipped += 1;
    continue;
  }

  copyFileSync(example, env);
  console.log(`+ ${target}/.env criado a partir do exemplo`);
  created += 1;
}

console.log(`\nAmbientes prontos: ${created} criado(s), ${skipped} mantido(s).`);
