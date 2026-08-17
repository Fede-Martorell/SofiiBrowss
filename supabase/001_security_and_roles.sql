-- Seguridad para SofiiBrowss Studio
-- Ejecutar una vez en Supabase: SQL Editor > New query.
-- Este script conserva los datos y reemplaza las políticas públicas inseguras.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- El perfil solo puede ser leído por su titular. El rol se obtiene mediante
-- current_user_role(), evitando exponer el listado de personal.
drop policy if exists profiles_select_policy on public.profiles;
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Catálogo y galería públicos; sus cambios son exclusivos de la dueña.
drop policy if exists services_select_policy on public.services;
drop policy if exists services_write_policy on public.services;
drop policy if exists services_public_read on public.services;
drop policy if exists services_owner_manage on public.services;
create policy services_public_read on public.services for select
  using (is_active = true);
create policy services_owner_manage on public.services for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

drop policy if exists gallery_select_policy on public.gallery_items;
drop policy if exists gallery_write_policy on public.gallery_items;
drop policy if exists gallery_public_read on public.gallery_items;
drop policy if exists gallery_owner_manage on public.gallery_items;
create policy gallery_public_read on public.gallery_items for select using (true);
create policy gallery_owner_manage on public.gallery_items for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

drop policy if exists settings_select_policy on public.settings;
drop policy if exists settings_update_policy on public.settings;
drop policy if exists settings_public_read on public.settings;
drop policy if exists settings_owner_update on public.settings;
create policy settings_public_read on public.settings for select using (true);
create policy settings_owner_update on public.settings for update to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- Una clienta puede crear una reserva pendiente, pero no consultar ni editar
-- las reservas de otras personas. Equipo y dueña las gestionan.
drop policy if exists bookings_public_access on public.bookings;
drop policy if exists bookings_public_insert on public.bookings;
drop policy if exists bookings_staff_read on public.bookings;
drop policy if exists bookings_staff_update on public.bookings;
drop policy if exists bookings_owner_delete on public.bookings;
create policy bookings_public_insert on public.bookings for insert to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.is_active = true
    )
  );
create policy bookings_staff_read on public.bookings for select to authenticated
  using (public.current_user_role() in ('owner', 'staff'));
create policy bookings_staff_update on public.bookings for update to authenticated
  using (public.current_user_role() in ('owner', 'staff'))
  with check (public.current_user_role() in ('owner', 'staff'));
create policy bookings_owner_delete on public.bookings for delete to authenticated
  using (public.current_user_role() = 'owner');

-- Reseñas: cualquiera puede enviar una pendiente; solo la dueña modera.
drop policy if exists reviews_insert_policy on public.reviews;
drop policy if exists reviews_manage_policy on public.reviews;
drop policy if exists reviews_select_policy on public.reviews;
drop policy if exists reviews_public_read_approved on public.reviews;
drop policy if exists reviews_public_insert_pending on public.reviews;
drop policy if exists reviews_owner_manage on public.reviews;
create policy reviews_public_read_approved on public.reviews for select
  using (approved = true);
create policy reviews_public_insert_pending on public.reviews for insert to anon, authenticated
  with check (approved = false);
create policy reviews_owner_manage on public.reviews for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- Storage: ajustá el nombre del bucket si no se llama exactamente "media".
drop policy if exists media_public_read on storage.objects;
drop policy if exists media_owner_manage on storage.objects;
create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_owner_manage on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.current_user_role() = 'owner')
  with check (bucket_id = 'media' and public.current_user_role() = 'owner');
