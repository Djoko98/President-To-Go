"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Archive, CalendarClock, ClipboardList, FolderKanban, Gauge, History, LogOut, Menu, Package, Settings, X } from "lucide-react";
import { signOut } from "@/features/admin/actions";

const links = [
  ["/admin", "Pregled", Gauge],
  ["/admin/porudzbine", "Porudžbine", ClipboardList],
  ["/admin/proizvodi", "Proizvodi", Package],
  ["/admin/kategorije", "Kategorije", FolderKanban],
  ["/admin/termini", "Termini", CalendarClock],
  ["/admin/podesavanja", "Podešavanja", Settings],
  ["/admin/istorija", "Istorija", History],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/admin/prijava") return children;

  return (
    <div className="admin-grid bg-[#f4f4f2]">
      <aside className="admin-sidebar relative z-50 border-r border-neutral-200 bg-white p-5 max-[820px]:sticky max-[820px]:top-0 max-[820px]:border-b max-[820px]:border-r-0 max-[820px]:px-4 max-[820px]:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><Link href="/admin" onClick={() => setMenuOpen(false)} className="block truncate text-xl font-extrabold tracking-[-.04em]">President To Go</Link><p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-neutral-400 max-[820px]:hidden">Administracija</p></div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 hidden items-center gap-2 text-xs font-semibold text-emerald-700 max-[820px]:flex"><span className="size-2 rounded-full bg-emerald-500" />Online</span>
            <form action={signOut}><button aria-label="Odjavi se" className="touch-target grid place-items-center rounded-full hover:bg-neutral-100"><LogOut size={19} /></button></form>
            <button type="button" aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"} aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen((open) => !open)} className="touch-target hidden place-items-center rounded-full bg-neutral-900 text-white max-[820px]:grid">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {menuOpen ? <button type="button" aria-label="Zatvori meni" onClick={() => setMenuOpen(false)} className="fixed inset-0 top-[69px] z-40 hidden bg-black/30 backdrop-blur-[2px] max-[820px]:block" /> : null}
        <nav id="admin-navigation" className={`mt-8 grid gap-1 max-[820px]:fixed max-[820px]:inset-x-3 max-[820px]:top-[72px] max-[820px]:z-50 max-[820px]:mt-0 max-[820px]:max-h-[calc(100dvh-84px)] max-[820px]:grid-cols-2 max-[820px]:overflow-y-auto max-[820px]:rounded-3xl max-[820px]:bg-white max-[820px]:p-3 max-[820px]:shadow-2xl ${menuOpen ? "max-[820px]:grid" : "max-[820px]:hidden"}`}>
          {links.map(([href, label, Icon]) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 font-bold transition max-[380px]:px-3 ${active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}><Icon size={19} className="shrink-0" /><span className="truncate">{label}</span></Link>;
          })}
        </nav>
      </aside>
      <div className="admin-content min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 sm:px-8 max-[820px]:hidden"><span className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" />Sistem je povezan</span><Archive size={19} className="text-neutral-400" /></header>
        {children}
      </div>
    </div>
  );
}
