import { expect, test } from "../fixtures/test";

test.describe("Quadro Kanban @critical", () => {
  test("deve renderizar o quadro com todas as colunas de etapas", async ({
    quadroPage,
    page,
  }) => {
    await quadroPage.goto();
    await quadroPage.expectLoaded();

    // Valida colunas essenciais do Kanban
    await expect(page.getByRole("heading", { level: 2, name: "Enviei" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Entrevista" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Teste" })).toBeVisible();

    // Valida que os cartões iniciais aparecem no quadro
    await expect(page.getByText("Senior Frontend Engineer")).toBeVisible();
    await expect(page.getByText("Tech Lead Frontend")).toBeVisible();
  });
});
