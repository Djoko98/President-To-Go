import { HeaderLogo } from "@/components/public/header-logo";
import { ActiveOrderButton } from "@/components/public/active-order-button";
import { CartButton } from "@/components/public/cart-button";

export function PublicHeader() {
  return (
    <header className="public-home-header page-shell flex items-start justify-between overflow-hidden px-5 pb-2 pt-[max(18px,env(safe-area-inset-top))] sm:px-8 sm:pt-7">
      <HeaderLogo />
      <div className="flex shrink-0 items-center gap-2">
        <ActiveOrderButton />
        <CartButton />
      </div>
    </header>
  );
}
