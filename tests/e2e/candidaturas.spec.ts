import { expect, test } from "../fixtures/test";
import { uniqueName } from "../helpers/test-helpers";

test.describe("Gestão de Candidaturas @critical", () => {
  test("deve validar campos obrigatórios ao tentar registrar candidatura vazia", async ({
    candidaturasPage,
  }) => {
    await candidaturasPage.goto();
    await candidaturasPage.openRegistrarModal();

    // Tenta submeter sem preencher
    await candidaturasPage.submitCandidaturaForm();

    // Valida mensagens de erro
    await expect(candidaturasPage.page.getByText("Informe o cargo da vaga.")).toBeVisible();
    await expect(candidaturasPage.page.getByText("Escolha a empresa.")).toBeVisible();
  });

  test("deve registrar uma nova candidatura com sucesso", async ({ candidaturasPage }) => {
    const nomeCargo = uniqueName("Senior Backend Engineer");
    await candidaturasPage.goto();
    await candidaturasPage.openRegistrarModal();

    await candidaturasPage.fillCandidaturaForm({
      cargo: nomeCargo,
      empresaNome: "Nubank",
    });
    await candidaturasPage.submitCandidaturaForm();

    await candidaturasPage.expectToast("Candidatura registrada.");
    await expect(candidaturasPage.getCandidaturaRow(nomeCargo)).toBeVisible();
  });

  test("deve filtrar candidaturas por busca de texto", async ({ candidaturasPage }) => {
    await candidaturasPage.goto();
    await candidaturasPage.expectLoaded();

    await candidaturasPage.search("Senior Frontend Engineer");
    await expect(candidaturasPage.getCandidaturaRow("Senior Frontend Engineer")).toBeVisible();
    await expect(candidaturasPage.getCandidaturaRow("Staff Software Engineer")).not.toBeVisible();

    await candidaturasPage.search("");
    await expect(candidaturasPage.getCandidaturaRow("Staff Software Engineer")).toBeVisible();
  });

  test("deve arquivar e desarquivar uma candidatura", async ({ candidaturasPage }) => {
    await candidaturasPage.goto();
    await candidaturasPage.expectLoaded();

    // Arquiva
    await candidaturasPage.clickArquivar("Senior Frontend Engineer");
    await candidaturasPage.expectToast("Candidatura arquivada.");

    // Candidatura não aparece na lista ativa
    await expect(candidaturasPage.getCandidaturaRow("Senior Frontend Engineer")).not.toBeVisible();

    // Marca "Incluir arquivadas"
    await candidaturasPage.checkboxArquivadas.check();
    await expect(candidaturasPage.getCandidaturaRow("Senior Frontend Engineer")).toBeVisible();
  });

  test("deve excluir candidatura com diálogo de confirmação e permitir desfazer", async ({
    candidaturasPage,
  }) => {
    await candidaturasPage.goto();
    await candidaturasPage.expectLoaded();

    // Clica em excluir
    await candidaturasPage.clickExcluir("Staff Software Engineer");
    await candidaturasPage.confirmarExclusao();

    // Notificação com botão de Desfazer
    await candidaturasPage.expectToast("Candidatura excluída.");
    await expect(candidaturasPage.getCandidaturaRow("Staff Software Engineer")).not.toBeVisible();

    // Clica em Desfazer
    const btnDesfazer = candidaturasPage.page.getByRole("button", { name: "Desfazer" });
    await btnDesfazer.click();

    await candidaturasPage.expectToast("Candidatura restaurada.");
    await expect(candidaturasPage.getCandidaturaRow("Staff Software Engineer")).toBeVisible();
  });
});
