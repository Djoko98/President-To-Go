# Web Push obaveštenja + domen — status i preostali koraci

Push obaveštenja o novim porudžbinama (rade i kada je aplikacija zatvorena).

## ✅ Već urađeno (kod + Supabase + CLI)

- Tabela `push_subscriptions` (+ RLS), `pg_net` ekstenzija i trigger `orders_notify_admins` na `orders`.
- Edge funkcija `notify-admins` (deployovana) — šalje Web Push preko VAPID-a.
- Service worker (`public/sw.js`) — `push` i `notificationclick` handleri.
- Dugme „Uključi obaveštenja" u Porudžbinama (pretplata uređaja).
- **Tajne funkcije postavljene preko CLI-ja:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `WEBHOOK_SECRET`.
- URL funkcije i webhook secret u Supabase **Vault**-u (koristi ih trigger).
- **Verifikovano:** DB trigger → funkcija vraća `200 {"sent":0,"total":0}` (0 jer još nema pretplaćenih uređaja).

## ⏳ Ostaje da ti uradiš

### 1) Produkcioni env varijable (na hostingu, npr. Vercel)

Dodaj / proveri da su postavljene za `restoranpresident.com`, pa **redeploy**:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BITihcodB-CmXZHgJksNAPQ0_8MVfD1z3JFlBEdjMrI6WJY7_dvxOc9xSwtLYheowjHHA0ATOxGjesO7W2x_vEc
NEXT_PUBLIC_APP_URL=https://restoranpresident.com
```

(Ostale — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ORDER_TOKEN_SECRET` — trebalo bi već da postoje ako je app online.)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` je **javni** ključ — bezbedno je da bude u browseru.

### 2) Domen u Supabase (samo za „magic link" prijavu)

Prijava lozinkom radi na svakom domenu bez ikakvih izmena. Ako koristiš i **„Pošalji magic link"**, dodaj domen u dozvoljene URL-ove:

Dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://restoranpresident.com`
- **Redirect URLs:** dodaj `https://restoranpresident.com/**`

(Ovo se ne može bezbedno preko CLI-ja bez rizika da resetuje ostala auth podešavanja, pa je najbolje kroz Dashboard.)

Ništa drugo u Supabase-u ne zavisi od domena (Data API, Realtime, Storage, Edge funkcije rade sa svih domena).

### 3) Instaliraj PWA i uključi obaveštenja (na telefonu)

- Otvori `https://restoranpresident.com` na telefonu i **dodaj na početni ekran** (iOS: Safari → Podeli → „Add to Home Screen"). Na iOS-u push radi **samo** za instaliran PWA.
- Otvori app sa početnog ekrana → Administracija → Porudžbine → **Uključi obaveštenja** i dozvoli.
- Gotovo — nove porudžbine stižu kao push i kada je app zatvoren.

## Rotiranje ključeva (ako ikad zatreba)

Generiši nove VAPID ključeve → `npx supabase secrets set ... --project-ref hqnpktinpubbcclohcgt` → ažuriraj `NEXT_PUBLIC_VAPID_PUBLIC_KEY` na hostingu → svi uređaji se ponovo pretplate.
