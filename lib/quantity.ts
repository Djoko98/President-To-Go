export function clampQuantity(value: number, max: number): number {
  if (!Number.isInteger(max) || max < 1) throw new Error("Maksimalna količina nije ispravna.");
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}
