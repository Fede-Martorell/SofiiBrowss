-- Ejecutar esta migración en el proyecto Supabase antes de publicar.
-- La regla queda en la base, por lo que no puede eludirse desde el navegador.

alter table public.bookings
  add column if not exists google_calendar_event_id text;

create unique index if not exists bookings_google_calendar_event_id_key
  on public.bookings (google_calendar_event_id)
  where google_calendar_event_id is not null;

-- Reemplaza la RPC pública existente preservando su interfaz.
create or replace function public.create_public_booking(
  p_service_id uuid,
  p_client_name text,
  p_client_phone text,
  p_appointment_date date,
  p_appointment_time time,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_duration integer;
  v_start timestamp;
begin
  v_start := p_appointment_date + p_appointment_time;

  if v_start < timezone('America/Argentina/Buenos_Aires', now()) + interval '2 hours' then
    raise exception 'Los turnos deben solicitarse con al menos 2 horas de anticipación.'
      using errcode = '22023';
  end if;

  select duration_minutes into v_duration
  from public.services
  where id = p_service_id and is_active = true;

  if v_duration is null then
    raise exception 'El servicio seleccionado no está disponible.' using errcode = '22023';
  end if;

  -- Evita solapamientos incluso si dos personas reservan simultáneamente.
  if exists (
    select 1
    from public.bookings b
    join public.services s on s.id = b.service_id
    where b.appointment_date = p_appointment_date
      and b.status <> 'cancelled'
      and v_start < (b.appointment_date + b.appointment_time + make_interval(mins => s.duration_minutes))
      and (b.appointment_date + b.appointment_time) < v_start + make_interval(mins => v_duration)
  ) then
    raise exception 'Ese horario acaba de ser reservado. Elegí otro horario.' using errcode = '23505';
  end if;

  insert into public.bookings (
    service_id, service_name, client_name, client_phone,
    appointment_date, appointment_time, notes, status
  )
  select p_service_id, s.name, trim(p_client_name), trim(p_client_phone),
         p_appointment_date, p_appointment_time, nullif(trim(p_notes), ''), 'pending'
  from public.services s
  where s.id = p_service_id
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.create_public_booking(uuid, text, text, date, time, text) from public;
grant execute on function public.create_public_booking(uuid, text, text, date, time, text) to anon, authenticated;

-- Habilita las actualizaciones instantáneas del panel de dueña/equipo.
do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end;
$$;
