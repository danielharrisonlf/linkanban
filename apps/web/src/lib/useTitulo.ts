import { useEffect } from "react";

/**
 * Título do documento por tela. Sem isto, quem navega com leitor de tela não
 * recebe anúncio de mudança de página, e o histórico do navegador fica com três
 * entradas iguais.
 */
export function useTituloDaPagina(titulo?: string) {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo ? `${titulo} · Fio` : "Fio";
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
