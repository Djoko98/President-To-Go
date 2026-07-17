-- Advisor-driven hardening after the initial schema verification.
drop policy if exists product_images_public_read on storage.objects;

revoke all on public.profiles from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.order_status_events from anon;
revoke all on public.notifications from anon;
revoke all on public.order_requests from anon, authenticated;

create policy order_requests_deny_direct_access
on public.order_requests for all to anon, authenticated
using (false) with check (false);

drop type if exists public.user_role;

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
  inserted_request integer := 0;
begin
  select response into existing from public.order_requests where idempotency_key = p_idempotency_key;
  if existing is not null then return existing; end if;
  if p_ip_hash is null or char_length(p_ip_hash) < 16 then raise exception 'Nevažeći zahtev'; end if;
  if (select count(*) from public.order_requests where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Previše pokušaja. Pokušaj ponovo za nekoliko minuta.';
  end if;
  insert into public.order_requests(idempotency_key, ip_hash) values (p_idempotency_key, p_ip_hash)
  on conflict do nothing;
  get diagnostics inserted_request = row_count;
  if inserted_request = 0 then
    select response into existing from public.order_requests where idempotency_key = p_idempotency_key;
    if existing is not null then return existing; end if;
    raise exception 'Porudžbina se već obrađuje';
  end if;
  -- Serializes capacity checks and prevents oversubscribing a pickup slot.
  perform id from public.app_settings limit 1 for update;
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

