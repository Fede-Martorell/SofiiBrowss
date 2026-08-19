import { supabase } from './supabase';

type CalendarAction = 'upsert' | 'cancel' | 'delete';

/** Sincroniza el turno con la Edge Function ya configurada en Supabase. */
export async function syncBookingToGoogleCalendar(
  bookingId: string,
  action: CalendarAction,
): Promise<void> {
  const { error } = await supabase.functions.invoke('sync-google-calendar', {
    body: { bookingId, action },
  });

  if (error) {
    // La reserva ya está segura en Supabase. No se la rechaza por una caída
    // temporal de Calendar; el error queda visible para diagnóstico técnico.
    console.error('No se pudo sincronizar el turno con Google Calendar:', error);
  }
}
