# Web Push obaveštenja — podešavanje

Push obaveštenja o novim porudžbinama (rade i kada je aplikacija zatvorena) su implementirana. Da bi proradila, potrebno je jednom postaviti tajne — ove vrednosti se **ne čuvaju u repozitorijumu**.

## Šta je već urađeno (u kodu i na Supabase-u)

- Tabela `push_subscriptions` (+ RLS) — čuva pretplate admin uređaja.
- `pg_net` ekstenzija + trigger `orders_notify_admins` na `orders` — pri svakoj novoj porudžbini poziva edge funkciju.
- Edge funkcija `notify-admins` — šalje Web Push svim prijavljenim uređajima (VAPID).
- Service worker (`public/sw.js`) — `push` i `notificationclick` handleri.
- Dugme „Uključi obaveštenja" u Porudžbinama — pretplaćuje uređaj.
- URL funkcije i webhook secret su smešteni u Supabase **Vault** (koristi ih trigger).

## Šta ti treba da uradiš (jednom)

### 1) Postavi tajne za edge funkciju `notify-admins`

Preko Supabase CLI:

```
supabase secrets set \
  VAPID_PUBLIC_KEY=<javni_kljuc> \
  VAPID_PRIVATE_KEY=<privatni_kljuc> \
  VAPID_SUBJECT=mailto:tvoj-email@primer.rs \
  WEBHOOK_SECRET=<webhook_secret> \
  --project-ref hqnpktinpubbcclohcgt
```

Ili preko Dashboard-a: **Edge Functions → notify-admins → Secrets**.

> Konkretne vrednosti (VAPID ključevi i WEBHOOK_SECRET) su ti poslate u chat poruci. `WEBHOOK_SECRET` **mora** biti identičan onome u Vault-u (isti koji je poslat).

### 2) Dodaj javni VAPID ključ u produkcioni env web aplikacije

Kod hostinga (npr. Vercel → Environment Variables) dodaj:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<javni_kljuc>
```

(Za lokalni razvoj je već dodat u `.env.local`.) Zatim redeploy.

### 3) Uključi obaveštenja na telefonu

- Otvori app na telefonu i **dodaj na početni ekran** (instaliraj PWA). Na iOS-u (16.4+) push radi **samo** za instaliran PWA.
- Otvori Administracija → Porudžbine → **Uključi obaveštenja** i dozvoli obaveštenja.
- Gotovo — kada stigne nova porudžbina, dobićeš push i kada je app zatvoren.

## Napomena

Rotiranje ključeva: generiši nove VAPID ključeve, ažuriraj tajne funkcije i `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, pa neka se svi uređaji ponovo pretplate.
