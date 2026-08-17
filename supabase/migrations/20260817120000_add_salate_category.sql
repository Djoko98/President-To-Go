-- Nova kategorija hrane „Salate" između obrok salata i dezerta.
update public.categories set position = 14 where slug = 'dodaci';
update public.categories set position = 13 where slug = 'dezerti';

insert into public.categories(name, slug, group_key, position) values
  ('Salate', 'salate', 'food', 12)
on conflict (slug) do update set name = excluded.name, group_key = excluded.group_key, position = excluded.position;
