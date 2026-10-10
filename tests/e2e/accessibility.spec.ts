import { expect, test } from "../fixtures/test";

test.describe("Acessibilidade Semântica @a11y", () => {
  test("deve conter landmarks semânticos principais e skip link", async ({
    resumoPage,
    page,
  }) => {
    await resumoPage.goto();
    await resumoPage.expectLoaded();

    // Valida o link 'Pular para o conteúdo'
    const skipLink = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute("href", "#conteudo");

    // Valida o elemento main
    const mainLandmark = page.locator("main#conteudo");
    await expect(mainLandmark).toBeVisible();

    // Valida a navegação com aria-label
    const navPrincipal = page.locator("aside, nav").filter({ hasText: "Resumo" }).first();
    await expect(navPrincipal).toBeVisible();
  });

  test("deve fechar diálogo modal com tecla Escape mantendo usabilidade por teclado", async ({
    resumoPage,
    page,
  }) => {
    await resumoPage.goto();
    await resumoPage.expectLoaded();

    await resumoPage.openRegistrarDialog();
    await expect(resumoPage.dialogCandidatura).toBeVisible();

    // Pressiona Escape
    await page.keyboard.press("Escape");
    await expect(resumoPage.dialogCandidatura).not.toBeVisible();
  });
});
