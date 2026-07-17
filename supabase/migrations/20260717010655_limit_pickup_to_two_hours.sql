alter table public.app_settings
  add column max_advance_minutes integer not null default 120
  check (max_advance_minutes between 15 and 120);

update public.app_settings
set max_advance_minutes = least(120, greatest(15, max_advance_days * 24 * 60));

alter table public.app_settings drop column max_advance_days;

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
  if p_pickup > now() + make_interval(mins => s.max_advance_minutes) then return false; end if;
  local_pickup := p_pickup at time zone s.timezone;
  select * into h from public.business_hours where day_of_week = extract(dow from local_pickup)::smallint;
  if not found or h.is_closed or local_pickup::time < h.opens_at or local_pickup::time >= h.closes_at then return false; end if;
  if h.break_starts_at is not null and local_pickup::time >= h.break_starts_at and local_pickup::time < h.break_ends_at then return false; end if;
  if exists (select 1 from public.blocked_slots where p_pickup >= starts_at and p_pickup < ends_at) then return false; end if;
  select count(*) into active_count from public.orders
   where requested_pickup_at = p_pickup and status not in ('rejected','cancelled','expired');
  return active_count < s.max_orders_per_slot;
end $$;

revoke execute on function public.slot_is_available(timestamptz) from public, anon, authenticated;
