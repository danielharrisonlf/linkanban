import { test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ request }) => {
  // Para aplicações com endpoint de login/token ou sessão reutilizável
  // Linkanban usa Bearer Token configurado no ambiente ou cookies de sessão.
  // Salvamos o estado de autenticação para reuso em storageState.
  await request.storageState({ path: authFile });
});
