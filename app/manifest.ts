import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "President To Go",
    short_name: "President",
    description: "Napitak te čeka u restoranu President.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f3",
    theme_color: "#f5f5f3",
    orientation: "portrait-primary",
    lang: "sr-Latn",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
    shortcuts: [
      { name: "Poruči", short_name: "Poruči", url: "/" },
      { name: "Administracija", short_name: "Admin", url: "/admin/porudzbine" },
    ],
  };
}
