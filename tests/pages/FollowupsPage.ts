import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class FollowupsPage extends BasePage {
  readonly pageHeader: Locator;
  readonly btnNovoFollowup: Locator;
  readonly dialogResultado: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByRole("heading", { level: 1, name: "Follow-ups" });
    this.btnNovoFollowup = page.getByRole("button", { name: /Agendar cobrança|Novo follow-up/i });
    this.dialogResultado = page.getByRole("dialog", { name: /O que aconteceu\?/i });
  }

  async goto() {
    await super.goto("/follow-ups");
  }

  async expectLoaded() {
    await expect(this.pageHeader).toBeVisible();
  }

  getFollowupCard(nome: string) {
    return this.page.locator("li").filter({ hasText: nome });
  }

  async registrarResultado(cargo: string, resultado: string) {
    const card = this.getFollowupCard(cargo);
    await card.getByRole("button", { name: "Registrar resultado" }).click();
    await expect(this.dialogResultado).toBeVisible();
    await this.dialogResultado.getByText(resultado, { exact: true }).click();
    await this.dialogResultado.getByRole("button", { name: "Salvar resultado" }).click();
  }
}
