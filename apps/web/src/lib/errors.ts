import { AxiosError } from "axios";

/**
 * Mensagem de erro voltada para quem está usando o app: diz o que aconteceu e,
 * quando dá, o que fazer. Nunca vaza stack trace, caminho de arquivo ou nome de
 * constraint do banco — o detalhe técnico fica no log do servidor.
 */
export function mensagemDeErro(
  error: unknown,
  contexto: "carregar" | "salvar" | "excluir",
): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Sem conexão com o servidor. Verifique a sua internet e tente de novo.";
    }

    const status = error.response.status;
    const detalhe = extrairDetalhe(error.response.data);

    // A API já responde com frases prontas em português para os casos de negócio
    // (validação, registro em uso, registro ausente). Confiar nelas evita a
    // segunda tradução — e evita ecoar erro de biblioteca.
    if (detalhe && status < 500) return detalhe;

    if (status === 404) {
      return "Esse registro não existe mais. Recarregue a página para atualizar a lista.";
    }
    if (status === 409) {
      return "Esse registro tem outros ligados a ele e não pode ser excluído agora.";
    }
    if (status >= 500) {
      return "Algo falhou do nosso lado. Tente de novo em instantes.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  const porContexto: Record<typeof contexto, string> = {
    carregar: "Não foi possível carregar.",
    salvar: "Não foi possível salvar.",
    excluir: "Não foi possível excluir.",
  };
  return porContexto[contexto];
}

function extrairDetalhe(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const registro = data as Record<string, unknown>;
    for (const chave of ["error", "message", "detalhe"]) {
      const valor = registro[chave];
      // Um caminho de arquivo ou stack trace nunca chega à tela: se a mensagem
      // parece técnica, é descartada e a interface usa a frase genérica.
      if (typeof valor === "string" && valor.trim() && !pareceTecnica(valor)) return valor;
    }
  }
  return null;
}

function pareceTecnica(texto: string): boolean {
  return (
    /[A-Za-z]:\\/.test(texto) ||
    /\bprisma\b/i.test(texto) ||
    /\bat \w+.*\(.*:\d+:\d+\)/.test(texto) ||
    /constraint/i.test(texto) ||
    /Invalid `/.test(texto)
  );
}
