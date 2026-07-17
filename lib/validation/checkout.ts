import { z } from "zod";
import { isValidSerbianPhone, normalizeSerbianPhone } from "@/lib/phone";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(3, "Unesi ime i prezime.").max(120, "Ime je predugačko."),
  customerPhone: z.string().min(1, "Unesi broj telefona.").refine(isValidSerbianPhone, "Unesi ispravan srpski broj telefona."),
  requestedPickupAt: z.string().datetime({ offset: true, message: "Izaberi vreme preuzimanja." }),
  customerNote: z.string().trim().max(800, "Napomena može imati najviše 800 karaktera.").optional(),
  adultConfirmed: z.boolean(),
  items: z.array(z.object({ productId: z.string().uuid("Proizvod nije ispravan."), quantity: z.number().int().min(1).max(50) })).min(1, "Korpa je prazna."),
  idempotencyKey: z.string().uuid(),
}).transform((value) => ({ ...value, customerPhone: normalizeSerbianPhone(value.customerPhone) }));

export type CheckoutInput = z.input<typeof checkoutSchema>;
