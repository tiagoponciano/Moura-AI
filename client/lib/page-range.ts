/** `"Mostrando 11 a 20 de 23"`, or `undefined` for an empty list. */
export function pageRange(
  pageIndex: number,
  pageSize: number,
  total: number,
): string | undefined {
  if (total === 0) return undefined;
  const from = pageIndex * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);
  return `Mostrando ${from} a ${to} de ${total}`;
}
