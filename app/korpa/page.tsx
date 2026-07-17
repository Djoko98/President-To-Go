import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/public-header";
import { CartPage } from "@/components/public/cart-page";

export const metadata: Metadata = { title: "Korpa" };
export default function Page() { return <><PublicHeader /><CartPage /></>; }
