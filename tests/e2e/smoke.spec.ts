import { expect, test } from "../fixtures/test";

test.describe("Smoke Test @smoke", () => {
  test("deve carregar a aplicação com sucesso e renderizar elementos essenciais", async ({
    resumoPage,
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await resumoPage.goto();
    await resumoPage.expectLoaded();

    // Valida que o skip link de acessibilidade existe no topo do DOM
    await expect(resumoPage.skipLink).toBeAttached();

    // Valida que o botão principal de ação rápida está visível
    await expect(resumoPage.btnRegistrar).toBeVisible();

    // Valida que nenhum erro fatal de JS ocorreu
    expect(consoleErrors).toHaveLength(0);
  });
});
