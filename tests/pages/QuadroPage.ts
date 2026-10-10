import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class QuadroPage extends BasePage {
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByRole("heading", { level: 1, name: "Quadro" });
  }

  async goto() {
    await super.goto("/quadro");
  }

  async expectLoaded() {
    await expect(this.pageHeader).toBeVisible();
  }

  getColumn(nomeColuna: string) {
    return this.page.locator("section, div").filter({ hasText: nomeColuna }).first();
  }

  getCard(cargo: string) {
    return this.page.locator("[data-card-candidatura], [draggable]").filter({ hasText: cargo }).first();
  }
}
