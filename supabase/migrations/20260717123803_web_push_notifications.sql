-- Web push obaveštenja za administraciju. Izvučeno iz Supabase projekta, gde je primenjeno
-- 17.07.2026. mimo repoa; sadržaj je veran originalu osim webhook secreta (vidi napomenu ispod).

create extension if not exists pg_net;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_admin_manage on public.push_subscriptions;
create policy push_subscriptions_admin_manage on public.push_subscriptions
  for all to authenticated
  using (public.is_admin() and user_id = (select auth.uid()))
  with check (public.is_admin() and user_id = (select auth.uid()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;

create trigger push_subscriptions_updated before update on public.push_subscriptions for each row execute function public.set_updated_at();

-- Store the edge-function URL and shared webhook secret in Vault (the trigger reads these).
-- NAPOMENA: pravi secret namerno nije u repou. Na postojećoj bazi ovaj blok ništa ne radi jer
-- secret već postoji u Vaultu. Na novoj bazi zameni placeholder pravom vrednošću pre pokretanja,
-- ili ga posle podesi kroz Supabase → Project Settings → Vault; ista vrednost mora stajati kao
-- NOTIFY_ADMINS_WEBHOOK_SECRET u okruženju edge funkcije notify-admins.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'notify_admins_url') then
    perform vault.create_secret('https://hqnpktinpubbcclohcgt.supabase.co/functions/v1/notify-admins', 'notify_admins_url', 'Edge function URL for new-order push notifications');
  end if;
  if not exists (select 1 from vault.secrets where name = 'notify_admins_webhook_secret') then
    perform vault.create_secret('ZAMENI_PRAVIM_SECRETOM', 'notify_admins_webhook_secret', 'Shared secret validating calls from DB trigger to notify-admins');
  end if;
end $$;

create or replace function public.notify_admins_new_order()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  fn_url text;
  secret text;
begin
  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'notify_admins_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'notify_admins_webhook_secret';
  if fn_url is null then return new; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(secret, '')),
    body := jsonb_build_object('order_number', new.order_number, 'customer_name', new.customer_name, 'total', new.total)
  );
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists orders_notify_admins on public.orders;
create trigger orders_notify_admins after insert on public.orders for each row execute function public.notify_admins_new_order();
