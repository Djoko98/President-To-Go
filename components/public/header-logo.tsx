"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const TAPS_TO_ADMIN = 5;
// Prozor između dva tapa i odloženi odlazak na početnu; 450ms je bilo prekratko za pet tapova na telefonu.
const TAP_WINDOW_MS = 800;
// Posle otvaranja admina tapovi se ignorišu da šesti tap ne bi zakazao vraćanje na početnu.
const LOCK_MS = 2500;

// Skriveni ulaz u administraciju: 5 tapova na logo. Običan tap vodi na početnu.
export function HeaderLogo() {
  const router = useRouter();
  const pathname = usePathname();
  const count = useRef(0);
  const lastTap = useRef(0);
  const homeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);

  // Bez ovoga zakazani odlazak na početnu preživi navigaciju i izbaci nas sa admin prijave.
  useEffect(() => () => {
    if (homeTimer.current) clearTimeout(homeTimer.current);
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
  }, []);

  const clearHomeTimer = () => {
    if (homeTimer.current) clearTimeout(homeTimer.current);
    homeTimer.current = null;
  };

  // Brojanje ide na pointerdown: brzi tapovi umeju da izgube click event.
  const countTap = (event: React.PointerEvent<HTMLDivElement>) => {
    if (locked.current || event.button !== 0 || !event.isPrimary) return;
    const now = Date.now();
    count.current = now - lastTap.current > TAP_WINDOW_MS ? 1 : count.current + 1;
    lastTap.current = now;
    if (count.current < TAPS_TO_ADMIN) return;
    count.current = 0;
    locked.current = true;
    clearHomeTimer();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(40);
    router.push("/admin");
    // Ako navigacija ne prođe (offline, greška), logo se ne sme zauvek zaključati.
    unlockTimer.current = setTimeout(() => { locked.current = false; }, LOCK_MS);
  };

  // Odlazak na početnu ide na click, pa prevlačenje za skrolovanje ne broji kao tap.
  const armHome = () => {
    if (locked.current || pathname === "/") return;
    clearHomeTimer();
    homeTimer.current = setTimeout(() => {
      homeTimer.current = null;
      count.current = 0;
      router.push("/");
    }, TAP_WINDOW_MS);
  };

  const goHome = () => {
    clearHomeTimer();
    count.current = 0;
    if (pathname !== "/") router.push("/");
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label="President To Go — početna"
      onPointerDown={countTap}
      onClick={armHome}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); goHome(); } }}
      onContextMenu={(event) => event.preventDefault()}
      className="min-w-0 cursor-pointer select-none rounded-xl [-webkit-touch-callout:none] [touch-action:manipulation]"
    >
      <span className="block whitespace-nowrap text-[clamp(1.75rem,7vw,3.75rem)] font-semibold leading-none tracking-[-.055em]">President To Go</span>
      <span className="mt-2 block truncate text-[clamp(.85rem,3.5vw,1.15rem)] font-medium text-neutral-500">Poruči omiljeno. Preuzmi bez čekanja.</span>
    </div>
  );
}
