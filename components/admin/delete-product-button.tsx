"use client";

import type { ReactNode } from "react";
import { deleteProduct } from "@/features/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";

/** Brisanje je nepovratno, pa svuda ide preko iste potvrde. */
export function DeleteProductButton({ id, name, className, label, spinnerSize = 18, children }: { id: string; name: string; className?: string; label?: string; spinnerSize?: number; children: ReactNode }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(event) => { if (!window.confirm(`Obrisati „${name}"? Proizvod nestaje iz ponude, a već poslate porudžbine ostaju netaknute.`)) event.preventDefault(); }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton spinnerSize={spinnerSize} className={className} aria-label={label}>{children}</SubmitButton>
    </form>
  );
}
