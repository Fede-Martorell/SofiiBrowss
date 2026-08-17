// Tipos que reflejan el schema de la DB (snake_case → camelCase en el cliente).
// Mantener sincronizado con el SQL del plan.

export type UserRole = 'owner' | 'staff';
export type ServiceCategory = 'lashes' | 'brows' | 'combo';
export type GalleryCategory = 'lashes' | 'brows';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  image: string | null;
  images: string[];
  popular: boolean;
  available_slots: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image_url: string;
  images: string[];
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Booking {
  id: string;
  service_id: string | null;
  service_name: string;
  client_name: string;
  client_phone: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  notes: string | null;
  status: BookingStatus;
  created_at: string;
}

export interface Review {
  id: string;
  client_name: string;
  service_name: string;
  rating: number; // 1-5
  comment: string;
  display_date: string;
  approved: boolean;
  created_at: string;
}

export interface AppSettingsRow {
  id: 1;
  business_name: string;
  tagline: string | null;
  phone_whatsapp: string | null;
  instagram: string | null;
  location: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  working_days: number[];
  work_start_hour: number;
  work_end_hour: number;
  appointment_duration_step: number;
  auto_confirm_whatsapp: boolean;
  notification_email: string | null;
  updated_at: string;
}
