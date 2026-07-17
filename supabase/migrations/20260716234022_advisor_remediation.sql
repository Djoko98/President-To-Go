-- Explicit function privileges: Supabase platform default grants target anon/authenticated directly.
revoke execute on function public.broadcast_order_status() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.assign_order_number() from public, anon, authenticated;
revoke execute on function public.log_order_status() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.slot_is_available(timestamptz) from public, anon, authenticated;
revoke execute on function public.change_order_status(uuid, public.order_status, timestamptz, text) from public, anon;
revoke execute on function public.is_admin(public.admin_role[]) from public, anon;
grant execute on function public.change_order_status(uuid, public.order_status, timestamptz, text) to authenticated;
grant execute on function public.is_admin(public.admin_role[]) to authenticated;

-- Separate public and authenticated catalog policies so anon never evaluates is_admin().
drop policy if exists public_categories_read on public.categories;
create policy categories_anon_read on public.categories for select to anon using (is_active);
create policy categories_authenticated_read on public.categories for select to authenticated using (is_active or public.is_admin());

drop policy if exists public_products_read on public.products;
create policy products_anon_read on public.products for select to anon using (is_active);
create policy products_authenticated_read on public.products for select to authenticated using (is_active or public.is_admin());

drop policy if exists order_topic_receive on realtime.messages;
create policy order_topic_anon_receive on realtime.messages for select to anon using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) ~ '^order:[0-9a-f-]{36}:status$'
);
create policy order_topic_authenticated_receive on realtime.messages for select to authenticated using (
  realtime.messages.extension = 'broadcast' and (
    (select realtime.topic()) ~ '^order:[0-9a-f-]{36}:status$'
    or ((select realtime.topic()) = 'admin:orders' and public.is_admin())
  )
);

-- Avoid duplicate permissive SELECT policies while retaining admin write access.
drop policy if exists admin_categories_manage on public.categories;
create policy admin_categories_insert on public.categories for insert to authenticated with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy admin_categories_update on public.categories for update to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy admin_categories_delete on public.categories for delete to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));

drop policy if exists admin_products_manage on public.products;
create policy admin_products_insert on public.products for insert to authenticated with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy admin_products_update on public.products for update to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy admin_products_delete on public.products for delete to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));

drop policy if exists hours_admin_manage on public.business_hours;
create policy hours_admin_insert on public.business_hours for insert to authenticated with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy hours_admin_update on public.business_hours for update to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy hours_admin_delete on public.business_hours for delete to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));

drop policy if exists blocked_admin_manage on public.blocked_slots;
create policy blocked_admin_insert on public.blocked_slots for insert to authenticated with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy blocked_admin_update on public.blocked_slots for update to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy blocked_admin_delete on public.blocked_slots for delete to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[]));

drop policy if exists settings_admin_manage on public.app_settings;
create policy settings_admin_insert on public.app_settings for insert to authenticated with check (public.is_admin(array['owner']::public.admin_role[]));
create policy settings_admin_update on public.app_settings for update to authenticated using (public.is_admin(array['owner','manager']::public.admin_role[])) with check (public.is_admin(array['owner','manager']::public.admin_role[]));
create policy settings_admin_delete on public.app_settings for delete to authenticated using (public.is_admin(array['owner']::public.admin_role[]));

drop policy if exists profiles_owner_manage on public.profiles;
create policy profiles_owner_insert on public.profiles for insert to authenticated with check (public.is_admin(array['owner']::public.admin_role[]));
create policy profiles_owner_update on public.profiles for update to authenticated using (public.is_admin(array['owner']::public.admin_role[])) with check (public.is_admin(array['owner']::public.admin_role[]));
create policy profiles_owner_delete on public.profiles for delete to authenticated using (public.is_admin(array['owner']::public.admin_role[]));

create index if not exists notifications_order_idx on public.notifications(order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);
create index if not exists order_requests_order_idx on public.order_requests(order_id);
create index if not exists status_events_changed_by_idx on public.order_status_events(changed_by);
