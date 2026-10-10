import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ContextoRegistrar {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

const Contexto = createContext<ContextoRegistrar | null>(null);

/**
 * "Registrar candidatura" é a ação mais frequente do produto e vive no topo, em
 * todas as telas — inclusive no quadro, que antes não tinha como criar nada.
 * Um contexto evita repetir o mesmo diálogo em cada página.
 */
export function RegistrarProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);

  const abrir = useCallback(() => setAberto(true), []);
  const fechar = useCallback(() => setAberto(false), []);

  const valor = useMemo(() => ({ aberto, abrir, fechar }), [aberto, abrir, fechar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRegistrar() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useRegistrar precisa estar dentro de <RegistrarProvider>");
  return contexto;
}
