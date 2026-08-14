-- Nalozi za osoblje: vlasnik pravi naloge, a slučajno registrovan korisnik više ne dobija pristup.

alter table public.profiles add column if not exists is_active boolean not null default true;

-- Do sada je svaki novi auth nalog automatski dobijao profil sa ulogom staff, pa je magic link
-- na stranici za prijavu bio otvorena vrata do porudžbina. Profil sada nastaje samo iz /admin/osoblje.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Deaktiviran radnik gubi pristup bez brisanja naloga i bez gubitka istorije.
create or replace function public.is_admin(required_roles public.admin_role[] default array['owner','manager','staff']::public.admin_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and role = any(required_roles)
  );
$$;

-- Osoblje sme da prebaci samo dostupnost proizvoda. RLS ne razlikuje kolone, pa dostupnost ide
-- kroz ovu funkciju umesto kroz šire update pravo koje bi otvorilo i cenu, naziv i brisanje.
create or replace function public.set_product_availability(p_product_id uuid, p_available boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Nemaš dozvolu za izmenu dostupnosti.' using errcode = '42501';
  end if;
  update public.products set is_available = p_available where id = p_product_id;
  if not found then
    raise exception 'Proizvod nije pronađen.' using errcode = 'P0002';
  end if;
end $$;
revoke all on function public.set_product_availability(uuid, boolean) from public;
grant execute on function public.set_product_availability(uuid, boolean) to authenticated;
