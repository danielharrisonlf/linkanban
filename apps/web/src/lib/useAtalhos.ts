import { useEffect } from "react";

/**
 * Atalhos de teclado globais. São invisíveis para quem não procura e não
 * atrapalham quem não usa:
 *
 * · `r` — registrar candidatura (o verbo da ação, não a inicial do recurso)
 * · `/` — focar a busca da tela atual
 * · `g` depois `r`/`q`/`c`/`f`/`e` — ir para Resumo, Quadro, Candidaturas,
 *   Follow-ups, Empresas (o mesmo esquema `g` + letra que GitHub e Linear usam)
 *
 * Nunca dispara enquanto a pessoa está digitando num campo, e nunca em combinação
 * com modificadores — assim não rouba atalho do navegador nem do leitor de tela.
 */
export function useAtalhos({ aoRegistrar }: { aoRegistrar: () => void }) {
  useEffect(() => {
    let esperandoDestino = false;
    let tempoLimite = 0;

    function estaDigitando(alvo: EventTarget | null): boolean {
      if (!(alvo instanceof HTMLElement)) return false;
      return alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
    }

    function irPara(caminho: string) {
      if (window.location.pathname !== caminho) {
        window.location.assign(caminho);
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      if (estaDigitando(evento.target)) return;

      if (esperandoDestino) {
        esperandoDestino = false;
        const destino = {
          r: "/",
          q: "/quadro",
          c: "/candidaturas",
          f: "/follow-ups",
          e: "/empresas",
        }[evento.key.toLowerCase()];
        if (destino) {
          evento.preventDefault();
          irPara(destino);
        }
        return;
      }

      if (evento.key === "g") {
        esperandoDestino = true;
        window.clearTimeout(tempoLimite);
        tempoLimite = window.setTimeout(() => {
          esperandoDestino = false;
        }, 1200);
        return;
      }

      if (evento.key === "r") {
        evento.preventDefault();
        aoRegistrar();
        return;
      }

      if (evento.key === "/") {
        const busca = document.querySelector<HTMLInputElement>(
          "input[type='search'], #busca, #busca-empresas",
        );
        if (busca) {
          evento.preventDefault();
          busca.focus();
        }
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      window.clearTimeout(tempoLimite);
    };
  }, [aoRegistrar]);
}
