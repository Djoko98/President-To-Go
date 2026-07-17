import type { OrderStatus } from "@/types/domain";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Čeka potvrdu",
  accepted: "Prihvaćena",
  preparing: "U pripremi",
  ready: "Spremna za preuzimanje",
  completed: "Preuzeta",
  rejected: "Odbijena",
  cancelled: "Otkazana",
  expired: "Istekla",
};

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "rejected", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [], rejected: [], cancelled: [], expired: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return !["completed", "rejected", "cancelled", "expired"].includes(status);
}
