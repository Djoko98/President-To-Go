-- Expose rejection reason to the public order tracker so customers see why an order was rejected.
create or replace function public.get_public_order(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'phone_last_four', right(o.customer_phone, 4),
    'requested_pickup_at', o.requested_pickup_at,
    'confirmed_pickup_at', o.confirmed_pickup_at,
    'status', o.status,
    'rejection_reason', o.rejection_reason,
    'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.product_name_snapshot, 'quantity', i.quantity, 'unit_price', i.unit_price_snapshot, 'line_total', i.line_total) order by i.created_at) from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', e.new_status, 'created_at', e.created_at) order by e.created_at) from public.order_status_events e where e.order_id = o.id), '[]'::jsonb)
  ) from public.orders o where o.public_token = p_token;
$$;
revoke all on function public.get_public_order(uuid) from public;
grant execute on function public.get_public_order(uuid) to anon, authenticated;
