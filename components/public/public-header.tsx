import Link from "next/link";
import { Lock } from "lucide-react";
import { ActiveOrderButton } from "@/components/public/active-order-button";
import { CartButton } from "@/components/public/cart-button";

export function PublicHeader() {
  return (
    <header className="public-home-header page-shell flex items-start justify-between overflow-hidden px-5 pb-2 pt-[max(18px,env(safe-area-inset-top))] sm:px-8 sm:pt-7">
      <Link href="/" className="min-w-0">
        <span className="block text-[clamp(1.75rem,7vw,3.75rem)] font-semibold leading-none tracking-[-.055em]">President To Go</span>
        <span className="mt-2 block text-[clamp(.85rem,3.5vw,1.15rem)] font-medium text-neutral-500">Žedan si? Poruči i osveži se.</span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/admin" aria-label="Administracija" title="Administracija" className="grid size-9 shrink-0 place-items-center rounded-full border border-neutral-300 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 active:scale-90">
          <Lock size={16} />
        </Link>
        <ActiveOrderButton />
        <CartButton />
      </div>
    </header>
  );
}
