import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class EmpresasPage extends BasePage {
  readonly pageHeader: Locator;
  readonly btnNovaEmpresa: Locator;
  readonly inputBusca: Locator;
  readonly dialogEmpresa: Locator;
  readonly inputNome: Locator;
  readonly inputStack: Locator;
  readonly inputEstado: Locator;
  readonly selectModelo: Locator;
  readonly inputSite: Locator;
  readonly btnSalvarEmpresa: Locator;
  readonly btnCancelarEmpresa: Locator;
  readonly dialogConfirmarExclusao: Locator;
  readonly btnConfirmarExclusao: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByRole("heading", { level: 1, name: "Empresas" });
    this.btnNovaEmpresa = page.getByRole("button", { name: /Nova empresa/i });
    this.inputBusca = page.getByPlaceholder("Nome, tecnologias ou região");
    this.dialogEmpresa = page.getByRole("dialog", {
      name: /Nova empresa|Editar empresa|Cadastrar empresa/i,
    });
    this.inputNome = page.locator("#emp-nome");
    this.inputStack = page.locator("#emp-tec");
    this.inputEstado = page.locator("#emp-estado");
    this.selectModelo = page.locator("#emp-modelo");
    this.inputSite = page.locator("#emp-site");
    this.btnSalvarEmpresa = this.dialogEmpresa.getByRole("button", {
      name: /Cadastrar empresa|Salvar/i,
    });
    this.btnCancelarEmpresa = this.dialogEmpresa.getByRole("button", { name: "Cancelar" });
    this.dialogConfirmarExclusao = page.getByRole("dialog", { name: "Excluir empresa" });
    this.btnConfirmarExclusao = this.dialogConfirmarExclusao.getByRole("button", {
      name: "Excluir",
    });
  }

  async goto() {
    await super.goto("/empresas");
  }

  async expectLoaded() {
    await expect(this.pageHeader).toBeVisible();
  }

  async openNovaEmpresaModal() {
    await this.btnNovaEmpresa.click();
    await expect(this.dialogEmpresa).toBeVisible();
  }

  async fillEmpresaForm(dados: {
    nome: string;
    stack?: string;
    estado?: string;
    site?: string;
  }) {
    await this.inputNome.fill(dados.nome);
    if (dados.stack) await this.inputStack.fill(dados.stack);
    if (dados.estado) await this.inputEstado.fill(dados.estado);
    if (dados.site) await this.inputSite.fill(dados.site);
  }

  async submitEmpresaForm() {
    await this.btnSalvarEmpresa.click();
  }

  async search(termo: string) {
    await this.inputBusca.fill(termo);
  }

  getEmpresaItem(nome: string) {
    return this.page.locator("li").filter({ hasText: nome });
  }

  async clickEditarEmpresa(nome: string) {
    await this.page.getByRole("button", { name: `Editar ${nome}` }).click();
    await expect(this.dialogEmpresa).toBeVisible();
  }

  async clickExcluirEmpresa(nome: string) {
    await this.page.getByRole("button", { name: `Excluir ${nome}` }).click();
    await expect(this.dialogConfirmarExclusao).toBeVisible();
  }

  async confirmarExclusao() {
    await this.btnConfirmarExclusao.click();
  }
}
