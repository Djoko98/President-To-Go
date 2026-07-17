export const ACTIVE_ORDER_STORAGE_KEY = "president-to-go-active-order";
export const ACTIVE_ORDER_CHANGED_EVENT = "president-to-go-active-order-changed";

export interface StoredActiveOrder {
  token: string;
  orderNumber: string | null;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function browserStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function notifyBrowser(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ACTIVE_ORDER_CHANGED_EVENT));
}

export function readActiveOrder(storage?: StorageLike): StoredActiveOrder | null {
  const target = browserStorage(storage);
  if (!target) return null;

  try {
    const raw = target.getItem(ACTIVE_ORDER_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredActiveOrder>;
    if (!UUID_PATTERN.test(value.token ?? "")) return null;
    if (value.orderNumber !== null && typeof value.orderNumber !== "string") return null;
    return { token: value.token!, orderNumber: value.orderNumber ?? null };
  } catch {
    return null;
  }
}

export function saveActiveOrder(order: StoredActiveOrder, storage?: StorageLike): void {
  if (!UUID_PATTERN.test(order.token)) return;
  const target = browserStorage(storage);
  if (!target) return;
  target.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(order));
  if (!storage) notifyBrowser();
}

export function clearActiveOrder(token?: string, storage?: StorageLike): void {
  const target = browserStorage(storage);
  if (!target) return;
  if (token && readActiveOrder(target)?.token !== token) return;
  target.removeItem(ACTIVE_ORDER_STORAGE_KEY);
  if (!storage) notifyBrowser();
}
