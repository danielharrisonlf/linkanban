import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ResumoPage extends BasePage {
  readonly pageHeader: Locator;
  readonly cardTotal: Locator;
  readonly cardEntrevistas: Locator;
  readonly secaoFunil: Locator;
  readonly secaoParadas: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByRole("heading", { level: 1, name: "Resumo" });
    this.cardTotal = page.locator("text=Total de candidaturas").locator("..");
    this.cardEntrevistas = page.locator("text=Taxa de entrevistas").locator("..");
    this.secaoFunil = page.getByRole("region", { name: /Funil de etapas/i });
    this.secaoParadas = page.getByRole("region", { name: /Candidaturas que pedem atenção/i });
    this.emptyState = page.getByText("Nada para acompanhar ainda");
  }

  async goto() {
    await super.goto("/");
  }

  async expectLoaded() {
    await expect(this.pageHeader).toBeVisible();
  }

  async expectMetricsVisible() {
    await expect(this.page.getByText("Total de candidaturas")).toBeVisible();
  }
}
