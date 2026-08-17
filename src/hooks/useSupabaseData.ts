import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Service,
  GalleryItem,
  Booking,
  Review,
  AppSettingsRow,
  Profile,
  UserRole,
} from '../lib/db';
import {
  fetchServices,
  fetchGallery,
  fetchBookings,
  fetchReviews,
  fetchSettings,
  fetchMyProfile,
} from '../lib/queries';

// Carga inicial de todos los datos públicos + admin.
// Diseñado para que la app se hidrate desde Supabase en mount.
// El state vive en App.tsx; este hook devuelve funciones `setX`
// pensadas para reemplazar el set local después de una mutación.

export function useSupabaseData() {
  const [services, setServices] = useState<Service[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<AppSettingsRow | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [s, g, b, r, st] = await Promise.all([
        fetchServices(),
        fetchGallery(),
        fetchBookings(),
        fetchReviews(),
        fetchSettings(),
      ]);
      setServices(s);
      setGallery(g);
      setBookings(b);
      setReviews(r);
      setSettings(st);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error cargando datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    services,
    setServices,
    gallery,
    setGallery,
    bookings,
    setBookings,
    reviews,
    setReviews,
    settings,
    setSettings,
    loading,
    error,
    refresh,
  };
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(
    null
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | null) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return;
    }
    try {
      const p = await fetchMyProfile();
      setProfile(p);
      setRole(p?.role ?? null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[auth] No se pudo cargar el perfil:', e);
      setProfile(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
      loadProfile(u?.id ?? null).finally(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
      loadProfile(u?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return { user, profile, role, loading, setProfile, setRole };
}
