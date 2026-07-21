import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicHeader } from "@/components/public/public-header";
import { CartPage } from "@/components/public/cart-page";

export const metadata: Metadata = { title: "Korpa" };
export default function Page() {
  return (
    <>
      <PublicHeader left={
        <Link href="/" aria-label="Nastavi kupovinu" className="flex min-h-12 min-w-0 items-center gap-2 text-base font-bold text-neutral-800 transition-colors hover:text-black sm:text-lg">
          <ArrowLeft size={22} strokeWidth={2.4} className="shrink-0" />
          <span className="truncate">Nastavi kupovinu</span>
        </Link>
      } />
      <CartPage />
    </>
  );
}
