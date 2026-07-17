"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = React.ComponentProps<"button"> & { pendingText?: string; spinnerSize?: number };

export function SubmitButton({ children, className = "", pendingText, spinnerSize = 18, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button {...props} disabled={pending || disabled} aria-busy={pending} className={`inline-flex items-center justify-center gap-2 transition active:scale-[.97] disabled:cursor-wait disabled:opacity-60 ${className}`}>
      {pending ? <LoaderCircle className="animate-spin" size={spinnerSize} /> : null}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
