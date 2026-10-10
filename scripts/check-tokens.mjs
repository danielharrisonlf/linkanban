/**
 * Verifica se cada utilitário de token usado no código existe no tema.
 *
 * Classe inexistente é falha silenciosa: o Tailwind não emite regra nenhuma, o
 * elemento herda (cor de texto) ou cai em `currentColor` (borda), e o defeito
 * passa despercebido em revisão. Este script fecha essa porta.
 *
 * Uso: node scripts/check-tokens.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();
const CSS = "apps/web/src/index.css";
const FONTE = "apps/web/src";

/** Tokens declarados no `@theme`. */
const css = readFileSync(join(RAIZ, CSS), "utf8");
const cores = new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]));
const raios = new Set([...css.matchAll(/--radius-([a-z0-9-]+):/g)].map((m) => m[1]));
const textos = new Set([...css.matchAll(/--text-([a-z0-9-]+):/g)].map((m) => m[1]));

/** Prefixos de utilitário que consomem `--color-*`. */
const PREFIXOS_COR = [
  "text",
  "bg",
  "border",
  "divide",
  "stroke",
  "fill",
  "ring",
  "outline",
  "from",
  "to",
  "via",
  "accent",
  "caret",
  "decoration",
];

/** Sufixos que são valor nativo do Tailwind, não nome de token. */
const VALORES_NATIVOS = new Set([
  "b",
  "t",
  "l",
  "r",
  "x",
  "y",
  "s",
  "e",
  "none",
  "dashed",
  "dotted",
  "solid",
  "double",
  "hidden",
  "collapse",
  "separate",
  "offset",
  "2",
  "4",
  "8",
  "box",
  "card",
  "control",
]);

/** Nomes nativos do Tailwind que não vêm do nosso tema. */
const NATIVOS_COR = new Set([
  "sm",
  "xs",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
  "wrap",
  "nowrap",
  "balance",
  "pretty",
  "clip",
  "ellipsis",
  "transparent",
  "current",
  "inherit",
  "initial",
  "white",
  "black",
]);

const NATIVOS_RAIO = new Set(["none", "full", "sm", "md", "lg", "xl", "2xl", "3xl"]);

function arquivos(dir) {
  const saida = [];
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.(tsx?|css)$/.test(entrada)) saida.push(caminho);
  }
  return saida;
}

const problemas = [];

for (const arquivo of arquivos(join(RAIZ, FONTE))) {
  const bruto = readFileSync(arquivo, "utf8");
  // Comentários citam nomes de token de propósito; não são uso.
  const conteudo = bruto.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
  const rel = relative(RAIZ, arquivo);

  const classes = new Set(
    conteudo
      .split(/[\s"'`(){};,]+/)
      .map((c) => c.trim())
      .filter(Boolean),
  );

  for (const classe of classes) {
    // Remove variantes (`hover:`) e modificadores de opacidade.
    const base = classe.replace(/^.*:/, "").replace(/\/[\d.]+$/, "").replace(/^[-!]/, "");
    if (!base || base.includes("[") || base.includes("$") || base.includes("=")) continue;
    if (base.startsWith("fill-")) continue;

    const prefixo = PREFIXOS_COR.find((p) => base.startsWith(`${p}-`));
    if (prefixo) {
      let token = base.slice(prefixo.length + 1);
      // `border-l-2`, `bg-red-500`: lado e escala numérica são valor nativo.
      token = token.replace(/^(b|t|l|r|x|y|s|e)-/, "").replace(/-\d+$/, "").replace(/^\d+$/, "");
      if (!token) continue;

      const ehTamanho = prefixo === "text" && textos.has(token);
      const existe = cores.has(token) || raios.has(token) || textos.has(token);
      if (
        !ehTamanho &&
        !existe &&
        !NATIVOS_COR.has(token) &&
        !VALORES_NATIVOS.has(token) &&
        /^[a-z]+(-[a-z0-9]+)*$/.test(token)
      ) {
        problemas.push(`${rel}: ${classe} → --color-${token} não existe`);
      }
    }

    if (base.startsWith("rounded-")) {
      const token = base.slice("rounded-".length).replace(/^(b|t|l|r|s|e)-/, "");
      if (
        token &&
        !raios.has(token) &&
        !NATIVOS_RAIO.has(token) &&
        /^[a-z]+(-[a-z0-9]+)*$/.test(token)
      ) {
        problemas.push(`${rel}: ${classe} → --radius-${token} não existe`);
      }
    }
  }
}

const unicos = [...new Set(problemas)].sort();

if (unicos.length === 0) {
  console.log("OK: todo utilitário de token usado no código existe no tema.");
} else {
  console.log(`ATENÇÃO: ${unicos.length} classe(s) sem token correspondente:\n`);
  for (const p of unicos) console.log(`- ${p}`);
  process.exitCode = 1;
}
