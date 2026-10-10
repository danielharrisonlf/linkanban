import { useQuery } from "@tanstack/react-query";
import { resumoApi } from "../services/api";
import { resumoKeys } from "./query-keys";

/**
 * O resumo é agregado no servidor: contagem por etapa, taxas e — o que importa
 * de verdade — quantas candidaturas estão paradas e há quantos dias. Calcular
 * isso na tela exigiria carregar todas as candidaturas só para contar.
 */
export function useResumo() {
  return useQuery({
    queryKey: resumoKeys.all,
    queryFn: resumoApi.get,
  });
}
