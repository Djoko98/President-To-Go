# President To Go

Produkcijska, mobile-first Next.js aplikacija za poručivanje koktela, kafa i voćnih napitaka za preuzimanje u restoranu President. Gost poručuje bez naloga i plaća prilikom preuzimanja; administrator obrađuje porudžbine u realnom vremenu.

## Šta je implementirano

- javni katalog iz Supabase baze sa lučnim kategorijama i prikazom jednog proizvoda
- swipe/drag, tastatura, pagination tačke i reduced-motion podrška
- perzistentna localStorage korpa bez hydration grešaka
- checkout sa srpskim telefonom, terminima, kapacitetom i potvrdom punoletstva
- server-side cena, dostupnost, radno vreme, rate limit i idempotency
- bezbedan javni token i Supabase Realtime Broadcast status
- Admin Auth i server-side role provera (`owner`, `manager`, `staff`)
- realtime administracija porudžbina i audit prelaza statusa
- proizvodi, dostupnost, upload slika, kategorije, blokade termina i podešavanja
- PWA manifest, service worker, safe-area, offline poruka i responsive admin
- RLS za sve javno izložene tabele i Storage bucket pravila
- Vitest unit testovi i Playwright kritični tokovi

## Brzi početak

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Otvori [http://localhost:3000](http://localhost:3000). Detaljan setup je u [SETUP.md](./SETUP.md), a produkcija u [DEPLOYMENT.md](./DEPLOYMENT.md).

## Komande

```bash
pnpm dev          # razvojni server
pnpm lint         # ESLint
pnpm typecheck    # TypeScript strict
pnpm test         # Vitest
pnpm test:e2e     # Playwright
pnpm check        # lint + typecheck + unit testovi
pnpm build        # produkcijski build
pnpm start        # pokretanje builda
```

Node.js 22+ je obavezan. Projekat koristi `pnpm` i zaključane verzije iz `pnpm-lock.yaml`.

## Arhitektura

- `app/` — App Router stranice, layouti i sigurni route handleri
- `components/public/` — javni katalog, korpa, checkout i status
- `components/admin/` — admin shell, realtime red i upravljanje katalogom
- `features/` — cart state i server admin akcije
- `lib/` — Supabase klijenti, validacija, datumi, novac, bezbednost
- `supabase/migrations/` — kompletna šema/RLS i security hardening
- `supabase/seed.sql` — početne kategorije, proizvodi, termini i podešavanja
- `tests/` — unit i E2E testovi

## Napomena o slikama

Lubenito 3D asset je generisan za ovaj projekat i nalazi se u `public/images/products/lubenito.png`. `ProductImage` centralizuje fallback; admin upload šalje PNG, WebP ili JPEG (maksimalno 5 MB) u javni `product-images` bucket.
