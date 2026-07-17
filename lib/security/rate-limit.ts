import { createHash } from "node:crypto";

export function hashClientAddress(ip: string): string {
  const secret = process.env.ORDER_TOKEN_SECRET;
  if (!secret) throw new Error("ORDER_TOKEN_SECRET nije podešen.");
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}
