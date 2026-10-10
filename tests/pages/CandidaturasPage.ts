import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CandidaturasPage extends BasePage {
  readonly pageHeader: Locator;
  readonly btnRegistrarTopo: Locator;
  readonly inputBusca: Locator;
  readonly selectEtapa: Locator;
  readonly selectOrdenar: Locator;
  readonly checkboxArquivadas: Locator;
  readonly dialogCandidatura: Locator;
  readonly inputCargo: Locator;
  readonly selectEmpresaTrigger: Locator;
  readonly btnSalvarCandidatura: Locator;
  readonly dialogConfirmarExclusao: Locator;
  readonly btnConfirmarExclusao: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByRole("heading", { level: 1, name: "Candidaturas" });
    this.btnRegistrarTopo = page.locator("header, .page-main").getByRole("button", {
      name: "Registrar candidatura",
    });
    this.inputBusca = page.getByPlaceholder("Cargo, empresa ou onde encontrou");
    this.selectEtapa = page.locator("#filtro-etapa");
    this.selectOrdenar = page.locator("#ordenar");
    this.checkboxArquivadas = page.getByLabel("Incluir arquivadas");

    this.dialogCandidatura = page.getByRole("dialog", {
      name: /Registrar candidatura|Editar candidatura/i,
    });
    this.inputCargo = page.locator("#cand-cargo");
    this.selectEmpresaTrigger = page.locator("#cand-empresa");
    this.btnSalvarCandidatura = this.dialogCandidatura.locator('button[type="submit"]');

    this.dialogConfirmarExclusao = page.getByRole("dialog", { name: /Excluir candidatura/i });
    this.btnConfirmarExclusao = this.dialogConfirmarExclusao.getByRole("button", {
      name: "Excluir",
    });
  }

  async goto() {
    await super.goto("/candidaturas");
  }

  async expectLoaded() {
    await expect(this.pageHeader).toBeVisible();
  }

  async openRegistrarModal() {
    await this.btnRegistrarTopo.first().click();
    await expect(this.dialogCandidatura).toBeVisible();
  }

  async fillCandidaturaForm(dados: { cargo: string; empresaNome: string }) {
    await this.inputCargo.fill(dados.cargo);
    // Abre o select do Radix e clica na empresa desejada
    await this.selectEmpresaTrigger.click();
    await this.page.getByRole("option", { name: dados.empresaNome }).click();
  }

  async submitCandidaturaForm() {
    await this.btnSalvarCandidatura.click();
  }

  async search(termo: string) {
    await this.inputBusca.fill(termo);
  }

  getCandidaturaRow(cargoOuEmpresa: string) {
    return this.page
      .locator("tbody tr, ul li")
      .filter({ hasText: cargoOuEmpresa })
      .locator("visible=true");
  }

  async clickArquivar(cargo: string) {
    const row = this.getCandidaturaRow(cargo);
    await row.getByRole("button", { name: /Arquivar|Reativar/i }).click();
  }

  async clickExcluir(cargo: string) {
    const row = this.getCandidaturaRow(cargo);
    await row.getByRole("button", { name: /Excluir/i }).click();
    await expect(this.dialogConfirmarExclusao).toBeVisible();
  }

  async confirmarExclusao() {
    await this.btnConfirmarExclusao.click();
  }
}
