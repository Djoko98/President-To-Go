import type { OrderStatus } from "@/types/domain";

export interface NotificationMessage {
  orderId: string;
  recipient: string;
  event: "accepted" | "pickup_changed" | "ready" | "rejected";
  status: OrderStatus;
  text: string;
}

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<{ providerMessageId?: string }>;
}

class DisabledNotificationProvider implements NotificationProvider {
  async send(): Promise<Record<string, never>> { return {}; }
}

export function createNotificationProvider(): NotificationProvider {
  // The Twilio adapter can be injected here without changing order-domain code.
  return new DisabledNotificationProvider();
}
