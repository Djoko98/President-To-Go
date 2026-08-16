-- Nove kategorije hrane: „Čorbe i potaži" pre obrok salata, „Dodaci" posle dezerta.
update public.categories set position = 11 where slug = 'obrok-salate';
update public.categories set position = 12 where slug = 'dezerti';

insert into public.categories(name, slug, group_key, position) values
  ('Čorbe i potaži', 'corbe-i-potazi', 'food', 10),
  ('Dodaci', 'dodaci', 'food', 13)
on conflict (slug) do update set name = excluded.name, group_key = excluded.group_key, position = excluded.position;
