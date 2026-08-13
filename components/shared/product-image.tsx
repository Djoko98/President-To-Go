import type { CSSProperties } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export function ProductImage({ src, alt, accent, className = "" }: { src?: string | null; alt: string; accent?: string; className?: string }) {
  if (!src) {
    return (
      <span role={alt ? "img" : undefined} aria-label={alt ? `${alt} — slika nije dodata` : undefined} aria-hidden={alt ? undefined : true} className={`product-image-empty absolute inset-0 ${className}`} style={accent ? ({ "--empty-accent": accent } as CSSProperties) : undefined}>
        <span className="product-image-empty-card">
          <ImageOff aria-hidden strokeWidth={1.5} className="product-image-empty-icon" />
          <span className="product-image-empty-text">Nema slike</span>
        </span>
      </span>
    );
  }
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 72vw, 420px" className={`object-contain ${className}`} priority={alt === "Lubenito"} />;
}
