# Lokalni i Supabase setup

## 1. Preduslovi

- Node.js 22 ili noviji
- pnpm 11 ili noviji
- pristup Supabase projektu `President To Go` (`hqnpktinpubbcclohcgt`)

## 2. Instalacija

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Na macOS/Linux sistemima koristi `cp .env.example .env.local`.

## 3. Environment promenljive

| Promenljiva | Obavezna | Namena |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | da | URL projekta |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | da | publishable ili legacy anon ključ; bezbedan je za browser uz RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | ne | rezervisano za buduće pouzdane server jobove; trenutna aplikacija ga ne koristi |
| `NEXT_PUBLIC_APP_URL` | da | javni URL aplikacije |
| `ORDER_TOKEN_SECRET` | da | najmanje 32 nasumična bajta; koristi se za hash IP adrese |
| `NOTIFICATION_PROVIDER` | ne | `none` u prvoj fazi, kasnije `twilio` |
| `TWILIO_ACCOUNT_SID` | samo za SMS | Twilio nalog |
| `TWILIO_AUTH_TOKEN` | samo za SMS | server tajna, nikada `NEXT_PUBLIC_` |
| `TWILIO_PHONE_NUMBER` | samo za SMS | Twilio pošiljalac |

Ne commituј `.env.local`. Aplikacija ne koristi niti izlaže service-role ključ u browseru; kreiranje porudžbine prolazi kroz validirani RPC sa eksplicitnim grantom.

## 4. Baza, migracije i seed

Migracije koje su primenjene na projekat:

1. `20260716230045_initial_president_to_go.sql`
   - enum tipovi, sve domenske tabele i indeksi
   - RLS, Auth profile trigger, Storage bucket
   - termini, kapacitet, kreiranje porudžbine, javno čitanje po tokenu
   - status audit i Realtime Broadcast
2. `20260716230223_security_hardening.sql`
   - eksplicitne revokacije privatnih tabela
   - deny RLS za idempotency podatke
   - uklanjanje nepotrebnog Storage listing prava
   - serijalizovana provera kapaciteta i konkurentna idempotency zaštita
3. `20260716234022_advisor_remediation.sql`
   - eksplicitno ukidanje anon pristupa trigger/admin funkcijama
   - odvojene anon/auth RLS politike i uklanjanje duplih permissive pravila
   - pokrivajući indeksi za sve strane ključeve

Za novi projekat:

```bash
supabase link --project-ref hqnpktinpubbcclohcgt
supabase db push
supabase db reset --linked   # samo ako namerno resetuješ udaljeni razvojni projekat
```

Seed se primenjuje posle migracija:

```bash
supabase db query --linked -f supabase/seed.sql
```

Pre bilo kakvog udaljenog reseta napravi backup i potvrdi project ref.

## 5. Ručna podešavanja u Supabase Dashboardu

1. **Authentication → URL Configuration**
   - Site URL: vrednost `NEXT_PUBLIC_APP_URL`
   - Redirect URL: `https://tvoj-domen.rs/admin/**`
2. **Authentication → Providers → Email**
   - uključi email/password
   - po želji uključi Magic Link i prilagodi email template na srpskom
   - uključi leaked-password protection i najmanje jednu MFA opciju za admin naloge
3. **Realtime → Settings**
   - potvrdi da je Realtime uključen
   - isključi “Allow public access”; aplikacija koristi private Broadcast kanale sa RLS
4. **Storage**
   - potvrdi bucket `product-images`, public read URL, 5 MB limit i MIME listu
5. **API / Data API**
   - `public` schema treba da bude izložena; grantovi i RLS su u migraciji
6. **Project Settings → API Keys**
   - napravi moderan publishable ključ kad postane dostupan i zameni legacy anon vrednost
7. **Database → Advisors**
   - pregledaj Security i Performance advisore nakon svake izmene šeme

## 6. Kreiranje prvog owner admina

Prvo u Dashboardu otvori **Authentication → Users → Add user** i kreiraj potvrđenog korisnika. Zatim u SQL Editoru izvrši:

```sql
update public.profiles
set role = 'owner', full_name = 'Ime vlasnika'
where id = (select id from auth.users where email = 'owner@primer.rs');
```

Ne stavljaj admin ulogu u `user_metadata`. Autorizacija koristi baznu `profiles.role` vrednost i proverava se server-side/RLS.

## 7. SMS provider

`lib/notifications/service.ts` je provider apstrakcija. Aplikacija radi sa `NOTIFICATION_PROVIDER=none`. Za Twilio dodaj server adapter koji implementira `NotificationProvider`, čita Twilio tajne samo na serveru i ažurira `notifications` red nakon slanja.

## 8. E2E admin test

Admin Playwright test je automatski preskočen bez test naloga:

```bash
E2E_ADMIN_EMAIL=admin@primer.rs
E2E_ADMIN_PASSWORD=bezbedna-test-lozinka
pnpm test:e2e
```
