-- Kategorije se dele u dve grupe (piće i hrana) i dobijaju kategorije hrane.
alter table public.categories add column if not exists group_key text not null default 'drinks';

do $$ begin
  alter table public.categories add constraint categories_group_key_check check (group_key in ('drinks', 'food'));
exception when duplicate_object then null; end $$;

update public.categories set group_key = 'drinks' where slug in ('kokteli', 'kafe', 'vocni-napici');

insert into public.categories(name, slug, group_key, position) values
  ('Doručak', 'dorucak', 'food', 3),
  ('Posno', 'posno', 'food', 4),
  ('Paste', 'paste', 'food', 5),
  ('Rižoto', 'rizoto', 'food', 6),
  ('Pice', 'pice', 'food', 7),
  ('Sa roštilja', 'sa-rostilja', 'food', 8),
  ('Glavna jela', 'glavna-jela', 'food', 9),
  ('Obrok salate', 'obrok-salate', 'food', 10),
  ('Dezerti', 'dezerti', 'food', 11)
on conflict (slug) do update set name = excluded.name, group_key = excluded.group_key, position = excluded.position;

create index if not exists categories_group_position_idx on public.categories(group_key, position);
