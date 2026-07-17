import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Naziv je obavezan.").max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug nije ispravan."),
  description: z.string().trim().max(500),
  ingredients: z.string().trim().min(2, "Sastojci su obavezni."),
  priceRsd: z.coerce.number().int().min(0),
  categoryId: z.string().uuid(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  containsAlcohol: z.boolean(),
  preparationMinutes: z.coerce.number().int().min(1).max(180),
  maxQuantity: z.coerce.number().int().min(1).max(50),
  isAvailable: z.boolean(),
  isActive: z.boolean(),
});
