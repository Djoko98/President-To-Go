const rsd = new Intl.NumberFormat("sr-Latn-RS", { maximumFractionDigits: 0 });

export function formatMoney(amountInParas: number): string {
  return `${rsd.format(Math.round(amountInParas / 100))} RSD`;
}

export function calculateLineTotal(price: number, quantity: number): number {
  if (!Number.isInteger(price) || price < 0) throw new Error("Cena nije ispravna.");
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Količina nije ispravna.");
  return price * quantity;
}

export function calculateCartTotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((total, item) => total + calculateLineTotal(item.price, item.quantity), 0);
}
