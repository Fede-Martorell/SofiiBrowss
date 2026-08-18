import React, { useState, useEffect } from 'react';

import {
  DEFAULT_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_GALLERY,
  INITIAL_REVIEWS
} from './types';
import type {
  AppSettings,
  Service,
  GalleryItem,
  Booking,
  Review
} from './types';
import { BookingModal } from './components/BookingModal';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';
import { fetchMyRole, fetchServices } from './lib/queries';
import type { UserRole } from './lib/db';
import { dbToService } from './lib/adapters';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Lock,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  MessageSquare
} from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  height?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt, height = '200px' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [images.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (!images || images.length === 0) {
    return <div style={{ height, background: '#1e293b' }} />;
  }

  return (
    <div
      style={{ height, overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={images[currentIndex]}
        alt={`${alt} - Foto ${currentIndex + 1}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 0.4s ease, opacity 0.3s ease',
          userSelect: 'none',
        }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Foto anterior"
            style={{
              position: 'absolute',
              top: '50%',
              left: '8px',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: isHovered ? 1 : 0.85,
              transition: 'opacity 0.2s',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Foto siguiente"
            style={{
              position: 'absolute',
              top: '50%',
              right: '8px',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: isHovered ? 1 : 0.85,
              transition: 'opacity 0.2s',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ChevronRight size={18} />
          </button>

          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 3
          }}>
            {images.map((_, idx) => (
              <span
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                style={{
                  width: idx === currentIndex ? '14px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: idx === currentIndex ? 'linear-gradient(135deg, #f5d796, #d8a563)' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Instagram = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('app_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = localStorage.getItem('app_gallery');
    return saved ? JSON.parse(saved) : INITIAL_GALLERY;
  });

  // Los turnos nunca se guardan en el navegador ni se cargan para visitantes.
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('app_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  // Cargar datos iniciales desde Supabase
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const [serviceRows, reviewsResponse] = await Promise.all([
          fetchServices(),
          supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false }),
        ]);

        // Los IDs de esta lista son UUIDs reales de Supabase; nunca usar los
        // ejemplos locales para crear una reserva.
        setServices(serviceRows.map(dbToService));

        const { data: reviewsData } = reviewsResponse;

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData.map(r => ({
            id: r.id,
            clientName: r.client_name || '',
            serviceName: r.service_name || '',
            rating: r.rating || 5,
            comment: r.comment || '',
            date: r.display_date || r.date || 'Reciente',
            verified: r.approved ?? r.verified ?? true
          })));
        }
      } catch (err) {
        console.error("Error al obtener datos de Supabase:", err);
      }
    };

    fetchSupabaseData();
  }, []);

  const loadAdminBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    setBookings((data ?? []).map(b => ({
      id: b.id,
      serviceId: b.service_id ?? '',
      serviceName: b.service_name,
      clientName: b.client_name,
      clientPhone: b.client_phone,
      date: b.appointment_date,
      time: b.appointment_time,
      notes: b.notes ?? '',
      status: b.status,
      createdAt: b.created_at,
    })));
  };

  // 2. Handlers para sincronizar con Supabase desde el panel Admin
  const handleDeleteBookingFromDb = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      console.error("Error al eliminar turno:", err.message);
      alert("No se pudo eliminar el turno de la base de datos: " + err.message);
    }
  };

  const handleUpdateBookingStatusInDb = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err: any) {
      console.error("Error al actualizar estado:", err.message);
    }
  };

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    clientName: '',
    serviceName: 'Lifting de Pestañas + Tinte',
    rating: 5,
    comment: ''
  });

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.clientName.trim() || !newReview.comment.trim()) return;

    try {
      await supabase.from('reviews').insert([{
        client_name: newReview.clientName,
        service_name: newReview.serviceName,
        rating: newReview.rating,
        comment: newReview.comment,
        display_date: 'Reciente',
        approved: false
      }]);
    } catch (err) {
      console.error("Error guardando reseña:", err);
    }

    // La reseña queda pendiente de moderación y no se muestra hasta aprobarse.
    setNewReview({ clientName: '', serviceName: 'Lifting de Pestañas + Tinte', rating: 5, comment: '' });
    setIsReviewModalOpen(false);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark';
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'lashes' | 'brows' | 'combo'>('all');

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const isLight = theme === 'light';
    document.documentElement.classList.toggle('light-mode', isLight);
    document.body.classList.toggle('light-mode', isLight);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f4ebd9' : '#241815');
  }, [theme]);

  const isAnyModalOpen = Boolean(selectedService) || isReviewModalOpen || isAdminOpen;
  useEffect(() => {
    document.body.classList.toggle('modal-open', isAnyModalOpen);
    return () => document.body.classList.remove('modal-open');
  }, [isAnyModalOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const openAuthModal = async () => {
    setIsLoggingIn(true);
    setPasswordError('');
    setInputPassword('');
    setIsAdminOpen(true);

    try {
      const role = await fetchMyRole();
      setUserRole(role);
      setIsAdminAuthenticated(role !== null);
      if (role) await loadAdminBookings();
    } catch {
      setIsAdminAuthenticated(false);
      setUserRole(null);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setPasswordError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail.trim(),
      password: inputPassword,
    });

    if (error) {
      setPasswordError('Email o contraseña incorrectos.');
      setIsLoggingIn(false);
      return;
    }

    const role = await fetchMyRole();
    if (!role) {
      await supabase.auth.signOut();
      setPasswordError('Tu usuario no tiene un rol asignado. Pedile a la dueña que lo configure.');
      setIsLoggingIn(false);
      return;
    }

    setUserRole(role);
    setIsAdminAuthenticated(true);
    await loadAdminBookings();
    setInputPassword('');
    setIsLoggingIn(false);
  };

  // Guardar turnos en Supabase
  const handleConfirmBooking = async (bookingData: { clientName: string; clientPhone: string; date: string; time: string; notes: string }): Promise<boolean> => {
    if (!selectedService) return false;

    const newBooking: Booking = {
      id: Date.now().toString(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone,
      date: bookingData.date,
      time: bookingData.time,
      notes: bookingData.notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Enviar a Supabase con los nombres exactos de columnas
    const { error } = await supabase.from('bookings').insert({
      service_id: selectedService.id,
      service_name: selectedService.name,
      client_name: bookingData.clientName,
      client_phone: bookingData.clientPhone,
      appointment_date: bookingData.date,
      appointment_time: bookingData.time,
      notes: bookingData.notes,
      status: 'pending'
    });

    if (error) {
      console.error("Error al insertar en Supabase:", error);
      return false;
    }

    setBookings(prev => [newBooking, ...prev]);
    return true;
  };

  const filteredServices = activeCategoryFilter === 'all'
    ? services
    : services.filter(s => s.category === activeCategoryFilter);

  return (
    <div className="app-shell" style={{
      '--primary': settings.primaryColor,
      '--accent': settings.accentColor,
      fontFamily: settings.fontFamily,
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden'
    } as React.CSSProperties}>

      {/* Header / Navbar */}
      <header className="site-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '12px 16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: '8px',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              padding: '6px 10px',
              borderRadius: '12px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              maxWidth: '100%'
            }}>
              <div style={{
                width: '60px',
                maxWidth: '100%',
                height: '4px',
                borderTop: '2.5px solid #d8a563',
                borderRadius: '100px 100px 0 0',
                background: 'linear-gradient(90deg, transparent, #f5d796, #d8a563, transparent)',
                marginBottom: '1px'
              }} />
              <span style={{
                fontSize: 'clamp(0.95rem, 2.4vw, 1.05rem)',
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: 'var(--text-main)',
                lineHeight: 1.1,
                whiteSpace: 'nowrap'
              }}>
                Sofibrowss
              </span>
              <span style={{
                fontSize: '0.5rem',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #f5d796 0%, #d8a563 50%, #b87b32 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                marginTop: '1px',
                display: 'inline-block',
                whiteSpace: 'nowrap'
              }}>
                services
              </span>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{
                padding: '8px',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: 'var(--glass-border)'
              }}
              title={theme === 'dark' ? 'Cambiar a Modo Claro / Nude' : 'Cambiar a Modo Noche'}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: '#d8a563' }} /> : <Moon size={18} style={{ color: '#d8a563' }} />}
            </button>

            <a
              href="#contacto"
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--text-main)', textDecoration: 'none' }}
            >
              <Phone size={14} style={{ color: '#d8a563' }} /> Contacto
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section" style={{
        position: 'relative',
        padding: 'clamp(40px, 8vw, 80px) clamp(14px, 4vw, 24px) clamp(36px, 6vw, 60px) clamp(14px, 4vw, 24px)',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'clamp(16px, 4vw, 24px) clamp(20px, 5vw, 36px)',
            borderRadius: 'clamp(18px, 4vw, 24px)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(20px)',
            maxWidth: '100%'
          }}>
            <div style={{
              width: 'clamp(120px, 35vw, 180px)',
              height: 'clamp(6px, 1vw, 8px)',
              borderTop: '3px solid #d8a563',
              borderRadius: '100px 100px 0 0',
              marginBottom: '6px',
              background: 'linear-gradient(90deg, transparent, #f5d796, #d8a563, transparent)'
            }} />
            <h2 style={{
              fontSize: 'clamp(1.8rem, 7vw, 2.6rem)',
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: 'var(--text-main)',
              letterSpacing: '-0.5px',
              lineHeight: 1,
              margin: 0
            }}>
              Sofibrow
            </h2>
            <span style={{
              fontSize: 'clamp(0.65rem, 2vw, 0.85rem)',
              letterSpacing: 'clamp(3px, 1vw, 5px)',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #f5d796 0%, #d8a563 50%, #b87b32 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginTop: '4px',
              fontWeight: 700,
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}>
              s e r v i c e s
            </span>
          </div>
        </div>

        <div className="hero-badge" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: '30px',
          background: 'var(--glass-bg)',
          border: '1.5px solid #d8a563',
          boxShadow: '0 4px 20px rgba(216, 165, 99, 0.25)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '20px',
          backdropFilter: 'blur(10px)',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <Star size={16} style={{ color: '#b87b32', fill: '#b87b32' }} />
          <span style={{
            color: 'var(--text-main)',
            fontWeight: 800,
            letterSpacing: '0.2px'
          }}>
            Reservas Online Rápidas y Directas
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.7rem, 5.5vw, 3.2rem)',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '20px',
          lineHeight: 1.15,
          padding: '0 4px'
        }}>
          {settings.tagline}
        </h1>

        <p style={{
          maxWidth: '650px',
          margin: '0 auto 36px auto',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}>
          Diseño personalizado de mirada, lifting de pestañas, extensiones y laminado de cejas profesional. Seleccioná tu turno en 1 minuto.
        </p>

        <div className="hero-highlights" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(10px, 2vw, 24px)',
          flexWrap: 'wrap',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div className="glass-card" style={{ padding: 'clamp(10px, 2.5vw, 16px) clamp(14px, 3vw, 24px)', display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px', minWidth: 0 }}>
            <Award size={22} style={{ color: '#d8a563', flexShrink: 0 }} />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.9rem' }}>Técnicas Profesionales</strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Materiales 100% aprobados</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 'clamp(10px, 2.5vw, 16px) clamp(14px, 3vw, 24px)', display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px', minWidth: 0 }}>
            <Calendar size={22} style={{ color: '#d8a563', flexShrink: 0 }} />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.9rem' }}>Turnos Instantáneos</strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Notificación por WhatsApp</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 'clamp(10px, 2.5vw, 16px) clamp(14px, 3vw, 24px)', display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px', minWidth: 0 }}>
            <MapPin size={22} style={{ color: '#d8a563', flexShrink: 0 }} />
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.9rem' }}>Ubicación Céntrica</strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{settings.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="servicios" className="content-section services-section" style={{ maxWidth: '1200px', margin: '40px auto 80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 className="section-title" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', color: 'var(--text-main)', marginBottom: '12px' }}>Nuestros Servicios & Precios</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.92rem, 2.5vw, 1.05rem)' }}>Elegí el tratamiento ideal para tus pestañas y cejas</p>

          <div className="category-tabs" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '24px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'all', label: 'Todos los servicios' },
              { id: 'lashes', label: '✨ Pestañas' },
              { id: 'brows', label: '🌿 Cejas' },
              { id: 'combo', label: '💎 Combos VIP' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryFilter(tab.id as any)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '30px',
                  border: activeCategoryFilter === tab.id
                    ? '1px solid #8a571c'
                    : '1px solid var(--glass-border)',
                  background: activeCategoryFilter === tab.id
                    ? 'linear-gradient(135deg, #b87b32 0%, #8a571c 100%)'
                    : 'var(--glass-bg)',
                  color: activeCategoryFilter === tab.id ? '#ffffff' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeCategoryFilter === tab.id
                    ? '0 4px 15px rgba(138, 87, 28, 0.45)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <span style={{ color: activeCategoryFilter === tab.id ? '#ffffff' : 'var(--text-main)' }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="services-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(14px, 2.5vw, 24px)'
        }}>
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="glass-card service-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {service.popular && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'linear-gradient(135deg, #b87b32 0%, #8a571c 100%)',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  zIndex: 2,
                  boxShadow: '0 4px 15px rgba(138, 87, 28, 0.45)'
                }}>
                  🔥 Más Pedido
                </div>
              )}

              <ImageCarousel
                images={service.images && service.images.length > 0 ? service.images : [service.image]}
                alt={service.name}
                height="200px"
              />

              <div className="service-card-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700, minWidth: 0, overflowWrap: 'anywhere' }}>{service.name}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f5d796 0%, #d8a563 50%, #b87b32 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.3px'
                  }}>
                    ${service.price.toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {service.durationMinutes} min
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', flex: 1, lineHeight: '1.5' }}>
                  {service.description}
                </p>

                <button
                  onClick={() => setSelectedService(service)}
                  className="btn-primary booking-trigger"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Sacar Turno <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="content-section gallery-section" style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginBottom: '10px' }}>Trabajos Realizados</h2>
          <p style={{ color: 'var(--text-muted)' }}>Resultados reales de nuestras clientas de pestañas y cejas</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
          gap: 'clamp(12px, 2.5vw, 20px)'
        }}>
          {gallery.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                height: '280px'
              }}
            >
              <ImageCarousel
                images={item.images && item.images.length > 0 ? item.images : [item.imageUrl]}
                alt={item.title}
                height="100%"
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, var(--card-bg), transparent)',
                padding: '20px 16px 16px 16px',
                pointerEvents: 'none'
              }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '4px', fontWeight: 700 }}>{item.title}</h4>
                {item.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* REVIEWS SECTION */}
        <div className="reviews-section" style={{ marginTop: '70px', paddingTop: '50px', borderTop: '1px dashed var(--glass-border)' }}>
          <div className="reviews-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={18} style={{ color: '#d8a563', fill: '#d8a563' }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>5.0 / 5.0</span>
              </div>
              <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                Opiniones de Nuestras Clientas ✨
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Experiencias reales luego de su atención en el estudio
              </p>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="btn-primary"
              style={{ fontSize: '0.88rem', padding: '10px 20px' }}
            >
              <Star size={16} /> Dejar mi Opinión
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: 'clamp(12px, 2.5vw, 20px)'
          }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={14} style={{ color: '#d8a563', fill: '#d8a563' }} />
                      ))}
                    </div>
                    {rev.verified && (
                      <span style={{
                        fontSize: '0.72rem',
                        color: '#16a34a',
                        background: 'rgba(34, 197, 94, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 700
                      }}>
                        ✓ Atendida
                      </span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: '1.5', marginBottom: '12px' }}>
                    "{rev.comment}"
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.92rem' }}>{rev.clientName}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#b87b32', fontWeight: 600 }}>{rev.serviceName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="modal-overlay review-modal-overlay" style={{
          background: 'rgba(15, 10, 8, 0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000
        }}>
          <div className="glass-panel modal-panel review-modal-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px' }}>
              <h3 style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.2rem)', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>
                Dejar Opinión sobre tu Atención ✨
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                aria-label="Cerrar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  minWidth: 36,
                  minHeight: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Tu Nombre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofia M."
                  className="custom-input"
                  value={newReview.clientName}
                  onChange={(e) => setNewReview({ ...newReview, clientName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Servicio Realizado
                </label>
                <select
                  className="custom-select"
                  value={newReview.serviceName}
                  onChange={(e) => setNewReview({ ...newReview, serviceName: e.target.value })}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Calificación
                </label>
                <div style={{ display: 'flex', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={24}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      style={{
                        color: star <= newReview.rating ? '#d8a563' : '#94a3b8',
                        fill: star <= newReview.rating ? '#d8a563' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Tu Experiencia o Reseña
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contanos qué te pareció el resultado, la atención o la delicadeza..."
                  className="custom-textarea"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                />
              </div>

              <div className="modal-actions review-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Publicar Reseña 💖
                </button>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER & CONTACT */}
      <footer id="contacto" className="site-footer" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '60px 24px 30px 24px',
        marginTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Sparkles size={24} style={{ color: '#d8a563' }} />
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)' }}>{settings.businessName}</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Nos especializamos en potenciar la mirada manteniendo la salud de tus pestañas y cejas.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '16px', fontSize: '1.05rem' }}>Ubicación & Contacto</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={18} style={{ color: '#d8a563' }} />
                <span style={{ color: 'var(--text-main)' }}>{settings.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} style={{ color: '#d8a563' }} />
                <a
                  href={`https://wa.me/${settings.phoneWhatsApp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                >
                  WhatsApp: {settings.phoneWhatsApp}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Instagram size={18} style={{ color: '#d8a563' }} />
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                >
                  @{settings.instagram}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '16px', fontSize: '1.05rem' }}>Atención al cliente</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Atención personalizada con reserva previa online.
            </p>
            <a
              href={`https://wa.me/${settings.phoneWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ display: 'inline-flex', textDecoration: 'none', alignItems: 'center', gap: '8px' }}
            >
              <MessageSquare size={18} /> Consultar por WhatsApp Directo
            </a>
          </div>
        </div>

        <div className="footer-bottom-row" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <span>© {new Date().getFullYear()} {settings.businessName}. Diseñado con amor ❤️ para potenciar tu belleza.</span>
          <button
            onClick={openAuthModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              opacity: 0.6,
              transition: 'opacity 0.2s',
              padding: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            title="Acceso restringido para el staff"
          >
            🔒 Acceso Equipo / Dueña
          </button>
        </div>
      </footer>

      {/* FLOATING DIRECT WHATSAPP BUTTON */}
      <a
        href={`https://wa.me/${settings.phoneWhatsApp}?text=Hola!%20Quisiera%20hacer%20una%20consulta%20sobre%20los%20servicios%20de%20pestañas%20y%20cejas%20✨`}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp"
        aria-label="Consultar por WhatsApp"
        style={{
          position: 'fixed',
          bottom: 'calc(20px + var(--safe-bottom))',
          right: 'calc(18px + var(--safe-right))',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #b87b32 0%, #8a571c 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 25px rgba(184, 123, 50, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          zIndex: 990,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s',
          textDecoration: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Consultar por WhatsApp"
      >
        <MessageSquare size={26} style={{ fill: '#ffffff' }} />
      </a>

      {/* BOOKING MODAL */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          settings={settings}
          bookings={bookings}
          onClose={() => setSelectedService(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {/* ADMIN PANEL OVERLAY / LOGIN MODAL */}
      {isAdminOpen && (
        !isAdminAuthenticated ? (
          <div className="modal-overlay admin-login-overlay" style={{
            background: 'rgba(5, 8, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000
          }}>
            <div className="glass-panel modal-panel admin-login-panel" style={{
              padding: '28px 20px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setIsAdminOpen(false)}
                className="modal-close-button"
                aria-label="Cerrar"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.4rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>

              <div className="reviews-grid" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(216, 165, 99, 0.3)'
                }}>
                  <Lock size={28} />
                </div>

                <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '4px', fontWeight: 700 }}>
                  Acceso al Panel
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Ingresá con tu email. Tu rol determina los permisos del panel.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '6px', fontWeight: 600 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      setPasswordError('');
                    }}
                    className="custom-input"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '6px', fontWeight: 600 }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Tu contraseña"
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="custom-input"
                    autoComplete="current-password"
                  />
                  {passwordError && (
                    <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '6px', fontWeight: 600 }}>
                      ⚠️ {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Ingresando…' : 'Ingresar al Panel ✨'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <AdminPanel
            settings={settings}
            services={services}
            gallery={gallery}
            bookings={bookings}
            reviews={reviews}
            userRole={userRole ?? 'staff'}
            onUpdateSettings={setSettings}
            onUpdateServices={setServices}
            onUpdateGallery={setGallery}
            onUpdateBookings={setBookings}
            onDeleteBooking={handleDeleteBookingFromDb}
            onUpdateBookingStatus={handleUpdateBookingStatusInDb}
            onUpdateReviews={setReviews}
            onClose={() => setIsAdminOpen(false)}
          />
        )
      )}
    </div>
  );
}
export default App;
