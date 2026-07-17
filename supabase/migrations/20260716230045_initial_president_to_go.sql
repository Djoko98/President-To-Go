-- President To Go — production schema for project hqnpktinpubbcclohcgt
create extension if not exists pgcrypto;

do $$ begin
  create type public.admin_role as enum ('owner', 'manager', 'staff');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.notification_channel as enum ('in_app', 'browser', 'sms');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.notification_status as enum ('queued', 'sent', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

-- The only pre-existing application table was empty and used incompatible roles.
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.admin_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  image_url text,
  position integer not null default 0 check (position >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  ingredients text not null default '',
  price integer not null check (price >= 0),
  image_url text,
  accent_color text not null default '#f4f4f2' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  contains_alcohol boolean not null default false,
  preparation_minutes integer not null default 15 check (preparation_minutes between 1 and 180),
  max_quantity_per_order integer not null default 10 check (max_quantity_per_order between 1 and 50),
  position integer not null default 0 check (position >= 0),
  is_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  ordering_enabled boolean not null default true,
  default_preparation_minutes integer not null default 20 check (default_preparation_minutes between 1 and 180),
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes in (5, 10, 15, 20, 30, 60)),
  max_orders_per_slot integer not null default 8 check (max_orders_per_slot between 1 and 100),
  max_advance_days integer not null default 7 check (max_advance_days between 0 and 60),
  restaurant_phone text not null default '+381000000000',
  restaurant_address text not null default 'President, Srbija',
  timezone text not null default 'Europe/Belgrade' check (timezone = 'Europe/Belgrade'),
  updated_at timestamptz not null default now()
);

create unique index app_settings_singleton on public.app_settings ((true));

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null unique check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  break_starts_at time,
  break_ends_at time,
  is_closed boolean not null default false,
  check (is_closed or (opens_at is not null and closes_at is not null and opens_at < closes_at)),
  check ((break_starts_at is null and break_ends_at is null) or (break_starts_at < break_ends_at))
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid() unique,
  order_number text not null unique,
  customer_name text not null check (char_length(customer_name) between 3 and 120),
  customer_phone text not null check (customer_phone ~ '^\+381[0-9]{8,9}$'),
  customer_note text check (customer_note is null or char_length(customer_note) <= 800),
  requested_pickup_at timestamptz not null,
  confirmed_pickup_at timestamptz,
  status public.order_status not null default 'pending',
  subtotal integer not null check (subtotal >= 0),
  total integer not null check (total >= 0),
  contains_alcohol boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  check (total = subtotal)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  unit_price_snapshot integer not null check (unit_price_snapshot >= 0),
  quantity integer not null check (quantity between 1 and 50),
  line_total integer not null check (line_total = unit_price_snapshot * quantity),
  created_at timestamptz not null default now()
);

create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  channel public.notification_channel not null,
  event_type text not null,
  recipient text not null,
  status public.notification_status not null default 'queued',
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table public.order_requests (
  idempotency_key uuid primary key,
  ip_hash text not null,
  order_id uuid references public.orders(id) on delete set null,
  response jsonb,
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;

create index products_category_position_idx on public.products(category_id, position) where is_active;
create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_pickup_idx on public.orders(requested_pickup_at) where status in ('pending', 'accepted', 'preparing', 'ready');
create index orders_phone_idx on public.orders(customer_phone);
create index order_items_order_idx on public.order_items(order_id);
create index status_events_order_idx on public.order_status_events(order_id, created_at);
create index blocked_slots_range_idx on public.blocked_slots(starts_at, ends_at);
create index notifications_queue_idx on public.notifications(status, created_at) where status = 'queued';
create index order_requests_rate_idx on public.order_requests(ip_hash, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.app_settings for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'staff')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin(required_roles public.admin_role[] default array['owner','manager','staff']::public.admin_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = any(required_roles)
  );
$$;
revoke all on function public.is_admin(public.admin_role[]) from public;
grant execute on function public.is_admin(public.admin_role[]) to authenticated;

create or replace function public.assign_order_number()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'PTG-' || nextval('public.order_number_seq')::text;
  end if;
  return new;
end $$;
create trigger assign_order_number before insert on public.orders for each row execute function public.assign_order_number();

create or replace function public.log_order_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_status_events(order_id, previous_status, new_status, changed_by)
    values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger order_status_audit after insert or update of status on public.orders for each row execute function public.log_order_status();

create or replace function public.slot_is_available(p_pickup timestamptz)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  s public.app_settings%rowtype;
  h public.business_hours%rowtype;
  local_pickup timestamp;
  active_count integer;
begin
  select * into s from public.app_settings limit 1;
  if not found or not s.ordering_enabled then return false; end if;
  if p_pickup < now() + make_interval(mins => s.default_preparation_minutes) then return false; end if;
  if p_pickup > now() + make_interval(days => s.max_advance_days) then return false; end if;
  local_pickup := p_pickup at time zone s.timezone;
  select * into h from public.business_hours where day_of_week = extract(dow from local_pickup)::smallint;
  if not found or h.is_closed or local_pickup::time < h.opens_at or local_pickup::time >= h.closes_at then return false; end if;
  if h.break_starts_at is not null and local_pickup::time >= h.break_starts_at and local_pickup::time < h.break_ends_at then return false; end if;
  if exists (select 1 from public.blocked_slots where p_pickup >= starts_at and p_pickup < ends_at) then return false; end if;
  select count(*) into active_count from public.orders
   where requested_pickup_at = p_pickup and status not in ('rejected','cancelled','expired');
  return active_count < s.max_orders_per_slot;
end $$;
revoke all on function public.slot_is_available(timestamptz) from public;
grant execute on function public.slot_is_available(timestamptz) to anon, authenticated;

create or replace function public.get_available_slots(p_day date)
returns table (starts_at timestamptz, is_available boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.app_settings%rowtype;
  h public.business_hours%rowtype;
  local_slot timestamp;
  local_end timestamp;
begin
  select * into s from public.app_settings limit 1;
  select * into h from public.business_hours where day_of_week = extract(dow from p_day)::smallint;
  if not found or h.is_closed then return; end if;
  local_slot := p_day::timestamp + h.opens_at;
  local_end := p_day::timestamp + h.closes_at;
  while local_slot < local_end loop
    starts_at := local_slot at time zone s.timezone;
    is_available := public.slot_is_available(starts_at);
    return next;
    local_slot := local_slot + make_interval(mins => s.slot_interval_minutes);
  end loop;
end $$;
revoke all on function public.get_available_slots(date) from public;
grant execute on function public.get_available_slots(date) to anon, authenticated;

create or replace function public.create_order(p_payload jsonb, p_idempotency_key uuid, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  existing jsonb;
  requested timestamptz;
  item jsonb;
  product_row public.products%rowtype;
  new_order public.orders%rowtype;
  subtotal_value integer := 0;
  alcohol_value boolean := false;
  items_count integer := 0;
begin
  select response into existing from public.order_requests where idempotency_key = p_idempotency_key;
  if existing is not null then return existing; end if;
  if p_ip_hash is null or char_length(p_ip_hash) < 16 then raise exception 'Nevažeći zahtev'; end if;
  if (select count(*) from public.order_requests where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Previše pokušaja. Pokušaj ponovo za nekoliko minuta.';
  end if;
  insert into public.order_requests(idempotency_key, ip_hash) values (p_idempotency_key, p_ip_hash);
  if jsonb_array_length(coalesce(p_payload->'items', '[]'::jsonb)) < 1 then raise exception 'Korpa je prazna'; end if;
  if char_length(trim(p_payload->>'customer_name')) not between 3 and 120 then raise exception 'Unesi ispravno ime i prezime'; end if;
  if coalesce(p_payload->>'customer_phone','') !~ '^\+381[0-9]{8,9}$' then raise exception 'Broj telefona nije ispravan'; end if;
  requested := (p_payload->>'requested_pickup_at')::timestamptz;
  if not public.slot_is_available(requested) then raise exception 'Izabrani termin više nije dostupan'; end if;
  for item in select value from jsonb_array_elements(p_payload->'items') loop
    items_count := items_count + 1;
    if items_count > 50 then raise exception 'Previše stavki u porudžbini'; end if;
    select * into product_row from public.products
      where id = (item->>'product_id')::uuid and is_active and is_available for share;
    if not found then raise exception 'Jedan od proizvoda više nije dostupan'; end if;
    if (item->>'quantity')::integer not between 1 and product_row.max_quantity_per_order then
      raise exception 'Količina za % nije dozvoljena', product_row.name;
    end if;
    subtotal_value := subtotal_value + product_row.price * (item->>'quantity')::integer;
    alcohol_value := alcohol_value or product_row.contains_alcohol;
  end loop;
  if alcohol_value and coalesce((p_payload->>'adult_confirmed')::boolean, false) is not true then
    raise exception 'Potrebna je potvrda punoletstva';
  end if;
  insert into public.orders(order_number, customer_name, customer_phone, customer_note, requested_pickup_at, subtotal, total, contains_alcohol)
  values ('', trim(p_payload->>'customer_name'), p_payload->>'customer_phone', nullif(trim(p_payload->>'customer_note'),''), requested, subtotal_value, subtotal_value, alcohol_value)
  returning * into new_order;
  for item in select value from jsonb_array_elements(p_payload->'items') loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid;
    insert into public.order_items(order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total)
    values (new_order.id, product_row.id, product_row.name, product_row.price, (item->>'quantity')::integer, product_row.price * (item->>'quantity')::integer);
  end loop;
  existing := jsonb_build_object('public_token', new_order.public_token, 'order_number', new_order.order_number, 'status', new_order.status);
  update public.order_requests set order_id = new_order.id, response = existing where idempotency_key = p_idempotency_key;
  return existing;
exception when others then
  delete from public.order_requests where idempotency_key = p_idempotency_key and response is null;
  raise;
end $$;
revoke all on function public.create_order(jsonb, uuid, text) from public;
grant execute on function public.create_order(jsonb, uuid, text) to anon, authenticated;

create or replace function public.get_public_order(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'phone_last_four', right(o.customer_phone, 4),
    'requested_pickup_at', o.requested_pickup_at,
    'confirmed_pickup_at', o.confirmed_pickup_at,
    'status', o.status,
    'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.product_name_snapshot, 'quantity', i.quantity, 'unit_price', i.unit_price_snapshot, 'line_total', i.line_total) order by i.created_at) from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.new_status, 'created_at', e.created_at) order by e.created_at) from public.order_status_events e where e.order_id = o.id), '[]'::jsonb)
  ) from public.orders o where o.public_token = p_token;
$$;
revoke all on function public.get_public_order(uuid) from public;
grant execute on function public.get_public_order(uuid) to anon, authenticated;

create or replace function public.change_order_status(p_order_id uuid, p_status public.order_status, p_confirmed_pickup_at timestamptz default null, p_note text default null)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare current_order public.orders%rowtype;
begin
  if not public.is_admin() then raise exception 'Nemaš dozvolu'; end if;
  select * into current_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Porudžbina ne postoji'; end if;
  if not (
    (current_order.status = 'pending' and p_status in ('accepted','rejected','cancelled')) or
    (current_order.status = 'accepted' and p_status in ('preparing','rejected','cancelled')) or
    (current_order.status = 'preparing' and p_status in ('ready','cancelled')) or
    (current_order.status = 'ready' and p_status in ('completed','cancelled'))
  ) then raise exception 'Nedozvoljen prelaz statusa'; end if;
  if p_status = 'accepted' and p_confirmed_pickup_at is null then raise exception 'Potvrđeno vreme je obavezno'; end if;
  if p_status = 'rejected' and coalesce(trim(p_note),'') = '' then raise exception 'Razlog odbijanja je obavezan'; end if;
  update public.orders set
    status = p_status,
    confirmed_pickup_at = case when p_status = 'accepted' then p_confirmed_pickup_at else confirmed_pickup_at end,
    rejection_reason = case when p_status = 'rejected' then p_note else rejection_reason end,
    accepted_at = case when p_status = 'accepted' then now() else accepted_at end,
    ready_at = case when p_status = 'ready' then now() else ready_at end,
    completed_at = case when p_status = 'completed' then now() else completed_at end
  where id = p_order_id returning * into current_order;
  update public.order_status_events set note = p_note where id = (select id from public.order_status_events where order_id = p_order_id order by created_at desc limit 1);
  return current_order;
end $$;
revoke all on function public.change_order_status(uuid, public.order_status, timestamptz, text) from public;
grant execute on function public.change_order_status(uuid, public.order_status, timestamptz, text) to authenticated;

create or replace function public.broadcast_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status or old.confirmed_pickup_at is distinct from new.confirmed_pickup_at then
    perform realtime.send(
      jsonb_build_object('status', new.status, 'confirmed_pickup_at', new.confirmed_pickup_at, 'updated_at', new.updated_at),
      'status_changed',
      'order:' || new.public_token::text || ':status',
      true
    );
  end if;
  return new;
end $$;
create trigger order_status_broadcast after update on public.orders for each row execute function public.broadcast_order_status();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.app_settings enable row level security;
alter table public.order_status_events enable row level security;
alter table public.notifications enable row level security;
alter table public.order_requests enable row level security;

create policy profiles_self_select on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin(array['owner']::public.admin_role[]));
create policy profiles_owner_manage on public.profiles for all to authenticated using (public.is_admin(array['owner']::public.admin_role[])) with check (public.is_admin(array['owner']::public.admin_role[]));
create policy public_categories_read on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy admin_categories_manage on public.categories for all to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy public_products_read on public.products for select to anon, authenticated using (is_active or public.is_admin());
create policy admin_products_manage on public.products for all to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy admin_orders_read on public.orders for select to authenticated using (public.is_admin());
create policy admin_orders_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_items_read on public.order_items for select to authenticated using (public.is_admin());
create policy hours_public_read on public.business_hours for select to anon, authenticated using (true);
create policy hours_admin_manage on public.business_hours for all to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy blocked_public_read on public.blocked_slots for select to anon, authenticated using (true);
create policy blocked_admin_manage on public.blocked_slots for all to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy settings_public_read on public.app_settings for select to anon, authenticated using (true);
create policy settings_admin_manage on public.app_settings for all to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy status_events_admin_read on public.order_status_events for select to authenticated using (public.is_admin());
create policy notifications_admin_read on public.notifications for select to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.business_hours, public.blocked_slots, public.app_settings to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.categories, public.products, public.orders, public.order_items, public.business_hours, public.blocked_slots, public.app_settings, public.order_status_events, public.notifications to authenticated;
revoke all on public.order_requests from anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/png','image/webp','image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy product_images_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin(array['owner','manager']::public.admin_role[]));
create policy product_images_admin_update on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin(array['owner','manager']::public.admin_role[])) with check (bucket_id = 'product-images' and public.is_admin(array['owner','manager']::public.admin_role[]));
create policy product_images_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin(array['owner','manager']::public.admin_role[]));

create policy order_topic_receive on realtime.messages for select to anon, authenticated using (
  realtime.messages.extension = 'broadcast' and (
    (select realtime.topic()) ~ '^order:[0-9a-f-]{36}:status$' or
    ((select realtime.topic()) = 'admin:orders' and public.is_admin())
  )
);

alter publication supabase_realtime add table public.orders;
