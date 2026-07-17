"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import {
  ACTIVE_ORDER_CHANGED_EVENT,
  ACTIVE_ORDER_STORAGE_KEY,
  clearActiveOrder,
  readActiveOrder,
  saveActiveOrder,
  type StoredActiveOrder,
} from "@/lib/active-order";
import { isActiveOrderStatus } from "@/lib/order-status";
import type { PublicOrder } from "@/types/domain";

export function ActiveOrderButton() {
  const [activeOrder, setActiveOrder] = useState<StoredActiveOrder | null>(null);

  const syncFromStorage = useCallback(() => setActiveOrder(readActiveOrder()), []);
  const validateOrder = useCallback(async () => {
    const stored = readActiveOrder();
    if (!stored) return;

    try {
      const response = await fetch(`/api/orders/${stored.token}`, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) clearActiveOrder(stored.token);
        return;
      }

      const order = await response.json() as Pick<PublicOrder, "order_number" | "status">;
      if (!isActiveOrderStatus(order.status)) {
        clearActiveOrder(stored.token);
        return;
      }
      if (stored.orderNumber !== order.order_number) {
        saveActiveOrder({ token: stored.token, orderNumber: order.order_number });
      }
    } catch {
      // Keep the shortcut available while the customer is temporarily offline.
    }
  }, []);

  useEffect(() => {
    const initialSync = window.setTimeout(syncFromStorage, 0);
    void validateOrder();
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === ACTIVE_ORDER_STORAGE_KEY) syncFromStorage();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ACTIVE_ORDER_CHANGED_EVENT, syncFromStorage);
    window.addEventListener("focus", validateOrder);
    const poll = window.setInterval(() => void validateOrder(), 30_000);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ACTIVE_ORDER_CHANGED_EVENT, syncFromStorage);
      window.removeEventListener("focus", validateOrder);
      window.clearInterval(poll);
    };
  }, [syncFromStorage, validateOrder]);

  if (!activeOrder) return null;

  const label = activeOrder.orderNumber
    ? `Prati porudžbinu #${activeOrder.orderNumber}`
    : "Prati porudžbinu";

  return (
    <Link
      href={`/porudzbina/${activeOrder.token}`}
      aria-label={label}
      title={label}
      className="grid size-12 shrink-0 place-items-center rounded-full border border-neutral-300 bg-white text-black shadow-sm transition-colors hover:bg-neutral-100"
    >
      <ReceiptText aria-hidden size={21} strokeWidth={2.2} />
    </Link>
  );
}
