const SERBIAN_PHONE = /^\+381[0-9]{8,9}$/;

export function normalizeSerbianPhone(input: string): string {
  const compact = input.replace(/[\s()\-/.]/g, "");
  if (compact.startsWith("00381")) return `+381${compact.slice(5).replace(/^0/, "")}`;
  if (compact.startsWith("+381")) return `+381${compact.slice(4).replace(/^0/, "")}`;
  if (compact.startsWith("381")) return `+381${compact.slice(3).replace(/^0/, "")}`;
  if (compact.startsWith("0")) return `+381${compact.slice(1)}`;
  return `+381${compact}`;
}

export function isValidSerbianPhone(input: string): boolean {
  return SERBIAN_PHONE.test(normalizeSerbianPhone(input));
}
