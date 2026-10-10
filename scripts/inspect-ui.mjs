/**
 * Inspeção visual e mecânica da interface: captura as telas em desktop e mobile
 * e reporta achados objetivos (overflow horizontal, headings, controles sem nome
 * acessível, inputs sem label, foco preso no modal).
 *
 * Requer o dev server rodando (`pnpm --filter @fio/web dev`) e um Chromium
 * do Playwright. Aponte o binário com CHROME_PATH se o caminho padrão não existir:
 *   CHROME_PATH="C:/.../chrome.exe" node scripts/inspect-ui.mjs
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Users/daniellima/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = process.env.SHOT_DIR ?? ".agent/shots";

const ROUTES = [
  { path: "/", nome: "resumo" },
  { path: "/quadro", nome: "quadro" },
  { path: "/candidaturas", nome: "candidaturas" },
  { path: "/follow-ups", nome: "follow-ups" },
  { path: "/empresas", nome: "empresas" },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const problemas = [];

async function inspecionar(page, rotulo) {
  const dados = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const headings = [...document.querySelectorAll("h1, h2, h3")].map(
      (h) => `${h.tagName}:${(h.textContent ?? "").trim().slice(0, 40)}`,
    );
    const semNome = [...document.querySelectorAll("button, a")].filter((el) => {
      const texto = (el.textContent ?? "").trim();
      const aria = el.getAttribute("aria-label");
      const titulo = el.getAttribute("title");
      return !texto && !aria && !titulo;
    }).length;
    const inputsSemLabel = [...document.querySelectorAll("input, select, textarea")].filter((el) => {
      if (el.getAttribute("aria-label")) return false;
      if (el.id && document.querySelector(`label[for="${el.id}"]`)) return false;
      return !el.closest("label");
    }).length;
    return { overflow, headings, semNome, inputsSemLabel };
  });

  if (dados.overflow > 1) {
    problemas.push(`${rotulo}: overflow horizontal de ${dados.overflow}px`);
  }
  if (dados.semNome > 0) {
    problemas.push(`${rotulo}: ${dados.semNome} controle(s) sem nome acessível`);
  }
  if (dados.inputsSemLabel > 0) {
    problemas.push(`${rotulo}: ${dados.inputsSemLabel} input(s) sem label associada`);
  }

  console.log(
    `${rotulo.padEnd(28)} overflow=${String(dados.overflow).padStart(4)}  headings=${dados.headings.length}  sinalizados=${dados.semNome}/${dados.inputsSemLabel}`,
  );
  console.log(`  ${dados.headings.join(" | ") || "(sem headings)"}`);
}

async function capturar(page, rotulo, arquivo) {
  await page.screenshot({ path: `${OUT}/${arquivo}.png`, fullPage: false });
  await inspecionar(page, rotulo);
}

// ── Desktop ──────────────────────────────────────────────────────────────────
const desktop = await browser.newPage({ viewport: { width: 1440, height: 950 } });
for (const rota of ROUTES) {
  await desktop.goto(`${BASE}${rota.path}`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(400);
  await capturar(desktop, `desktop ${rota.nome}`, `desktop-${rota.nome}`);
}

// Diálogo de registrar candidatura (estado aberto, com foco preso)
await desktop.goto(`${BASE}/candidaturas`, { waitUntil: "networkidle" });
await desktop.getByRole("button", { name: /registrar candidatura/i }).first().click();
await desktop.waitForTimeout(350);
await desktop.screenshot({ path: `${OUT}/desktop-dialogo.png` });
const foco = await desktop.evaluate(() => {
  const el = document.activeElement;
  return {
    tag: el?.tagName ?? "?",
    texto: (el?.textContent ?? "").trim().slice(0, 30),
    dentroDoDialogo: Boolean(el?.closest("[data-slot='dialog-content']")),
  };
});
console.log(`foco ao abrir o diálogo: ${JSON.stringify(foco)}`);
if (!foco.dentroDoDialogo) problemas.push("diálogo: foco não foi preso dentro do modal");
await desktop.keyboard.press("Escape");
await desktop.waitForTimeout(250);

// Menu de ações do cartão no quadro (caminho alternativo ao arrastar)
await desktop.goto(`${BASE}/quadro`, { waitUntil: "networkidle" });
await desktop.waitForTimeout(300);
const acoes = desktop.getByRole("button", { name: /ações de/i }).first();
// A rota do quadro é carregada sob demanda: espera o cartão existir de fato.
await acoes.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
if (await acoes.count()) {
  await acoes.click();
  await desktop.waitForTimeout(250);
  await desktop.screenshot({ path: `${OUT}/desktop-menu-cartao.png` });
  console.log("menu de ações do cartão capturado");
  await desktop.keyboard.press("Escape");
  await desktop.waitForTimeout(200);
} else {
  console.log("menu de ações: nenhum cartão no quadro");
}

// ── Mobile ───────────────────────────────────────────────────────────────────
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
for (const rota of ROUTES) {
  await mobile.goto(`${BASE}${rota.path}`, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(400);
  await capturar(mobile, `mobile ${rota.nome}`, `mobile-${rota.nome}`);
}

// Drawer de navegação no mobile
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: /abrir menu/i }).click();
await mobile.waitForTimeout(350);
await mobile.screenshot({ path: `${OUT}/mobile-drawer.png` });
console.log("drawer mobile capturado");

await browser.close();

console.log("\n=== achados ===");
if (problemas.length === 0) {
  console.log("nenhum problema mecânico detectado");
} else {
  for (const p of problemas) console.log(`- ${p}`);
}
