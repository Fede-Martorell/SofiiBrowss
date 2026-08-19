// Supabase Edge Function: sincroniza cada turno con un calendario compartido.
// Secretos requeridos: GOOGLE_SERVICE_ACCOUNT_JSON y GOOGLE_CALENDAR_ID.
// La cuenta de servicio debe tener permiso "Hacer cambios" en ese calendario.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const encode = (value: string | Uint8Array) => {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

async function googleAccessToken(serviceAccount: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const rawKey = Uint8Array.from(atob(pem), char => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', rawKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claim}`));
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claim}.${encode(new Uint8Array(signature))}` }),
  });
  if (!response.ok) throw new Error(`Google OAuth: ${await response.text()}`);
  return (await response.json()).access_token as string;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { bookingId, action = 'upsert', eventId: deletedEventId } = await request.json();
    if (!bookingId || !['upsert', 'cancel', 'delete'].includes(action)) throw new Error('Solicitud inválida.');
    console.log(`Calendar sync requested: ${action} for booking ${bookingId}`);

    const serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
    if (!serviceAccountRaw || !calendarId) throw new Error('Google Calendar no está configurado.');
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: booking, error } = await admin.from('bookings').select('*, services(duration_minutes)').eq('id', bookingId).single();
    const accessToken = await googleAccessToken(JSON.parse(serviceAccountRaw));
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const eventId = booking?.google_calendar_event_id ?? deletedEventId;
    if ((error || !booking) && !(action === 'delete' && eventId)) throw new Error('No se encontró el turno.');
    if ((action === 'delete' || action === 'cancel' || booking.status === 'cancelled') && eventId) {
      await fetch(`${baseUrl}/${encodeURIComponent(eventId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      if (action === 'cancel') await admin.from('bookings').update({ google_calendar_event_id: null }).eq('id', bookingId);
      return Response.json({ ok: true }, { headers: corsHeaders });
    }
    if (action === 'delete' || booking?.status === 'cancelled') return Response.json({ ok: true }, { headers: corsHeaders });

    const duration = booking.services?.duration_minutes ?? 60;
    const start = new Date(`${booking.appointment_date}T${booking.appointment_time}:00-03:00`);
    const end = new Date(start.getTime() + duration * 60_000);
    const event = {
      summary: `${booking.service_name} — ${booking.client_name}`,
      description: `Teléfono: ${booking.client_phone}${booking.notes ? `\nNotas: ${booking.notes}` : ''}`,
      location: 'SofiiBrowss.studio',
      start: { dateTime: start.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
    };
    const response = await fetch(eventId ? `${baseUrl}/${encodeURIComponent(eventId)}` : baseUrl, {
      method: eventId ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error(`Google Calendar: ${await response.text()}`);
    const savedEvent = await response.json();
    if (!eventId) await admin.from('bookings').update({ google_calendar_event_id: savedEvent.id }).eq('id', bookingId);
    console.log(`Calendar sync completed for booking ${bookingId}`);
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 400, headers: corsHeaders });
  }
});
