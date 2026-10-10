import { expect, test } from "../fixtures/test";

test.describe("Autenticação e Autorização @auth", () => {
  test("deve lidar com resposta 401 da API exibindo feedback amigável de erro", async ({
    page,
  }) => {
    // Sobrescreve rota /resumo para retornar 401
    await page.route("**/resumo", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          mensagem: "Envie um token Bearer válido.",
          codigo: "nao_autorizado",
        }),
      });
    });

    await page.goto("/");

    // Valida que a aplicação não quebra em tela branca e exibe mensagem de erro apropriada
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/401/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  });

  test("deve enviar o header de autorização quando configurado", async ({
    page,
    resumoPage,
  }) => {
    let authorizationHeader: string | null = null;

    await page.route("**/resumo", async (route) => {
      authorizationHeader = route.request().headers()["authorization"] || null;
      await route.continue();
    });

    await resumoPage.goto();
    await resumoPage.expectLoaded();

    // Se o token estiver presente no ambiente (ex: VITE_API_TOKEN), valida formato
    if (authorizationHeader) {
      expect(authorizationHeader).toMatch(/^Bearer /);
    }
  });
});
