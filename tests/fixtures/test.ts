import { test as baseTest, expect } from "@playwright/test";
import { ApiMockController } from "../helpers/api-mock";
import { CandidaturasPage } from "../pages/CandidaturasPage";
import { EmpresasPage } from "../pages/EmpresasPage";
import { FollowupsPage } from "../pages/FollowupsPage";
import { QuadroPage } from "../pages/QuadroPage";
import { ResumoPage } from "../pages/ResumoPage";

interface TestFixtures {
  apiMock: ApiMockController;
  resumoPage: ResumoPage;
  candidaturasPage: CandidaturasPage;
  empresasPage: EmpresasPage;
  followupsPage: FollowupsPage;
  quadroPage: QuadroPage;
}

export const test = baseTest.extend<TestFixtures>({
  apiMock: async ({ page }, use) => {
    const mock = new ApiMockController();
    await mock.install(page);
    await use(mock);
  },

  resumoPage: async ({ page, apiMock: _mock }, use) => {
    await use(new ResumoPage(page));
  },

  candidaturasPage: async ({ page, apiMock: _mock }, use) => {
    await use(new CandidaturasPage(page));
  },

  empresasPage: async ({ page, apiMock: _mock }, use) => {
    await use(new EmpresasPage(page));
  },

  followupsPage: async ({ page, apiMock: _mock }, use) => {
    await use(new FollowupsPage(page));
  },

  quadroPage: async ({ page, apiMock: _mock }, use) => {
    await use(new QuadroPage(page));
  },
});

export { expect };
