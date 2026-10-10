import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;
  readonly skipLink: Locator;
  readonly btnRegistrar: Locator;
  readonly btnMenuMobile: Locator;
  readonly btnFecharMenuMobile: Locator;
  readonly dialogCandidatura: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.skipLink = page.getByRole("link", { name: "Pular para o conteúdo" });
    this.btnRegistrar = page.getByRole("button", {
      name: /Registrar candidatura|Registrar/i,
    });
    this.btnMenuMobile = page.getByRole("button", { name: "Abrir menu" });
    this.btnFecharMenuMobile = page.getByRole("button", { name: "Fechar menu" });
    this.dialogCandidatura = page.getByRole("dialog", {
      name: /Registrar candidatura|Editar candidatura/i,
    });
    this.toast = page.locator('[data-slot="toast"]');
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async clickNav(name: "Resumo" | "Quadro" | "Candidaturas" | "Follow-ups" | "Empresas") {
    const routeMap: Record<string, string> = {
      Resumo: "/",
      Quadro: "/quadro",
      Candidaturas: "/candidaturas",
      "Follow-ups": "/follow-ups",
      Empresas: "/empresas",
    };
    const path = routeMap[name];
    // Se estiver em mobile e menu fechado, abre o menu primeiro
    const isMobileVisible = await this.btnMenuMobile.isVisible();
    if (isMobileVisible) {
      await this.btnMenuMobile.click();
      const mobileNav = this.page.getByRole("dialog").locator("nav").locator(`a[href="${path}"]`);
      await mobileNav.click();
    } else {
      const desktopNav = this.page.locator("aside nav").locator(`a[href="${path}"]`);
      await desktopNav.click();
    }
  }

  async openRegistrarDialog() {
    await this.btnRegistrar.click();
    await expect(this.dialogCandidatura).toBeVisible();
  }

  async expectToast(message: string | RegExp) {
    await expect(this.toast.filter({ hasText: message }).first()).toBeVisible({
      timeout: 5000,
    });
  }
}
