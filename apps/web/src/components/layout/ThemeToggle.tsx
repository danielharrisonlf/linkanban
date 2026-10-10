import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { alternarTema, aplicarTema, lerTemaInicial, type Tema } from "../../lib/theme";

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(lerTemaInicial);
  const claro = tema === "light";
  const proximoTema = claro ? "escuro" : "claro";

  function alternar() {
    const novoTema = alternarTema(tema);
    aplicarTema(novoTema);
    setTema(novoTema);
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line bg-surface-sunken px-2.5 text-micro font-medium text-ink-secondary transition-colors duration-150 hover:border-line-strong hover:bg-surface-hover hover:text-ink-primary"
      aria-label={`Usar modo ${proximoTema}`}
      aria-pressed={claro}
      title={`Usar modo ${proximoTema}`}
      onClick={alternar}
    >
      {claro ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{claro ? "Escuro" : "Claro"}</span>
    </button>
  );
}
