import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonte self-hosted (sem CDN): só os pesos que a interface usa, variável em wght.
import "@fontsource-variable/geist/wght.css";
import "./index.css";
import { aplicarTema, lerTemaInicial } from "./lib/theme";
import { Root } from "./Root";

// Aplica a escolha antes da primeira renderização para evitar um clarão de tema.
aplicarTema(lerTemaInicial());

const container = document.getElementById("root");

if (!container) {
  throw new Error("Elemento #root não encontrado no index.html");
}

createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
