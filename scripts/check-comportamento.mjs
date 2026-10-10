/**
 * Verificação de comportamento no bundle de produção: overflow em telas estreitas,
 * link de pular para o conteúdo e atalhos de teclado.
 *
 * Uso: node scripts/check-comportamento.mjs   (com `vite preview` no ar)
 */
import { chromium } from "playwright-core";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Users/daniellima/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const BASE = process.env.BASE_URL ?? "http://localhost:4173";
const ROTAS = ["/", "/quadro", "/candidaturas", "/follow-ups", "/empresas"];

const browser = await chromium.launch({ executablePath: CHROME });
let falhas = 0;

// 1) Overflow horizontal em telas estreitas.
for (const largura of [320, 360, 390, 768]) {
  const pagina = await browser.newPage({ viewport: { width: largura, height: 800 } });
  const medidas = [];
  for (const rota of ROTAS) {
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(350);
    const excesso = await pagina.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (excesso > 1) falhas += 1;
    medidas.push(`${rota}=${excesso}`);
  }
  console.log(`${String(largura).padStart(4)}px  ${medidas.join("  ")}`);
  await pagina.close();
}

const pagina = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(400);

// 2) O primeiro Tab foca "Pular para o conteúdo" e ele fica visível.
await pagina.keyboard.press("Tab");
await pagina.waitForTimeout(250);
const pular = await pagina.evaluate(() => {
  const el = document.activeElement;
  if (!el) return null;
  const caixa = el.getBoundingClientRect();
  return {
    texto: (el.textContent ?? "").trim(),
    largura: Math.round(caixa.width),
    visivel: getComputedStyle(el).clipPath === "none",
  };
});
console.log(`primeiro Tab -> ${JSON.stringify(pular)}`);
if (!pular?.visivel || pular.largura < 40) {
  console.log("  FALHA: o link de pular não aparece com foco");
  falhas += 1;
}

// 3) Atalhos: `r` registra, `/` foca a busca, `g`+`c` navega.
await pagina.keyboard.press("Escape");
await pagina.keyboard.press("r");
await pagina.waitForTimeout(500);
const dialogoAberto = await pagina.evaluate(() =>
  Boolean(document.querySelector('[data-slot="dialog-content"]')),
);
console.log(`atalho R -> diálogo aberto: ${dialogoAberto}`);
if (!dialogoAberto) falhas += 1;

await pagina.keyboard.press("Escape");
await pagina.waitForTimeout(300);
await pagina.goto(`${BASE}/candidaturas`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(400);
await pagina.keyboard.press("/");
await pagina.waitForTimeout(250);
const buscaFocada = await pagina.evaluate(() => document.activeElement?.id ?? "");
console.log(`atalho / -> foco em: ${buscaFocada || "(nada)"}`);
if (buscaFocada !== "busca") falhas += 1;

// Atalhos de navegação não disparam enquanto a pessoa digita — então o foco sai
// do campo antes de testar `g` + letra.
await pagina.evaluate(() => document.activeElement?.blur());
await pagina.waitForTimeout(150);
await pagina.keyboard.press("g");
// Um intervalo curto: sem ele as duas teclas chegam no mesmo tick e o handler
// (que é síncrono) só vê a primeira.
await pagina.waitForTimeout(120);
await pagina.keyboard.press("q");
await pagina.waitForTimeout(900);
const rota = new URL(pagina.url()).pathname;
console.log(`atalho G+Q -> ${rota}`);
if (rota !== "/quadro") falhas += 1;

await browser.close();
console.log(falhas === 0 ? "\nOK: comportamento conferido" : `\n${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
