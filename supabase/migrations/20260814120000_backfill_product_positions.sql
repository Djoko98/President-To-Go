-- Proizvodi dodati kroz administraciju su svi ostajali na position = 0, pa je redosled
-- unutar kategorije bio nasumičan. Dodeljujemo jedinstven redosled po kategoriji, redom
-- kojim su proizvodi dodavani; seed grupa deli created_at, pa je razrešavamo starom pozicijom.
with ordered as (
  select id, (row_number() over (partition by category_id order by created_at, position, name)) - 1 as rank
  from public.products
)
update public.products as p
set position = ordered.rank
from ordered
where ordered.id = p.id and p.position is distinct from ordered.rank;
