import { supabase } from './supabase';

type CalendarAction = 'upsert' | 'cancel' | 'delete';

/**
 * La sincronización es opcional: solo se activa cuando la Edge Function y las
 * credenciales de Google ya fueron configuradas en producción.
 */
export async function syncBookingToGoogleCalendar(
  bookingId: string,
  action: CalendarAction,
): Promise<void> {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_SYNC_ENABLED !== 'true') return;

  const { error } = await supabase.functions.invoke('sync-google-calendar', {
    body: { bookingId, action },
  });

  if (error) {
    // La reserva ya está segura en Supabase. No se la rechaza por una caída
    // temporal de Calendar; el error queda visible para diagnóstico técnico.
    console.error('No se pudo sincronizar el turno con Google Calendar:', error);
  }
}
