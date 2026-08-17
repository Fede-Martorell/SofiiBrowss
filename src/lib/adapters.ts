// Adaptadores entre los tipos DB (snake_case) y los tipos legacy de la app (camelCase).
// La app sigue usando los tipos de src/types.ts para no tocar los componentes.

import type {
  Service as DbService,
  GalleryItem as DbGallery,
  Booking as DbBooking,
  Review as DbReview,
  AppSettingsRow as DbSettings,
} from './db';
import type {
  Service as LegacyService,
  GalleryItem as LegacyGallery,
  Booking as LegacyBooking,
  Review as LegacyReview,
  AppSettings,
} from '../types';

// ── DB → Legacy ─────────────────────────────────────────────

export function dbToService(s: DbService): LegacyService {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description ?? '',
    durationMinutes: s.duration_minutes,
    price: s.price_cents, // en la UI se muestra como pesos (no centavos)
    image: s.image ?? '',
    images: s.images ?? [],
    popular: s.popular,
    availableSlots: s.available_slots ?? undefined,
  };
}

export function dbToGallery(g: DbGallery): LegacyGallery {
  return {
    id: g.id,
    title: g.title,
    category: g.category,
    imageUrl: g.image_url,
    images: g.images ?? [],
    description: g.description ?? undefined,
  };
}

export function dbToBooking(b: DbBooking): LegacyBooking {
  return {
    id: b.id,
    serviceId: b.service_id ?? '',
    serviceName: b.service_name,
    clientName: b.client_name,
    clientPhone: b.client_phone,
    date: b.appointment_date,
    time: b.appointment_time,
    notes: b.notes ?? undefined,
    status: b.status,
    createdAt: b.created_at,
  };
}

export function dbToReview(r: DbReview): LegacyReview {
  return {
    id: r.id,
    clientName: r.client_name,
    serviceName: r.service_name,
    rating: r.rating,
    comment: r.comment,
    date: r.display_date,
    verified: r.approved, // legacy "verified" = "approved"
  };
}

export function dbToSettings(s: DbSettings): AppSettings {
  return {
    businessName: s.business_name,
    tagline: s.tagline ?? '',
    phoneWhatsApp: s.phone_whatsapp ?? '',
    instagram: s.instagram ?? '',
    location: s.location ?? '',
    primaryColor: s.primary_color ?? '#d97706',
    secondaryColor: s.secondary_color ?? '#0f172a',
    accentColor: s.accent_color ?? '#f59e0b',
    fontFamily: s.font_family ?? "'Plus Jakarta Sans', sans-serif",
    workingDays: s.working_days ?? [1, 2, 3, 4, 5, 6],
    workStartHour: s.work_start_hour,
    workEndHour: s.work_end_hour,
    appointmentDurationStep: s.appointment_duration_step,
    autoConfirmWhatsApp: s.auto_confirm_whatsapp,
    notificationEmail: s.notification_email ?? undefined,
    // adminPassword/staffPassword ya no se persisten acá.
  };
}

// ── Legacy → DB (para inserts/updates) ─────────────────────

export function legacyToDbService(
  s: Omit<LegacyService, never> | Partial<LegacyService>
): Partial<DbService> {
  const out: Partial<DbService> = {};
  if (s.name !== undefined) out.name = s.name;
  if (s.category !== undefined) out.category = s.category;
  if (s.description !== undefined) out.description = s.description;
  if (s.durationMinutes !== undefined) out.duration_minutes = s.durationMinutes;
  if (s.price !== undefined) out.price_cents = s.price;
  if (s.image !== undefined) out.image = s.image;
  if (s.images !== undefined) out.images = s.images;
  if (s.popular !== undefined) out.popular = s.popular;
  if (s.availableSlots !== undefined) out.available_slots = s.availableSlots;
  return out;
}

export function legacyToDbGallery(
  g: Partial<LegacyGallery>
): Partial<DbGallery> {
  const out: Partial<DbGallery> = {};
  if (g.title !== undefined) out.title = g.title;
  if (g.category !== undefined) out.category = g.category;
  if (g.imageUrl !== undefined) out.image_url = g.imageUrl;
  if (g.images !== undefined) out.images = g.images;
  if (g.description !== undefined) out.description = g.description;
  return out;
}

export function legacyToDbSettings(
  s: Partial<AppSettings>
): Partial<DbSettings> {
  const out: Partial<DbSettings> = {};
  if (s.businessName !== undefined) out.business_name = s.businessName;
  if (s.tagline !== undefined) out.tagline = s.tagline;
  if (s.phoneWhatsApp !== undefined) out.phone_whatsapp = s.phoneWhatsApp;
  if (s.instagram !== undefined) out.instagram = s.instagram;
  if (s.location !== undefined) out.location = s.location;
  if (s.primaryColor !== undefined) out.primary_color = s.primaryColor;
  if (s.secondaryColor !== undefined) out.secondary_color = s.secondaryColor;
  if (s.accentColor !== undefined) out.accent_color = s.accentColor;
  if (s.fontFamily !== undefined) out.font_family = s.fontFamily;
  if (s.workingDays !== undefined) out.working_days = s.workingDays;
  if (s.workStartHour !== undefined) out.work_start_hour = s.workStartHour;
  if (s.workEndHour !== undefined) out.work_end_hour = s.workEndHour;
  if (s.appointmentDurationStep !== undefined) {
    out.appointment_duration_step = s.appointmentDurationStep;
  }
  if (s.autoConfirmWhatsApp !== undefined) {
    out.auto_confirm_whatsapp = s.autoConfirmWhatsApp;
  }
  if (s.notificationEmail !== undefined) out.notification_email = s.notificationEmail;
  return out;
}
