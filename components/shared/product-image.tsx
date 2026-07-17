import Image from "next/image";
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/catalog-fallback";

export function ProductImage({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  return <Image src={src || PRODUCT_FALLBACK_IMAGE} alt={alt} fill sizes="(max-width: 768px) 72vw, 420px" className={`object-contain ${className}`} priority={alt === "Lubenito"} />;
}
