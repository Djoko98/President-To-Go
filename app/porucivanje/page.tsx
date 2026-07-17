import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/public-header";
import { CheckoutForm } from "@/components/public/checkout-form";
export const metadata: Metadata = { title: "Poručivanje" };
export default function Page() { return <><PublicHeader /><CheckoutForm /></>; }
