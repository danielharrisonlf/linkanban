/**
 * Verifica o contraste WCAG 2.1 das duas variantes do sistema visual Fio.
 *
 * Cobre três casos que quebram na prática:
 *  1. tinta sobre as superfícies (texto normal e secundário);
 *  2. tinta de etapa sobre a pílula tingida da própria etapa;
 *  3. tinta clara sobre preenchimento sólido de etapa (botão/badge cheio).
 *
 * Uso: node scripts/check-contrast.mjs
 */

const TEMAS = {
  escuro: {
    surfaces: {
      "surface.base": "#090D12",
      "surface.raised": "#0F151C",
      "surface.sunken": "#06090D",
    },
    inks: {
      "ink.primary": "#EEF5F4",
      "ink.secondary": "#A7B8C0",
      "ink.tertiary": "#718590",
      "accent": "#55DFB1",
      "danger": "#FF7E8C",
      "state-applied": "#69B9FF",
      "state-analysis": "#FFCB73",
      "state-interview": "#C19CFF",
      "state-test": "#FF9B76",
      "state-proposal": "#76D9E8",
      "state-rejected": "#FF7E8C",
      "state-approved": "#70E7A7",
    },
    stages: {
      APLICADO: { ink: "#69B9FF", tint: "#0F151C", solid: "#1C527C" },
      EM_ANALISE: { ink: "#FFCB73", tint: "#0F151C", solid: "#6B4A13" },
      ENTREVISTA: { ink: "#C19CFF", tint: "#0F151C", solid: "#4B337A" },
      TESTE_TECNICO: { ink: "#FF9B76", tint: "#0F151C", solid: "#7B3A28" },
      PROPOSTA: { ink: "#76D9E8", tint: "#0F151C", solid: "#286D78" },
      REJEITADO: { ink: "#FF7E8C", tint: "#0F151C", solid: "#7F3140" },
      APROVADO: { ink: "#70E7A7", tint: "#0F151C", solid: "#28704B" },
    },
    accentInk: "#061310",
    accent: "#55DFB1",
  },
  claro: {
    surfaces: {
      "surface.base": "#F4F8F9",
      "surface.raised": "#FFFFFF",
      "surface.sunken": "#E9F0F2",
    },
    inks: {
      "ink.primary": "#132B33",
      "ink.secondary": "#425A62",
      "ink.tertiary": "#4F6871",
      "accent": "#056D63",
      "danger": "#B13C4F",
      "state-applied": "#1F6E9F",
      "state-analysis": "#8B5E00",
      "state-interview": "#7654A6",
      "state-test": "#9F4A24",
      "state-proposal": "#006879",
      "state-rejected": "#B13C4F",
      "state-approved": "#1F7A4D",
    },
    stages: {
      APLICADO: { ink: "#1F6E9F", tint: "#FFFFFF", solid: "#1F6E9F" },
      EM_ANALISE: { ink: "#8B5E00", tint: "#FFFFFF", solid: "#8B5E00" },
      ENTREVISTA: { ink: "#7654A6", tint: "#FFFFFF", solid: "#7654A6" },
      TESTE_TECNICO: { ink: "#9F4A24", tint: "#FFFFFF", solid: "#9F4A24" },
      PROPOSTA: { ink: "#006879", tint: "#FFFFFF", solid: "#006879" },
      REJEITADO: { ink: "#B13C4F", tint: "#FFFFFF", solid: "#B13C4F" },
      APROVADO: { ink: "#1F7A4D", tint: "#FFFFFF", solid: "#1F7A4D" },
    },
    accentInk: "#FFFFFF",
    accent: "#056D63",
  },
};

const srgbToLinear = (canal) => {
  const c = canal / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminancia = (hex) => {
  const valor = hex.replace("#", "");
  const r = Number.parseInt(valor.slice(0, 2), 16);
  const g = Number.parseInt(valor.slice(2, 4), 16);
  const b = Number.parseInt(valor.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};

const razao = (frente, fundo) => {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  const [claro, escuro] = a > b ? [a, b] : [b, a];
  return (claro + 0.05) / (escuro + 0.05);
};

/** Mistura uma cor com o fundo, simulando o `bg-cor/12` do Tailwind. */
const misturar = (cor, fundo, proporcao) => {
  const ler = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.replace("#", "").slice(i - 1, i + 1), 16));
  const [r1, g1, b1] = ler(cor);
  const [r2, g2, b2] = ler(fundo);
  const mix = (a, b) => Math.round(a * proporcao + b * (1 - proporcao));
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
};

const fmt = (v) => v.toFixed(2).padStart(5, " ");
let falhas = 0;

const avaliar = (rotulo, valor, exigencia) => {
  const passa = valor >= exigencia;
  if (!passa) falhas += 1;
  console.log(`  ${fmt(valor)}:1  ${passa ? "OK  " : "FALHA"}  ${rotulo}`);
};

for (const [nomeTema, tema] of Object.entries(TEMAS)) {
  console.log(`\n================ ${nomeTema.toUpperCase()} ================`);
  console.log("\n=== tinta sobre superfícies (exigência 4.5:1) ===");
  for (const [nomeSuperficie, hexSuperficie] of Object.entries(tema.surfaces)) {
    console.log(`\n-- ${nomeSuperficie} (${hexSuperficie})`);
    for (const [nomeTinta, hexTinta] of Object.entries(tema.inks)) {
      avaliar(`${nomeTinta} (${hexTinta})`, razao(hexTinta, hexSuperficie), 4.5);
    }
  }

  console.log("\n=== tinta de etapa sobre a pílula tingida (12% da própria cor) ===");
  for (const [etapa, { ink, tint }] of Object.entries(tema.stages)) {
    const fundo = misturar(ink, tint, 0.12);
    avaliar(`${etapa} ${ink} sobre ${fundo}`, razao(ink, fundo), 4.5);
  }

  console.log("\n=== tinta clara sobre preenchimento sólido de etapa (exigência 4.5:1) ===");
  for (const [etapa, { solid }] of Object.entries(tema.stages)) {
    avaliar(`${etapa} #FFFFFF sobre ${solid}`, razao("#FFFFFF", solid), 4.5);
  }

  console.log("\n=== ação primária: tinta inversa sobre acento (exigência 4.5:1) ===");
  avaliar(`${nomeTema} ${tema.accentInk} sobre accent ${tema.accent}`, razao(tema.accentInk, tema.accent), 4.5);
}

console.log(
  `\n${falhas === 0 ? "OK: nenhuma combinação abaixo do exigido" : `ATENÇÃO: ${falhas} combinação(ões) abaixo do exigido`}`,
);

if (falhas > 0) process.exitCode = 1;
