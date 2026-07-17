"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Archive, CalendarClock, ClipboardList, FolderKanban, Gauge, History, LogOut, Package, Settings } from "lucide-react";
import { signOut } from "@/features/admin/actions";

const links = [
  ["/admin", "Pregled", Gauge], ["/admin/porudzbine", "Porudžbine", ClipboardList], ["/admin/proizvodi", "Proizvodi", Package], ["/admin/kategorije", "Kategorije", FolderKanban], ["/admin/termini", "Termini", CalendarClock], ["/admin/podesavanja", "Podešavanja", Settings], ["/admin/istorija", "Istorija", History],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); if (pathname === "/admin/prijava") return children;
  return <div className="admin-grid bg-[#f4f4f2]"><aside className="border-r border-neutral-200 bg-white p-5 max-[820px]:border-b max-[820px]:border-r-0"><div className="flex items-center justify-between"><Link href="/admin" className="text-xl font-extrabold tracking-[-.04em]">President To Go</Link><form action={signOut}><button aria-label="Odjavi se" className="touch-target grid place-items-center rounded-full hover:bg-neutral-100"><LogOut size={19} /></button></form></div><p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-neutral-400">Administracija</p><nav className="mt-8 grid gap-1 max-[820px]:mt-5 max-[820px]:flex max-[820px]:overflow-x-auto max-[820px]:pb-1">{links.map(([href,label,Icon]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-4 font-bold transition ${active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}><Icon size={19} />{label}</Link>; })}</nav></aside><div className="min-w-0"><header className="flex min-h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 sm:px-8"><span className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" />Sistem je povezan</span><Archive size={19} className="text-neutral-400" /></header>{children}</div></div>;
}
