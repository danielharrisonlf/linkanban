/**
 * Utilitários auxiliares para os testes E2E do Linkanban.
 */

export function uniqueName(prefix: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix} ${randomSuffix}`;
}

export function formatDateToISO(daysOffset = 0): string {
  const d = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

export function toDateInputString(date = new Date()): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
