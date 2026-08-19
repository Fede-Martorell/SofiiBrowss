import React, { useEffect, useState } from 'react';
import type { AppSettings, Service, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, CheckCircle2, MessageCircle, Sparkles, User, Phone, FileText } from 'lucide-react';

interface BookingModalProps {
  service: Service;
  settings: AppSettings;
  bookings?: Booking[];
  onClose: () => void;
  onConfirmBooking: (bookingData: { clientName: string; clientPhone: string; date: string; time: string; notes: string }) => Promise<boolean>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  settings,
  bookings = [],
  onClose,
  onConfirmBooking
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [occupiedTimes, setOccupiedTimes] = useState<{ time: string; duration: number }[]>([]);
  const [availabilityError, setAvailabilityError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setOccupiedTimes([]);
      return;
    }

    let cancelled = false;
    setAvailabilityError('');

    const loadAvailability = async () => {
      const { data, error } = await supabase.rpc('get_occupied_booking_times', {
        p_appointment_date: selectedDate,
      });

      if (cancelled) return;
      if (error) {
        console.error('Error cargando disponibilidad:', error);
        setAvailabilityError('No pudimos cargar los horarios ocupados. Probá nuevamente.');
        return;
      }

      setOccupiedTimes(
        ((data ?? []) as { appointment_time: string; duration_minutes: number }[])
          .map(slot => ({ time: slot.appointment_time, duration: slot.duration_minutes }))
      );
    };

    loadAvailability();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Generate available times based on custom service slots or duration
  const generateTimeSlots = () => {
    if (service.availableSlots && service.availableSlots.length > 0) {
      return service.availableSlots;
    }

    const slots = [];
    const stepMinutes = service.durationMinutes || 60;
    let currentMinutes = settings.workStartHour * 60;
    const endMinutes = settings.workEndHour * 60;

    while (currentMinutes + stepMinutes <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const formatted = `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
      slots.push(formatted);
      currentMinutes += stepMinutes;
    }

    return slots.length > 0 ? slots : ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];
  };

  const times = generateTimeSlots();

  // Helper to check if time is already booked for selected date (excluding cancelled)
  const isTimeBooked = (timeStr: string) => {
    if (!selectedDate) return false;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = hours * 60 + minutes;
    const end = start + service.durationMinutes;
    const overlaps = occupiedTimes.some(({ time, duration }) => {
      const [occupiedHours, occupiedMinutes] = time.split(':').map(Number);
      const occupiedStart = occupiedHours * 60 + occupiedMinutes;
      return start < occupiedStart + duration && occupiedStart < end;
    });
    return overlaps || bookings.some(b => b.date === selectedDate && b.time === timeStr && b.status !== 'cancelled');
  };

  // Las reservas se rigen por la hora local del estudio, no por UTC.
  const todayStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(now);

  const isTooSoon = (time: string) => {
    if (selectedDate !== todayStr) return false;
    const appointment = new Date(`${selectedDate}T${time}:00-03:00`);
    return appointment.getTime() < now.getTime() + 2 * 60 * 60 * 1000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !clientName || !clientPhone) return;
    if (selectedDate < todayStr || isTooSoon(selectedTime)) {
      setSubmitError('Los turnos deben solicitarse con al menos 2 horas de anticipación.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    const confirmed = await onConfirmBooking({
      clientName,
      clientPhone,
      date: selectedDate,
      time: selectedTime,
      notes
    });

    if (!confirmed) {
      setSubmitError('No pudimos registrar el turno. Revisá los datos o elegí otro horario.');
      setIsSubmitting(false);
      return;
    }

    // Send automatic background email notification if notificationEmail is set
    if (settings.notificationEmail) {
      try {
        fetch(`https://formsubmit.co/ajax/${settings.notificationEmail}`, {
          method: "POST",
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `✨ Nuevo Turno Reservado: ${clientName} (${service.name})`,
            Servicio: service.name,
            Fecha: selectedDate,
            Hora: `${selectedTime} hs`,
            Clienta: clientName,
            Telefono: clientPhone,
            Notas: notes || 'Sin notas'
          })
        }).catch(() => {});
      } catch (err) {
        console.error("Email notification dispatch error:", err);
      }
    }

    setStep(3); // Confirmation step
    setIsSubmitting(false);
  };

  const handleSendWhatsApp = () => {
    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const text = `¡Hola ${settings.businessName}! 👋 
Quisiera confirmar el turno que acabo de reservar en la web:

✨ *Servicio:* ${service.name}
📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${selectedTime} hs
👤 *Nombre:* ${clientName}
📱 *Teléfono:* ${clientPhone}
${notes ? `📝 *Nota:* ${notes}` : ''}

¿Me confirman la disponibilidad por favor? ¡Muchas gracias!`;

    const encodedText = encodeURIComponent(text);
    const cleanPhone = settings.phoneWhatsApp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  return (
    <div className="modal-overlay booking-modal-overlay" style={{
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000
    }}>
      <div className="glass-panel animate-fade-in modal-panel booking-modal-panel" style={{
        padding: '28px 22px',
        position: 'relative',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Close Button */}
        <button
          className="modal-close-button"
          onClick={onClose}
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

        {step !== 3 && (
          <div className="booking-modal-heading" style={{ marginBottom: '24px', paddingRight: '36px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(216, 165, 99, 0.15)',
              border: '1px solid rgba(216, 165, 99, 0.3)',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              Paso {step} de 2
            </span>
            <h2 style={{ fontSize: 'clamp(1.15rem, 4.5vw, 1.5rem)', color: 'var(--text-main)', fontWeight: 700, lineHeight: 1.25 }}>
              Reservar: {service.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Duración: {service.durationMinutes} min • ${service.price.toLocaleString('es-AR')}
            </p>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <Calendar size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--primary)' }} />
                Seleccioná una fecha
              </label>
              <input 
                type="date" 
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
                className="custom-input"
              />
            </div>

            {selectedDate && (
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--primary)' }} />
                  Seleccioná un horario disponible
                </label>
                <div className="booking-time-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '10px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {times.map((t) => {
                    const tooSoon = isTooSoon(t);
                    const booked = isTimeBooked(t) || tooSoon;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={booked}
                        onClick={() => setSelectedTime(t)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '8px',
                          border: booked ? '1px solid rgba(239, 68, 68, 0.2)' : selectedTime === t ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                          background: booked ? 'rgba(239, 68, 68, 0.1)' : selectedTime === t ? 'linear-gradient(135deg, #d8a563, #b87b32)' : 'var(--card-bg)',
                          color: booked ? '#fca5a5' : selectedTime === t ? '#ffffff' : 'var(--text-main)',
                          fontWeight: selectedTime === t ? 700 : 500,
                          cursor: booked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '0.85rem',
                          textDecoration: booked ? 'line-through' : 'none'
                        }}
                        title={tooSoon ? 'Disponible a partir de 2 horas de anticipación' : booked ? 'Este turno ya fue reservado' : 'Disponible'}
                      >
                        {t} hs {booked && <span style={{ fontSize: '0.7rem', display: 'block', textDecoration: 'none', color: '#f87171' }}>{tooSoon ? 'Con anticipación' : 'Ocupado'}</span>}
                      </button>
                    );
                  })}
                </div>
                {availabilityError && (
                  <p style={{ color: '#fca5a5', fontSize: '0.8rem', margin: '10px 0 0' }}>
                    {availabilityError}
                  </p>
                )}
                {selectedDate === todayStr && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '10px 0 0' }}>
                    Hoy solo se muestran horarios con al menos 2 horas de anticipación.
                  </p>
                )}
              </div>
            )}

            <button 
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(2)}
              className="btn-primary"
              style={{
                marginTop: '10px',
                width: '100%',
                justifyContent: 'center',
                opacity: (!selectedDate || !selectedTime) ? 0.5 : 1,
                cursor: (!selectedDate || !selectedTime) ? 'not-allowed' : 'pointer'
              }}
            >
              Continuar a tus datos →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <User size={15} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
                Nombre completo *
              </label>
              <input 
                type="text" 
                required
                placeholder="Ej: María García"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <Phone size={15} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
                Teléfono / WhatsApp *
              </label>
              <input 
                type="tel" 
                required
                placeholder="Ej: 11 9876-5432"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <FileText size={15} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
                Aclaración / Notas (Opcional)
              </label>
              <textarea 
                rows={3}
                placeholder="Ej: Tengo ojos sensibles, es mi primera vez..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="custom-textarea"
              />
            </div>

            <div className="modal-actions booking-form-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Volver
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando…' : 'Confirmar Reserva ✨'}
              </button>
            </div>
            {submitError && (
              <p style={{ color: '#fca5a5', fontSize: '0.84rem', margin: 0 }}>
                {submitError}
              </p>
            )}
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontSize: '1.6rem', marginBottom: '10px', color: 'var(--text-main)' }}>¡Turno Solicitado!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Registramos tu reserva para el <strong style={{ color: 'var(--text-main)' }}>{selectedDate}</strong> a las <strong style={{ color: 'var(--text-main)' }}>{selectedTime} hs</strong>.
            </p>

            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              marginBottom: '24px',
              textAlign: 'left',
              fontSize: '0.9rem',
              color: 'var(--text-main)'
            }}>
              <p style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
                <Sparkles size={16} /> ¡Paso Final Recomendado!
              </p>
              <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>
                Envíanos un WhatsApp ahora con 1 solo clic para notificarnos al instante y asegurar tu lugar rápidamente.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleSendWhatsApp}
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                <MessageCircle size={20} /> Avisar por WhatsApp Directo
              </button>

              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Turno: ${service.name} en ${settings.businessName}`)}&dates=${selectedDate.replace(/-/g, '')}T${selectedTime.replace(':', '')}00Z/${selectedDate.replace(/-/g, '')}T${(parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0')}${selectedTime.split(':')[1]}00Z&details=${encodeURIComponent(`Turno agendado para ${service.name} en ${settings.location}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ justifyContent: 'center', textDecoration: 'none', padding: '12px' }}
              >
                📅 Recordar en mi Google Calendar
              </a>

              <button
                className="btn-secondary"
                onClick={onClose}
                style={{ justifyContent: 'center' }}
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
