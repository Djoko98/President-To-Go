# Deployment, backup i rollback

## Produkcijski build

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm start
```

Za Vercel poveži Git repozitorijum, izaberi Node 22 i dodaj sve promenljive iz `.env.example`. `NEXT_PUBLIC_APP_URL` mora biti finalni HTTPS domen. Tajne postavi kao encrypted environment variables.

## Pre deploya

1. Primeni migracije na staging Supabase projekat.
2. Pokreni `pnpm check` i `pnpm test:e2e`.
3. Pokreni Supabase Security i Performance advisore.
4. Proveri checkout na Android Chrome i iPhone Safari dimenzijama.
5. Kreiraj owner nalog i proveri statusni tok od `pending` do `completed`.
6. Potvrdi Auth redirect URL, Storage i Realtime private-channel podešavanje.

Security Advisor će i dalje prijaviti namerne javne RPC funkcije (`create_order`, `get_public_order`, `get_available_slots`) i javno čitljive kataloške tabele kao “discoverable”. To je očekivano: funkcije validiraju i filtriraju podatke, a sve tabele imaju RLS. Svako drugo novo upozorenje treba istražiti pre deploya.

## Backup

Pre migracije koja menja podatke:

```bash
supabase db dump --linked -f backups/pre-migration.sql
supabase db dump --linked --data-only -f backups/pre-migration-data.sql
```

Backup fajlovi mogu sadržati lične podatke i ne smeju se commitovati. U produkciji uključi Supabase Point-in-Time Recovery kada plan projekta to podržava.

## Rollback

- Kod: vrati prethodni potvrđeni deployment/commit.
- Šema: napiši novu forward-only migraciju koja vraća kompatibilno stanje. Ne briši red iz migration history ručno.
- Podaci: vrati provereni dump ili PITR snapshot u odvojeni projekat, validiraj ga, pa tek onda planiraj produkcijski restore.
- Ako nova verzija checkouta pravi greške, prvo pauziraj poručivanje kroz admin prekidač; katalog ostaje vidljiv.

## Operativna provera

- pratiti Auth, Postgres, API i Realtime logove
- pratiti `notifications.status = 'failed'`
- redovno uklanjati stare `order_requests` redove (npr. zakazani SQL job posle 24 h)
- periodično testirati restore, ne samo pravljenje backupa
- rotirati tajne i publishable ključeve prema politici restorana
