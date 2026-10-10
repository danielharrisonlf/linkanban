import { expect, test } from "../fixtures/test";

test.describe("Navegação @navigation", () => {
  test("deve navegar fluidamente entre todas as rotas principais", async ({
    resumoPage,
    page,
  }) => {
    await resumoPage.goto();
    await resumoPage.expectLoaded();

    // Navega para Quadro
    await resumoPage.clickNav("Quadro");
    await expect(page).toHaveURL(/\/quadro/);
    await expect(page.getByRole("heading", { level: 1, name: "Quadro" })).toBeVisible();

    // Navega para Candidaturas
    await resumoPage.clickNav("Candidaturas");
    await expect(page).toHaveURL(/\/candidaturas/);
    await expect(page.getByRole("heading", { level: 1, name: "Candidaturas" })).toBeVisible();

    // Navega para Follow-ups
    await resumoPage.clickNav("Follow-ups");
    await expect(page).toHaveURL(/\/follow-ups/);
    await expect(page.getByRole("heading", { level: 1, name: "Follow-ups" })).toBeVisible();

    // Navega para Empresas
    await resumoPage.clickNav("Empresas");
    await expect(page).toHaveURL(/\/empresas/);
    await expect(page.getByRole("heading", { level: 1, name: "Empresas" })).toBeVisible();

    // Volta para o Resumo
    await resumoPage.clickNav("Resumo");
    await expect(page).toHaveURL(/\//);
    await expect(page.getByRole("heading", { level: 1, name: "Resumo" })).toBeVisible();
  });

  test("deve exibir página 404 e permitir retornar ao resumo quando a rota não existe", async ({
    page,
  }) => {
    await page.goto("/endereco-inexistente");
    await expect(
      page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
    ).toBeVisible();

    const linkVoltar = page.getByRole("link", { name: "Voltar ao resumo" });
    await expect(linkVoltar).toBeVisible();
    await linkVoltar.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Resumo" })).toBeVisible();
  });

  test("deve abrir o modal de registro ao pressionar o atalho de teclado 'r'", async ({
    resumoPage,
    page,
  }) => {
    await resumoPage.goto();
    await resumoPage.expectLoaded();

    // Pressiona tecla 'r' para abrir modal
    await page.keyboard.press("r");
    await expect(resumoPage.dialogCandidatura).toBeVisible();

    // Pressiona Escape para fechar
    await page.keyboard.press("Escape");
    await expect(resumoPage.dialogCandidatura).not.toBeVisible();
  });
});
