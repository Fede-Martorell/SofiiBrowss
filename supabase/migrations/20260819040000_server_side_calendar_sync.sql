-- Sincronización servidor a servidor: no depende de Vercel ni del navegador.
create extension if not exists pg_net;

create or replace function public.enqueue_google_calendar_sync()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_action text;
  v_booking_id uuid;
  v_event_id text;
begin
  if tg_op = 'DELETE' then
    v_action := 'delete';
    v_booking_id := old.id;
    v_event_id := old.google_calendar_event_id;
  else
    v_action := case when new.status = 'cancelled' then 'cancel' else 'upsert' end;
    v_booking_id := new.id;
    v_event_id := new.google_calendar_event_id;
  end if;

  perform net.http_post(
    url := 'https://jswskajxagdpcpmuirtg.supabase.co/functions/v1/sync-google-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_RVFw1S7eCKZi_jHr-pzjVg_TorbMdKj'
    ),
    body := jsonb_build_object(
      'bookingId', v_booking_id,
      'action', v_action,
      'eventId', v_event_id
    ),
    timeout_milliseconds := 10_000
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists bookings_google_calendar_sync on public.bookings;
create trigger bookings_google_calendar_sync
after insert or update of status, appointment_date, appointment_time, service_name, client_name, client_phone, notes or delete
on public.bookings
for each row execute function public.enqueue_google_calendar_sync();
