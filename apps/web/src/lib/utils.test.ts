import { describe, expect, it } from "vitest";
import type { StatusCandidatura } from "../types";
import {
  formatShortDate,
  percent,
  STATUS_LABELS,
  toDateInput,
  toDateTimeLocal,
  urgenciaFollowup,
} from "./utils";

describe("percent", () => {
  it("devolve a fração em pontos percentuais", () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(3, 4)).toBe(75);
  });

  it("nunca devolve NaN, negativo ou acima de 100", () => {
    expect(percent(1, 0)).toBe(0);
    expect(percent(Number.NaN, 10)).toBe(0);
    expect(percent(5, 2)).toBe(100);
    expect(percent(-5, 2)).toBe(0);
  });
});

describe("formatShortDate", () => {
  it("formata dia e mês abreviado em pt-BR", () => {
    expect(formatShortDate("2026-03-27T12:00:00.000Z")).toMatch(/^2[67] de mar$/i);
  });

  it("devolve travessão para data inválida", () => {
    expect(formatShortDate("não é data")).toBe("—");
  });
});

describe("urgenciaFollowup", () => {
  const agora = new Date();

  it("concluído tem prioridade sobre a data", () => {
    expect(urgenciaFollowup("2020-01-01T10:00:00.000Z", true)).toBe("concluido");
  });

  it("data no passado é atrasado", () => {
    const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    expect(urgenciaFollowup(ontem, false)).toBe("atrasado");
  });

  it("o mesmo dia é hoje", () => {
    expect(urgenciaFollowup(agora, false)).toBe("hoje");
  });

  it("data futura é futuro", () => {
    const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    expect(urgenciaFollowup(amanha, false)).toBe("futuro");
  });
});

describe("conversores de input", () => {
  it("toDateInput devolve yyyy-mm-dd", () => {
    expect(toDateInput(new Date(2026, 2, 27))).toBe("2026-03-27");
  });

  it("toDateTimeLocal devolve yyyy-mm-ddThh:mm", () => {
    expect(toDateTimeLocal(new Date(2026, 2, 27, 9, 5))).toBe("2026-03-27T09:05");
  });

  it("devolve string vazia para valor inválido", () => {
    expect(toDateInput("x")).toBe("");
    expect(toDateTimeLocal("x")).toBe("");
  });
});

describe("rótulos de etapa", () => {
  it("cobre todas as etapas do processo", () => {
    const statuses: StatusCandidatura[] = [
      "APLICADO",
      "EM_ANALISE",
      "ENTREVISTA",
      "TESTE_TECNICO",
      "PROPOSTA",
      "REJEITADO",
      "APROVADO",
    ];
    for (const status of statuses) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
