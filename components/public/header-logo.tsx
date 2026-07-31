"use client";

import Image from "next/image";
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
      className="inline-flex min-w-0 cursor-pointer select-none items-center gap-3 rounded-xl [-webkit-touch-callout:none]"
    >
      <Image
        src="/brand/president-to-go-logo.png"
        alt=""
        width={1024}
        height={1024}
        priority
        className="h-[clamp(46px,7.2dvh,72px)] w-auto rounded-xl border border-black/5 bg-white object-contain"
      />
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[clamp(1.25rem,5vw,2.25rem)] font-semibold leading-none tracking-[-.055em]">President To Go</span>
        <span className="mt-1 block truncate text-[clamp(.68rem,2.5vw,.9rem)] font-medium text-neutral-500">Poruči omiljeno. Preuzmi bez čekanja.</span>
      </span>
    </div>
  );
}
