import React, { useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AppSettings, Booking, GalleryItem, Service, Review } from '../types';
import { uploadImage } from '../lib/queries';
import {
  Calendar,
  Settings as SettingsIcon,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Check,
  X,
  Clock,
  Phone,
  Palette,
  MessageSquare,
  Upload,
  ImagePlus,
  Star,
  LogOut,
  GripVertical
} from 'lucide-react';

interface AdminPanelProps {
  settings: AppSettings;
  services: Service[];
  gallery: GalleryItem[];
  bookings: Booking[];
  reviews?: Review[];
  userRole?: 'owner' | 'staff';
  onUpdateSettings: (newSettings: AppSettings) => void | Promise<void>;
  onUpdateServices: (newServices: Service[]) => void | Promise<boolean>;
  onUpdateGallery: (newGallery: GalleryItem[]) => void | Promise<void>;
  onUpdateBookings: (newBookings: Booking[]) => void;
  onDeleteBooking?: (id: string) => void;
  onUpdateBookingStatus?: (id: string, status: 'confirmed' | 'cancelled') => void;
  onUpdateReviews?: (newReviews: Review[]) => void;
  onLogout: () => void | Promise<void>;
  onClose: () => void;
}

interface SortableServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

const SortableServiceCard: React.FC<SortableServiceCardProps> = ({ service, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });

  return (
    <div
      ref={setNodeRef}
      className="glass-card"
      style={{
        padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1,
        boxShadow: isDragging ? '0 14px 30px rgba(0, 0, 0, 0.28)' : undefined,
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
        <button
          type="button"
          aria-label={`Mover ${service.name}`}
          title="Mantené y arrastrá para cambiar el orden"
          className="service-drag-handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} />
        </button>
        <img
          src={service.image}
          alt={service.name}
          style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
        />
        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}>{service.name}</h4>
          <p style={{
            background: 'linear-gradient(135deg, #f5d796 0%, #d8a563 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800,
            fontSize: '1.15rem', margin: '2px 0'
          }}>
            ${service.price.toLocaleString('es-AR')}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#e6d7c7' }}>⏱ {service.durationMinutes} min</p>
        </div>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{service.description}</p>
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button onClick={() => onEdit(service)} className="btn-secondary" style={{ flex: 1, padding: '6px', justifyContent: 'center', fontSize: '0.8rem' }}>
          <Edit3 size={14} /> Editar
        </button>
        <button onClick={() => onDelete(service.id)} className="btn-danger" style={{ padding: '6px 12px' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  services,
  gallery,
  bookings,
  reviews = [],
  userRole = 'owner',
  onUpdateSettings,
  onUpdateServices,
  onUpdateGallery,
  onUpdateBookings,
  onDeleteBooking,
  onUpdateBookingStatus,
  onUpdateReviews,
  onLogout,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'gallery' | 'reviews' | 'settings'>('bookings');
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
  const [tempSettings, setTempSettings] = useState<AppSettings>({ ...settings });
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceSaveError, setServiceSaveError] = useState('');
  const [isSavingServiceOrder, setIsSavingServiceOrder] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDeleteReview = (reviewId: string) => {
    if (onUpdateReviews) {
      onUpdateReviews(reviews.filter(r => r.id !== reviewId));
    }
  };

  const handleToggleVerifyReview = (reviewId: string) => {
    if (onUpdateReviews) {
      onUpdateReviews(reviews.map(r => r.id === reviewId ? { ...r, verified: !r.verified } : r));
    }
  };

  const handleBookingStatus = (booking: Booking, newStatus: 'confirmed' | 'cancelled') => {
    if (onUpdateBookingStatus) {
      onUpdateBookingStatus(booking.id, newStatus);
    } else {
      const updated = bookings.map(b => b.id === booking.id ? { ...b, status: newStatus } : b);
      onUpdateBookings(updated);
    }

    if (newStatus === 'confirmed') {
      const cleanPhone = booking.clientPhone.replace(/[^0-9]/g, '');
      const warmMessage = `¡Hola ${booking.clientName}! ✨💖
¡Qué alegría! Te confirmo que tu turno ya quedó súper reservado y agendado 🥰🌸

📌 *Detalles de tu cita:*
✨ *Tratamiento:* ${booking.serviceName}
📅 *Fecha:* ${booking.date}
⏰ *Hora:* ${booking.time} hs
📍 *Ubicación:* ${settings.location}

Te esperamos con los brazos abiertos para dejarte más hermosa aún. Si tenés alguna consulta previa o querés avisarnos algo, escribinos por acá. ¡Nos vemos pronto! 💅✨`;

      const encoded = encodeURIComponent(warmMessage);
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    }
  };

  const handleDeleteBooking = (id: string) => {
    if (confirm('¿Estás segura de eliminar este turno de la lista?')) {
      if (onDeleteBooking) {
        onDeleteBooking(id); // 👈 Llama a la función que borra en Supabase
      } else {
        onUpdateBookings(bookings.filter(b => b.id !== id));
      }
    }
  };

  // Helper to handle multiple image file selection (from phone/PC)
  const handleMultipleFilesUpload = async (
    files: FileList | null,
    currentImages: string[],
    setImages: (images: string[]) => void,
    folder: 'services' | 'gallery'
  ) => {
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    try {
      const urls = await Promise.all(Array.from(files).map(file => uploadImage(file, folder)));
      setImages([...currentImages, ...urls]);
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      alert('No se pudieron subir las imágenes. Verificá que el bucket media exista y que tengas permiso de dueña.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Service handlers
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name || !editingService?.price) return;

    const imagesList = editingService.images && editingService.images.length > 0
      ? editingService.images
      : editingService.image
        ? [editingService.image]
        : ['https://images.unsplash.com/photo-1583001809873-a1284d563dbe?auto=format&fit=crop&w=800&q=80'];

    const mainImage = imagesList[0];

    let nextServices: Service[];
    if (editingService.id) {
      // Update existing
      nextServices = services.map(s => s.id === editingService.id ? {
        ...(editingService as Service),
        image: mainImage,
        images: imagesList
      } : s);
    } else {
      // Create new
      const newService: Service = {
        id: Date.now().toString(),
        name: editingService.name || '',
        category: editingService.category || 'lashes',
        durationMinutes: editingService.durationMinutes || 60,
        price: Number(editingService.price) || 0,
        description: editingService.description || '',
        image: mainImage,
        images: imagesList,
        popular: editingService.popular || false
      };
      nextServices = [...services, newService];
    }
    setIsSavingService(true);
    setServiceSaveError('');
    try {
      const saved = await onUpdateServices(nextServices);
      if (saved === false) {
        setServiceSaveError('No pudimos guardar el servicio. No se cerró el formulario para que puedas reintentar.');
        return;
      }
      setEditingService(null);
    } catch (error) {
      console.error('Error guardando servicio:', error);
      setServiceSaveError('No pudimos guardar el servicio. Probá nuevamente.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm('¿Deseas eliminar este servicio?')) {
      onUpdateServices(services.filter(s => s.id !== id));
    }
  };

  const handleServiceDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || isSavingServiceOrder) return;
    const oldIndex = services.findIndex((service) => service.id === active.id);
    const newIndex = services.findIndex((service) => service.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setIsSavingServiceOrder(true);
    setServiceSaveError('');
    try {
      const saved = await onUpdateServices(arrayMove(services, oldIndex, newIndex));
      if (!saved) setServiceSaveError('No pudimos guardar el nuevo orden. Probá nuevamente.');
    } catch (error) {
      console.error('Error reordenando servicios:', error);
      setServiceSaveError('No pudimos guardar el nuevo orden. Probá nuevamente.');
    } finally {
      setIsSavingServiceOrder(false);
    }
  };

  // Gallery Handlers
  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGallery?.title) return;

    const imagesList = editingGallery.images && editingGallery.images.length > 0
      ? editingGallery.images
      : editingGallery.imageUrl
        ? [editingGallery.imageUrl]
        : ['https://images.unsplash.com/photo-1583001809873-a1284d563dbe?auto=format&fit=crop&w=800&q=80'];

    const mainUrl = imagesList[0];

    if (editingGallery.id) {
      onUpdateGallery(gallery.map(g => g.id === editingGallery.id ? {
        ...(editingGallery as GalleryItem),
        imageUrl: mainUrl,
        images: imagesList
      } : g));
    } else {
      const newItem: GalleryItem = {
        id: Date.now().toString(),
        title: editingGallery.title || '',
        category: editingGallery.category || 'lashes',
        imageUrl: mainUrl,
        images: imagesList,
        description: editingGallery.description || ''
      };
      onUpdateGallery([...gallery, newItem]);
    }
    setEditingGallery(null);
  };

  const handleDeleteGallery = (id: string) => {
    if (confirm('¿Deseas eliminar esta foto de la galería?')) {
      onUpdateGallery(gallery.filter(g => g.id !== id));
    }
  };

  // Settings Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    alert('¡Configuración guardada exitosamente!');
  };

  return (
    <div className="admin-shell" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '100%',
      height: '100dvh',
      background: 'var(--secondary)',
      backdropFilter: 'blur(16px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Admin */}
      <div className="admin-header-row" style={{
        padding: '14px 20px',
        background: 'var(--glass-bg)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f5d796 0%, #d8a563 50%, #b87b32 100%)',
            padding: '8px',
            borderRadius: '10px',
            color: '#1f1412',
            display: 'flex',
            flexShrink: 0
          }}>
            <Sparkles size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(0.95rem, 2.4vw, 1.2rem)', color: 'var(--text-main)', margin: 0, fontWeight: 700, lineHeight: 1.2 }}>
              {userRole === 'owner' ? 'Panel de Control (Dueña)' : 'Panel de Turnos (Equipo)'}
            </h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
              {userRole === 'owner'
                ? 'Gestioná turnos, catálogo, fotos y colores'
                : 'Consulta y confirmá los turnos agendados'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <X size={16} /> Cerrar panel
          </button>
          <button
            onClick={() => void onLogout()}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            title="Cerrar la sesión de este dispositivo"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Admin Area */}
      <div className="admin-main-container" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Navigation Sidebar */}
        <div className="admin-sidebar" style={{
          width: '220px',
          flexShrink: 0,
          background: 'var(--glass-bg)',
          borderRight: '1px solid var(--glass-border)',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: activeTab === 'bookings' ? '1px solid #d8a563' : 'none',
              background: activeTab === 'bookings' ? 'linear-gradient(135deg, #d8a563, #b87b32)' : 'transparent',
              color: activeTab === 'bookings' ? '#ffffff' : 'var(--text-main)',
              fontWeight: activeTab === 'bookings' ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.3s ease'
            }}
          >
            <Calendar size={18} /> Turnos Recibidos
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <span style={{
                background: '#f43f5e',
                color: '#fff',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                marginLeft: 'auto'
              }}>
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>

          {userRole === 'owner' && (
            <>
              <button
                onClick={() => setActiveTab('services')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'services' ? '1px solid #d8a563' : 'none',
                  background: activeTab === 'services' ? 'linear-gradient(135deg, #d8a563, #b87b32)' : 'transparent',
                  color: activeTab === 'services' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: activeTab === 'services' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                <Sparkles size={18} /> Servicios y Precios
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'gallery' ? '1px solid #d8a563' : 'none',
                  background: activeTab === 'gallery' ? 'linear-gradient(135deg, #d8a563, #b87b32)' : 'transparent',
                  color: activeTab === 'gallery' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: activeTab === 'gallery' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                <ImageIcon size={18} /> Fotos & Galería
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'reviews' ? '1px solid #d8a563' : 'none',
                  background: activeTab === 'reviews' ? 'linear-gradient(135deg, #d8a563, #b87b32)' : 'transparent',
                  color: activeTab === 'reviews' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: activeTab === 'reviews' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                <Star size={18} /> Reseñas & Opiniones
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: activeTab === 'settings' ? '1px solid #d8a563' : 'none',
                  background: activeTab === 'settings' ? 'linear-gradient(135deg, #d8a563, #b87b32)' : 'transparent',
                  color: activeTab === 'settings' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: activeTab === 'settings' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
              >
                <SettingsIcon size={18} /> Ajustes & Contacto
              </button>
            </>
          )}
        </div>

        {/* Content View */}
        <div className="admin-content" style={{ flex: 1, padding: '24px', overflowY: 'auto', minWidth: 0 }}>
          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div>
              <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>Gestión de Turnos</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total: {bookings.length} turnos</span>
              </div>

              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p>Aún no has recibido reservas.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="glass-panel"
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        borderColor: booking.status === 'confirmed' ? 'rgba(34, 197, 94, 0.4)' : 'var(--glass-border)'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', overflowWrap: 'anywhere' }}>{booking.clientName}</strong>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: booking.status === 'confirmed' ? 'rgba(34, 197, 94, 0.2)' : booking.status === 'cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                            color: booking.status === 'confirmed' ? '#16a34a' : booking.status === 'cancelled' ? '#dc2626' : '#d97706',
                            fontWeight: 700
                          }}>
                            {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                          </span>
                        </div>
                        <p style={{
                          background: 'linear-gradient(135deg, #f5d796 0%, #d8a563 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          margin: 0
                        }}>
                          {booking.serviceName}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} style={{ color: '#d8a563' }} /> {booking.date}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={14} style={{ color: '#d8a563' }} /> {booking.time} hs</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', overflowWrap: 'anywhere' }}><Phone size={14} style={{ color: '#d8a563' }} /> {booking.clientPhone}</span>
                        </div>
                        {booking.notes && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                            "{booking.notes}"
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                          href={`https://wa.me/${booking.clientPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 500,
                            minHeight: 36
                          }}
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </a>

                        {booking.status !== 'confirmed' && (
                          <button
                            onClick={() => handleBookingStatus(booking, 'confirmed')}
                            className="btn-secondary"
                            style={{
                              padding: '8px 12px',
                              color: '#4ade80',
                              borderColor: 'rgba(34,197,94,0.4)',
                              background: 'rgba(34, 197, 94, 0.15)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              minHeight: 36
                            }}
                            title="Confirmar y enviar WhatsApp cariñoso"
                          >
                            <Check size={16} /> Confirmar
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="btn-danger"
                          style={{ padding: '8px 12px', minHeight: 36, minWidth: 36 }}
                          title="Eliminar"
                          aria-label="Eliminar turno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div>
              <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>Servicios y Lista de Precios</h3>
                <button
                  onClick={() => { setServiceSaveError(''); setEditingService({ category: 'lashes', durationMinutes: 60, price: 15000, popular: false }); }}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                >
                  <Plus size={16} /> Agregar Servicio
                </button>
              </div>

              {/* Service Form modal overlay */}
              {editingService && (
                <div style={{
                  background: 'var(--secondary-card)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--primary)',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '16px' }}>
                    {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
                  </h4>
                  <form onSubmit={handleSaveService} className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nombre del servicio</label>
                      <input
                        type="text"
                        required
                        className="custom-input"
                        value={editingService.name || ''}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Categoría</label>
                      <select
                        className="custom-select"
                        value={editingService.category || 'lashes'}
                        onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                      >
                        <option value="lashes">Pestañas</option>
                        <option value="brows">Cejas</option>
                        <option value="combo">Combos VIP</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Precio ($ ARS)</label>
                      <input
                        type="number"
                        required
                        className="custom-input"
                        value={editingService.price || ''}
                        onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Duración por Turno (minutos entre cada cita)</label>
                      <select
                        className="custom-select"
                        value={editingService.durationMinutes || 60}
                        onChange={(e) => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                      >
                        <option value={30}>30 min (Express / Retoque)</option>
                        <option value={45}>45 min (Perfilado / Cejas)</option>
                        <option value={60}>60 min (1 Hora - Estándar)</option>
                        <option value={90}>90 min (1 Hora y Media)</option>
                        <option value={120}>120 min (2 Horas - Set Completo)</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        ⏰ Horarios Específicos para este Servicio (Opcional, separados por coma)
                      </label>
                      <input
                        type="text"
                        className="custom-input"
                        placeholder="Ej: 10:00, 11:30, 14:00, 15:30 (Si lo dejás en blanco se calculan según la duración)"
                        value={(editingService.availableSlots || []).join(', ')}
                        onChange={(e) => {
                          const slotsStr = e.target.value;
                          const slotsArr = slotsStr.split(',').map(s => s.trim()).filter(Boolean);
                          setEditingService({ ...editingService, availableSlots: slotsArr });
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        💡 Si el servicio dura 90 min (hora y media), podés poner horarios fijos como 10:00, 11:30, 13:00 o dejar que el sistema arme los bloques automáticamente.
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        Fotos del Trabajo (Carrusel de imágenes)
                      </label>

                      {/* File upload button */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                        <label
                          className="btn-primary"
                          style={{
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '8px 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={16} />
                          Cargar Fotos desde Celular / Galería
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const currentList = editingService.images && editingService.images.length > 0
                                ? editingService.images
                                : editingService.image ? [editingService.image] : [];
                              void handleMultipleFilesUpload(
                                e.target.files,
                                currentList,
                                (newList) => setEditingService({
                                  ...editingService,
                                  images: newList,
                                  image: newList[0] || editingService.image
                                }), 'services'
                              );
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Podés seleccionar varias fotos a la vez
                        </span>
                      </div>

                      {/* URL input fallback */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="url"
                          className="custom-input"
                          placeholder="O pegar URL de imagen extra..."
                          id="url-service-input"
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            const input = document.getElementById('url-service-input') as HTMLInputElement;
                            if (input && input.value) {
                              const currentList = editingService.images && editingService.images.length > 0
                                ? editingService.images
                                : editingService.image ? [editingService.image] : [];
                              const newList = [...currentList, input.value];
                              setEditingService({
                                ...editingService,
                                images: newList,
                                image: newList[0]
                              });
                              input.value = '';
                            }
                          }}
                        >
                          <ImagePlus size={14} /> Añadir URL
                        </button>
                      </div>

                      {/* Image Preview Grid */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {((editingService.images && editingService.images.length > 0)
                          ? editingService.images
                          : editingService.image ? [editingService.image] : []
                        ).map((imgUrl, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <img src={imgUrl} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = editingService.images && editingService.images.length > 0
                                  ? editingService.images
                                  : editingService.image ? [editingService.image] : [];
                                const filtered = currentList.filter((_, i) => i !== idx);
                                setEditingService({
                                  ...editingService,
                                  images: filtered,
                                  image: filtered[0] || ''
                                });
                              }}
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'rgba(239, 68, 68, 0.85)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                              title="Eliminar esta foto"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Descripción breve</label>
                      <textarea
                        rows={2}
                        className="custom-textarea"
                        value={editingService.description || ''}
                        onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" className="btn-primary" disabled={isUploadingImages || isSavingService}>
                        {isUploadingImages ? 'Subiendo fotos…' : isSavingService ? 'Guardando…' : 'Guardar Servicio'}
                      </button>
                      <button type="button" onClick={() => setEditingService(null)} className="btn-secondary">Cancelar</button>
                    </div>
                    {serviceSaveError && <p style={{ gridColumn: '1 / -1', color: '#fca5a5', fontSize: '0.85rem', margin: 0 }}>{serviceSaveError}</p>}
                  </form>
                </div>
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 14px' }}>
                Mantené presionado el ícono ⠿ y arrastrá cada tarjeta para elegir el orden en que se muestran los servicios.
                {isSavingServiceOrder ? ' Guardando orden…' : ''}
              </p>
              {serviceSaveError && <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 12px' }}>{serviceSaveError}</p>}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleServiceDragEnd}>
                <SortableContext items={services.map((service) => service.id)} strategy={rectSortingStrategy}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
                    {services.map((service) => (
                      <SortableServiceCard
                        key={service.id}
                        service={service}
                        onEdit={(selectedService) => { setServiceSaveError(''); setEditingService(selectedService); }}
                        onDelete={handleDeleteService}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div>
              <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Galería de Trabajos</h3>
                <button
                  onClick={() => setEditingGallery({ category: 'lashes', imageUrl: '', title: '' })}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                >
                  <Plus size={16} /> Subir Nueva Foto
                </button>
              </div>

              {editingGallery && (
                <div style={{
                  background: 'var(--secondary-card)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--primary)',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '16px' }}>
                    {editingGallery.id ? 'Editar Foto' : 'Agregar Foto al Portafolio'}
                  </h4>
                  <form onSubmit={handleSaveGallery} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Título o Trabajo</label>
                      <input
                        type="text"
                        required
                        className="custom-input"
                        placeholder="Ej: Lash Lifting Efecto Natural"
                        value={editingGallery.title || ''}
                        onChange={(e) => setEditingGallery({ ...editingGallery, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        Fotos del Trabajo (Cargar desde Celular o PC)
                      </label>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                        <label
                          className="btn-primary"
                          style={{
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '8px 14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={16} />
                          Seleccionar Fotos del Celular
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const currentList = editingGallery.images && editingGallery.images.length > 0
                                ? editingGallery.images
                                : editingGallery.imageUrl ? [editingGallery.imageUrl] : [];
                              void handleMultipleFilesUpload(
                                e.target.files,
                                currentList,
                                (newList) => setEditingGallery({
                                  ...editingGallery,
                                  images: newList,
                                  imageUrl: newList[0] || editingGallery.imageUrl
                                }), 'gallery'
                              );
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="url"
                          className="custom-input"
                          placeholder="O pegar URL de imagen..."
                          id="url-gallery-input"
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            const input = document.getElementById('url-gallery-input') as HTMLInputElement;
                            if (input && input.value) {
                              const currentList = editingGallery.images && editingGallery.images.length > 0
                                ? editingGallery.images
                                : editingGallery.imageUrl ? [editingGallery.imageUrl] : [];
                              const newList = [...currentList, input.value];
                              setEditingGallery({
                                ...editingGallery,
                                images: newList,
                                imageUrl: newList[0]
                              });
                              input.value = '';
                            }
                          }}
                        >
                          <ImagePlus size={14} /> Añadir URL
                        </button>
                      </div>

                      {/* Image Preview Grid */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {((editingGallery.images && editingGallery.images.length > 0)
                          ? editingGallery.images
                          : editingGallery.imageUrl ? [editingGallery.imageUrl] : []
                        ).map((imgUrl, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <img src={imgUrl} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = editingGallery.images && editingGallery.images.length > 0
                                  ? editingGallery.images
                                  : editingGallery.imageUrl ? [editingGallery.imageUrl] : [];
                                const filtered = currentList.filter((_, i) => i !== idx);
                                setEditingGallery({
                                  ...editingGallery,
                                  images: filtered,
                                  imageUrl: filtered[0] || ''
                                });
                              }}
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'rgba(239, 68, 68, 0.85)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="btn-primary" disabled={isUploadingImages}>
                        {isUploadingImages ? 'Subiendo fotos…' : 'Guardar Foto'}
                      </button>
                      <button type="button" onClick={() => setEditingGallery(null)} className="btn-secondary">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                {gallery.map((item) => (
                  <div key={item.id} className="glass-card" style={{ overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '12px' }}>
                      <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{item.title}</h4>
                      <button
                        onClick={() => handleDeleteGallery(item.id)}
                        className="btn-danger"
                        style={{ marginTop: '8px', width: '100%', padding: '6px', fontSize: '0.8rem' }}
                      >
                        Eliminar Foto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div>
              <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>Gestión de Reseñas de Clientas</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total: {reviews.length} opiniones</span>
              </div>

              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <Star size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p>Aún no hay reseñas enviadas.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                  {reviews.map((rev) => (
                    <div key={rev.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={14} style={{ color: '#d8a563', fill: '#d8a563' }} />
                            ))}
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: rev.verified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                            color: rev.verified ? '#16a34a' : '#d97706',
                            fontWeight: 700
                          }}>
                            {rev.verified ? '✓ Aprobada / Atendida' : 'Pendiente'}
                          </span>
                        </div>

                        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '10px' }}>
                          "{rev.comment}"
                        </p>

                        <div style={{ fontSize: '0.85rem' }}>
                          <strong style={{ color: 'var(--text-main)', display: 'block' }}>{rev.clientName}</strong>
                          <span style={{ color: '#d8a563', fontSize: '0.78rem' }}>{rev.serviceName}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                        <button
                          onClick={() => handleToggleVerifyReview(rev.id)}
                          className="btn-secondary"
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            justifyContent: 'center',
                            borderColor: rev.verified ? '#d8a563' : 'rgba(34,197,94,0.4)',
                            color: rev.verified ? 'var(--text-main)' : '#16a34a'
                          }}
                        >
                          {rev.verified ? 'Marcar Pendiente' : '✓ Aprobar Reseña'}
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="btn-danger"
                          style={{ padding: '6px 12px' }}
                          title="Eliminar Reseña"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '650px' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '20px' }}>Personalización & Contacto</h3>

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: '#d8a563', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Sparkles size={18} style={{ color: '#d8a563' }} /> Datos Principales
                  </h4>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Nombre del Emprendimiento / Marca</label>
                    <input
                      type="text"
                      className="custom-input"
                      value={tempSettings.businessName}
                      onChange={(e) => setTempSettings({ ...tempSettings, businessName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Eslogan o Subtítulo</label>
                    <input
                      type="text"
                      className="custom-input"
                      value={tempSettings.tagline}
                      onChange={(e) => setTempSettings({ ...tempSettings, tagline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: '#d8a563', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Clock size={18} style={{ color: '#d8a563' }} /> Configuración de Horarios de Atención
                  </h4>
                  <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Hora de Apertura (Ej: 9 hs)</label>
                      <input
                        type="number"
                        min={6}
                        max={22}
                        className="custom-input"
                        value={tempSettings.workStartHour}
                        onChange={(e) => setTempSettings({ ...tempSettings, workStartHour: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Hora de Cierre (Ej: 20 hs)</label>
                      <input
                        type="number"
                        min={7}
                        max={23}
                        className="custom-input"
                        value={tempSettings.workEndHour}
                        onChange={(e) => setTempSettings({ ...tempSettings, workEndHour: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: '#d8a563', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Phone size={18} style={{ color: '#d8a563' }} /> Contacto & Redes
                  </h4>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Número de WhatsApp (con código de país ej: 54911...)</label>
                    <input
                      type="text"
                      className="custom-input"
                      value={tempSettings.phoneWhatsApp}
                      onChange={(e) => setTempSettings({ ...tempSettings, phoneWhatsApp: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📩 Email para Recibir Notificaciones de Turnos Nuevos</label>
                    <input
                      type="email"
                      className="custom-input"
                      placeholder="Ej: sofia@gmail.com (Avisos automáticos al confirmarse turnos)"
                      value={tempSettings.notificationEmail || ''}
                      onChange={(e) => setTempSettings({ ...tempSettings, notificationEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Usuario de Instagram (sin @)</label>
                    <input
                      type="text"
                      className="custom-input"
                      value={tempSettings.instagram}
                      onChange={(e) => setTempSettings({ ...tempSettings, instagram: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dirección / Ubicación física</label>
                    <input
                      type="text"
                      className="custom-input"
                      value={tempSettings.location}
                      onChange={(e) => setTempSettings({ ...tempSettings, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={18} /> Paleta de Colores
                  </h4>
                  <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Color Principal</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="color"
                          value={tempSettings.primaryColor}
                          onChange={(e) => setTempSettings({ ...tempSettings, primaryColor: e.target.value })}
                          style={{ width: '40px', height: '40px', flexShrink: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          className="custom-input"
                          value={tempSettings.primaryColor}
                          onChange={(e) => setTempSettings({ ...tempSettings, primaryColor: e.target.value })}
                          style={{ minWidth: 0, flex: '1 1 100px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Color Secundario / Acento</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="color"
                          value={tempSettings.accentColor}
                          onChange={(e) => setTempSettings({ ...tempSettings, accentColor: e.target.value })}
                          style={{ width: '40px', height: '40px', flexShrink: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          className="custom-input"
                          value={tempSettings.accentColor}
                          onChange={(e) => setTempSettings({ ...tempSettings, accentColor: e.target.value })}
                          style={{ minWidth: 0, flex: '1 1 100px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '14px' }}>
                  Guardar Todos los Cambios ✨
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
