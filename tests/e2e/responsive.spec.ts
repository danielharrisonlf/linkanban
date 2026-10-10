import { expect, test } from "../fixtures/test";

test.describe("Responsividade Mobile @responsive", () => {
  test("deve abrir o menu gaveta em telas pequenas e permitir navegação", async ({
    page,
    resumoPage,
  }) => {
    // Força viewport mobile se não estiver já no projeto mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await resumoPage.goto();
    await resumoPage.expectLoaded();

    // Em mobile, a barra lateral desktop fica oculta e o botão de menu aparece
    const btnMenu = page.getByRole("button", { name: "Abrir menu" });
    await expect(btnMenu).toBeVisible();

    // Abre o menu
    await btnMenu.click();
    const dialogMenu = page.getByRole("dialog");
    await expect(dialogMenu).toBeVisible();

    // Clica em Empresas no menu mobile
    const linkEmpresas = dialogMenu.getByRole("link", { name: "Empresas" });
    await linkEmpresas.click();

    // Valida fechamento do menu e navegação
    await expect(dialogMenu).not.toBeVisible();
    await expect(page).toHaveURL(/\/empresas/);
    await expect(page.getByRole("heading", { level: 1, name: "Empresas" })).toBeVisible();
  });
});
