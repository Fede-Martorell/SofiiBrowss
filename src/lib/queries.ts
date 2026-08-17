import { supabase } from './supabase';
import type {
  Service,
  GalleryItem,
  Booking,
  Review,
  AppSettingsRow,
  Profile,
  UserRole,
} from './db';

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────
export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createService(
  input: Omit<Service, 'id' | 'created_at'>
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  partial: Partial<Omit<Service, 'id' | 'created_at'>>
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .update(partial)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────
export async function fetchGallery(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGalleryItem(
  input: Omit<GalleryItem, 'id' | 'created_at'>
): Promise<GalleryItem> {
  const { data, error } = await supabase
    .from('gallery_items')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGalleryItem(
  id: string,
  partial: Partial<Omit<GalleryItem, 'id' | 'created_at'>>
): Promise<GalleryItem> {
  const { data, error } = await supabase
    .from('gallery_items')
    .update(partial)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const { error } = await supabase.from('gallery_items').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────
export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBooking(
  input: Omit<Booking, 'id' | 'created_at' | 'status'> & {
    status?: Booking['status'];
  }
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({ ...input, status: input.status ?? 'pending' })
    .select()
    .single();
  if (error) throw error; // 23505 = unique_violation → slot ocupado
  return data;
}

export async function updateBookingStatus(
  id: string,
  status: Booking['status']
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReview(
  input: Omit<Review, 'id' | 'created_at' | 'approved'> & {
    approved?: boolean;
  }
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ ...input, approved: input.approved ?? false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleReviewApproval(
  id: string,
  approved: boolean
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ approved })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// SETTINGS (singleton)
// ─────────────────────────────────────────────
export async function fetchSettings(): Promise<AppSettingsRow | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(
  partial: Partial<Omit<AppSettingsRow, 'id' | 'updated_at'>>
): Promise<AppSettingsRow> {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...partial, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────
export async function fetchMyProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Devuelve el rol del usuario actual consultando profiles.
 * (Equivalente a la función SQL `get_user_role()`; lo duplicamos
 * en cliente para evitar una roundtrip a la DB en cada check.)
 */
export async function fetchMyRole(): Promise<UserRole | null> {
  const p = await fetchMyProfile();
  return p?.role ?? null;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
const BUCKET = 'media';

function fileExtFromName(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : 'jpg';
}

function randomId(): string {
  // 12 chars hex; suficiente para evitar colisiones
  return Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
}

/** Sube un archivo al bucket 'media' y devuelve la URL pública. */
export async function uploadImage(
  file: File,
  folder: 'services' | 'gallery'
): Promise<string> {
  const ext = fileExtFromName(file.name);
  const path = `${folder}/${randomId()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Borra una imagen del bucket a partir de su URL pública. */
export async function deleteImageByUrl(publicUrl: string): Promise<void> {
  // Extraemos el path relativo a partir de la URL pública.
  // Formato típico: https://<ref>.supabase.co/storage/v1/object/public/media/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return; // no es del bucket, no la tocamos
  const path = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    // No fallamos la operación principal si no se pudo borrar el archivo
    // eslint-disable-next-line no-console
    console.warn('[storage] No se pudo borrar el archivo:', error.message);
  }
}
