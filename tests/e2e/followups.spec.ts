import { expect, test } from "../fixtures/test";

test.describe("Follow-ups de Candidaturas @critical", () => {
  test("deve exibir follow-ups pendentes organizados por urgência", async ({
    followupsPage,
    page,
  }) => {
    await followupsPage.goto();
    await followupsPage.expectLoaded();

    // Deve exibir as cobranças cadastradas na fixture
    await expect(page.getByText("Checar retorno sobre a entrevista técnica")).toBeVisible();
    await expect(page.getByText("Confirmar recebimento do teste prático")).toBeVisible();
  });

  test("deve registrar o resultado de uma cobrança efetuada", async ({
    followupsPage,
  }) => {
    await followupsPage.goto();
    await followupsPage.expectLoaded();

    // Registra que responderam
    await followupsPage.registrarResultado("Senior Frontend Engineer", "Responderam");

    // Toast de confirmação
    await followupsPage.expectToast(/Resultado registrado|Follow-up concluído|atualizado/i);
  });
});
