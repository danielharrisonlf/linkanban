export type Tema = "dark" | "light";

const CHAVE_TEMA = "fio-theme";

function temaValido(valor: string | null): valor is Tema {
  return valor === "dark" || valor === "light";
}

/** O escuro continua sendo a identidade padrão; a escolha clara fica persistida no navegador. */
export function lerTemaInicial(): Tema {
  if (typeof window === "undefined") return "dark";

  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA);
    return temaValido(salvo) ? salvo : "dark";
  } catch {
    return "dark";
  }
}

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  raiz.dataset.theme = tema;
  raiz.style.colorScheme = tema;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute("content", tema === "light" ? "#f4f8f9" : "#090d12");

  try {
    window.localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // O tema continua funcionando mesmo quando o navegador bloqueia storage.
  }
}

export function alternarTema(tema: Tema): Tema {
  return tema === "dark" ? "light" : "dark";
}
