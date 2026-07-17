insert into public.app_settings(ordering_enabled, default_preparation_minutes, slot_interval_minutes, max_orders_per_slot, max_advance_minutes, restaurant_phone, restaurant_address)
values (true, 20, 15, 8, 120, '+381000000000', 'President, Srbija')
on conflict ((true)) do nothing;

insert into public.business_hours(day_of_week, opens_at, closes_at, is_closed) values
  (0, '10:00', '23:00', false),
  (1, '10:00', '23:00', false),
  (2, '10:00', '23:00', false),
  (3, '10:00', '23:00', false),
  (4, '10:00', '23:00', false),
  (5, '10:00', '23:59', false),
  (6, '10:00', '23:59', false)
on conflict (day_of_week) do update set opens_at = excluded.opens_at, closes_at = excluded.closes_at, is_closed = excluded.is_closed;

insert into public.categories(name, slug, image_url, position) values
  ('Kokteli', 'kokteli', '/images/products/lubenito.png', 0),
  ('Kafe', 'kafe', '/images/products/lubenito.png', 1),
  ('Voćni napici', 'vocni-napici', '/images/products/lubenito.png', 2)
on conflict (slug) do update set name = excluded.name, image_url = excluded.image_url, position = excluded.position;

with data(category_slug, name, slug, description, ingredients, price, accent_color, alcohol, prep, max_qty, position) as (values
  ('kokteli','Lubenito','lubenito','Osvežavajući signature koktel od lubenice.','lubenica, nana, limeta, sprite, grenadin',59000,'#fde9e7',true,15,10,0),
  ('kokteli','Aperol Spritz','aperol-spritz','Italijanski aperitiv sa blagom citrusnom gorčinom.','aperol, prosecco, soda, pomorandža',65000,'#fff0e3',true,12,10,1),
  ('kokteli','Blue Lagoon','blue-lagoon','Vedra citrusna kombinacija sa tropskim karakterom.','vodka, blue curaçao, limun, sprite',62000,'#e6f6fb',true,15,10,2),
  ('kokteli','Mojito','mojito','Klasično osveženje sa svežom nanom i limetom.','beli rum, nana, limeta, soda',62000,'#edf7e9',true,15,10,3),
  ('kafe','Iced Coffee','iced-coffee','Hladna kafa punog ukusa, nežno zaslađena.','espresso, mleko, led, sirup od vanile',39000,'#f2ece7',false,8,10,0),
  ('kafe','Frappe','frappe','Kremasta hladna kafa sa bogatom penom.','instant kafa, mleko, led, smeđi šećer',42000,'#f3eee8',false,10,10,1),
  ('kafe','Iced Latte','iced-latte','Duple doze espressa sa hladnim mlekom.','dupli espresso, mleko, led',43000,'#f6f0e8',false,8,10,2),
  ('vocni-napici','Limunada','limunada','Sveže ceđen limun sa blagom notom nane.','limun, voda, nana, šećerni sirup',32000,'#fffbe2',false,7,12,0),
  ('vocni-napici','Malina','malina','Voćni napitak od aromatične domaće maline.','malina, limun, voda, led',38000,'#fde9ef',false,8,12,1),
  ('vocni-napici','Tropski miks','tropski-miks','Sočna mešavina egzotičnog voća.','mango, ananas, marakuja, pomorandža',42000,'#fff2dc',false,9,12,2)
)
insert into public.products(category_id, name, slug, description, ingredients, price, image_url, accent_color, contains_alcohol, preparation_minutes, max_quantity_per_order, position)
select c.id, d.name, d.slug, d.description, d.ingredients, d.price, '/images/products/lubenito.png', d.accent_color, d.alcohol, d.prep, d.max_qty, d.position
from data d join public.categories c on c.slug = d.category_slug
on conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, description = excluded.description, ingredients = excluded.ingredients, price = excluded.price, image_url = excluded.image_url, accent_color = excluded.accent_color, contains_alcohol = excluded.contains_alcohol, preparation_minutes = excluded.preparation_minutes, max_quantity_per_order = excluded.max_quantity_per_order, position = excluded.position;
