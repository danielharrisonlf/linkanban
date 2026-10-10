import { expect, test } from "../fixtures/test";
import { uniqueName } from "../helpers/test-helpers";

test.describe("Gestão de Empresas @critical", () => {
  test("deve validar obrigatoriedade do nome ao tentar cadastrar empresa vazia", async ({
    empresasPage,
  }) => {
    await empresasPage.goto();
    await empresasPage.openNovaEmpresaModal();

    // Tenta salvar sem preencher nada
    await empresasPage.submitEmpresaForm();

    // Valida mensagem de erro inline
    await expect(empresasPage.page.getByText("Informe o nome da empresa.")).toBeVisible();
  });

  test("deve cadastrar uma nova empresa com sucesso e exibi-la na listagem", async ({
    empresasPage,
  }) => {
    const nomeEmpresa = uniqueName("Acme Corp");
    await empresasPage.goto();
    await empresasPage.openNovaEmpresaModal();

    await empresasPage.fillEmpresaForm({
      nome: nomeEmpresa,
      stack: "TypeScript, Node.js, PostgreSQL",
      estado: "SP",
      site: "https://acme.example.com",
    });
    await empresasPage.submitEmpresaForm();

    // Valida toast de sucesso
    await empresasPage.expectToast("Empresa cadastrada.");

    // Valida presença da empresa na lista
    await expect(empresasPage.getEmpresaItem(nomeEmpresa)).toBeVisible();
    await expect(empresasPage.page.getByText("TypeScript, Node.js, PostgreSQL")).toBeVisible();
  });

  test("deve filtrar empresas pelo campo de busca", async ({ empresasPage }) => {
    await empresasPage.goto();
    await empresasPage.expectLoaded();

    // Busca pela empresa inicial "Nubank"
    await empresasPage.search("Nubank");
    await expect(empresasPage.getEmpresaItem("Nubank")).toBeVisible();
    await expect(empresasPage.getEmpresaItem("Vercel")).not.toBeVisible();

    // Limpa a busca
    await empresasPage.search("");
    await expect(empresasPage.getEmpresaItem("Vercel")).toBeVisible();
  });

  test("deve editar os dados de uma empresa existente", async ({ empresasPage }) => {
    await empresasPage.goto();
    await empresasPage.expectLoaded();

    await empresasPage.clickEditarEmpresa("Vercel");
    await empresasPage.inputStack.fill("Next.js 16, Rust, Turborepo");
    await empresasPage.submitEmpresaForm();

    await empresasPage.expectToast("Empresa atualizada.");
    await expect(empresasPage.page.getByText("Next.js 16, Rust, Turborepo")).toBeVisible();
  });

  test("deve excluir uma empresa sem candidaturas vinculadas com confirmação", async ({
    empresasPage,
    apiMock,
  }) => {
    // Cria uma empresa limpa e isolada sem candidaturas para exclusão
    const empresaIsolada = {
      id: "emp-isolada",
      nome: "Empresa Para Excluir",
      created_at: new Date().toISOString(),
    };
    apiMock.empresas.push(empresaIsolada);

    await empresasPage.goto();
    await empresasPage.expectLoaded();

    await empresasPage.clickExcluirEmpresa(empresaIsolada.nome);
    await empresasPage.confirmarExclusao();

    await empresasPage.expectToast("Empresa excluída.");
    await expect(empresasPage.getEmpresaItem(empresaIsolada.nome)).not.toBeVisible();
  });
});
