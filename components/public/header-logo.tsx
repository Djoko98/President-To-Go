"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

// Skriveni ulaz u administraciju: 5 brzih tapova na logo. Običan tap vodi na početnu.
export function HeaderLogo() {
  const router = useRouter();
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    count.current += 1;
    if (timer.current) clearTimeout(timer.current);
    if (count.current >= 5) {
      count.current = 0;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(40);
      router.push("/admin");
      return;
    }
    timer.current = setTimeout(() => {
      count.current = 0;
      router.push("/");
    }, 450);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label="President To Go — početna"
      onClick={handleTap}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push("/"); } }}
      onContextMenu={(event) => event.preventDefault()}
      className="min-w-0 cursor-pointer select-none [-webkit-touch-callout:none]"
    >
      <span className="block text-[clamp(1.75rem,7vw,3.75rem)] font-semibold leading-none tracking-[-.055em]">President To Go</span>
      <span className="mt-2 block text-[clamp(.85rem,3.5vw,1.15rem)] font-medium text-neutral-500">Žedan si? Poruči i osveži se.</span>
    </div>
  );
}
