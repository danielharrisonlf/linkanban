import axios from "axios";

/**
 * Em desenvolvimento o Vite faz proxy de `/api` para a API (porta 3333),
 * o que evita CORS. Em produção aponte `VITE_API_URL` para a URL pública
 * da API (ou mantenha `/api` com um proxy reverso na frente do SPA).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 15_000,
});

const apiToken = import.meta.env.VITE_API_TOKEN;
if (apiToken) api.defaults.headers.common.Authorization = `Bearer ${apiToken}`;
