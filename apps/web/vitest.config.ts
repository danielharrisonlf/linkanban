// Este arquivo é intencionalmente excluído do `tsc -b` (ver tsconfig.node.json):
// o Vitest 4 embute o Vite 7 e os tipos de plugin das duas versões não se unificam.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/types/**"],
    },
  },
});
