export interface Review {
  id: string;
  clientName: string;
  serviceName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verified: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: 'lashes' | 'brows' | 'combo';
  durationMinutes: number;
  price: number;
  description: string;
  image: string;
  images?: string[];
  popular?: boolean;
  availableSlots?: string[]; // e.g. ["10:00", "11:30", "15:00", "16:30"]
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'lashes' | 'brows';
  imageUrl: string;
  images?: string[];
  description?: string;
}

export interface AppSettings {
  businessName: string;
  tagline: string;
  phoneWhatsApp: string; // e.g. "5491112345678"
  instagram: string;
  location: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  workingDays: number[]; // 0: Sun, 1: Mon, ..., 6: Sat
  workStartHour: number; // e.g. 9
  workEndHour: number;   // e.g. 19
  appointmentDurationStep: number; // in mins, e.g. 60
  autoConfirmWhatsApp: boolean;
  adminPassword?: string;
  staffPassword?: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  businessName: "SofiiBrowss.studio",
  tagline: "Resalta tu belleza natural con la mirada perfecta",
  phoneWhatsApp: "5492615709144",
  instagram: "SofiiBrowss.studio",
  location: "Bustamante 319, Luján de Cuyo",
  primaryColor: "#d97706",
  secondaryColor: "#0f172a",
  accentColor: "#f59e0b",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  workStartHour: 10,
  workEndHour: 19,
  appointmentDurationStep: 60,
  autoConfirmWhatsApp: true,
  adminPassword: "47272278Sm@",
  staffPassword: "equipo"
};

export const INITIAL_SERVICES: Service[] = [
  {
    id: "1",
    name: "Lifting de Pestañas + Tinte",
    category: "lashes",
    durationMinutes: 60,
    price: 18000,
    description: "Curvatura y nutrición natural para tus pestañas de 4 a 6 semanas. Incluye tinte y tratamiento de keratina.",
    image: "https://images.unsplash.com/photo-1583001809873-a1284d563dbe?auto=format&fit=crop&w=800&q=80",
    popular: true
  },
  {
    id: "2",
    name: "Extensiones Pelo a Pelo (Clásicas)",
    category: "lashes",
    durationMinutes: 90,
    price: 24000,
    description: "Efecto rímel natural. Aplicación individual de fibra de seda de alta calidad sobre tu pestaña natural.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "3",
    name: "Volumen Ruso (2D-4D)",
    category: "lashes",
    durationMinutes: 120,
    price: 30000,
    description: "Abanicos hechos a mano para una mirada voluminosa, densa e impactante sin dañar tu pestaña.",
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
    popular: true
  },
  {
    id: "4",
    name: "Perfilado + Laminado de Cejas",
    category: "brows",
    durationMinutes: 60,
    price: 16000,
    description: "Redirecciona y fija el pelo de tus cejas logrando un look peinado, tupido y super prolijo.",
    image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80",
    popular: true
  },
  {
    id: "5",
    name: "Diseño & Depilación con Hilo + Henna",
    category: "brows",
    durationMinutes: 45,
    price: 14000,
    description: "Medición visagista según tu rostro y sombreado temporal con henna 100% orgánica.",
    image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "6",
    name: "Combo VIP: Lash Lifting + Laminado Cejas",
    category: "combo",
    durationMinutes: 100,
    price: 30000,
    description: "El combo perfecto para transformar tu mirada por completo en una sola sesión.",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
    popular: true
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: "g1",
    title: "Lifting de Pestañas",
    category: "lashes",
    imageUrl: "https://images.unsplash.com/photo-1583001809873-a1284d563dbe?auto=format&fit=crop&w=800&q=80",
    description: "Resultado inmediato, pestañas erguidas y con brillo natural."
  },
  {
    id: "g2",
    title: "Laminado de Cejas VIP",
    category: "brows",
    imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80",
    description: "Cejas enmarcadas y peinadas hacia arriba."
  },
  {
    id: "g3",
    title: "Volumen Ruso Efecto Moja",
    category: "lashes",
    imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
    description: "Textura y volumen personalizado."
  },
  {
    id: "g4",
    title: "Perfilado + Henna Organica",
    category: "brows",
    imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80",
    description: "Definición impecable del arco de la ceja."
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "r1",
    clientName: "Valentina M.",
    serviceName: "Lifting de Pestañas + Tinte",
    rating: 5,
    comment: "¡Increíble atención! Mis pestañas quedaron súper arqueadas y naturales. Sofi es una genia total, hiper delicada.",
    date: "Hace 2 días",
    verified: true
  },
  {
    clientName: "Lucía B.",
    id: "r2",
    serviceName: "Combo VIP: Lash Lifting + Laminado Cejas",
    rating: 5,
    comment: "El combo VIP superó todas mis expectativas. Salí del estudio sintiéndome una reina. ¡100% recomendada!",
    date: "Hace 4 días",
    verified: true
  },
  {
    id: "r3",
    clientName: "Mariana G.",
    serviceName: "Perfilado + Laminado de Cejas",
    rating: 5,
    comment: "Puntualidad, prolijidad y un espacio hermoso y súper relajante. El laminado me duró intacto semanas.",
    date: "Hace 1 semana",
    verified: true
  },
  {
    id: "r4",
    clientName: "Florencia K.",
    serviceName: "Volumen Ruso (2D-4D)",
    rating: 5,
    comment: "Tenia miedo de que me pesaran las pestañas y nada que ver, livianísimas y súper tupidas. ¡Excelente calidad!",
    date: "Hace 2 semanas",
    verified: true
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "b1",
    serviceId: "1",
    serviceName: "Lifting de Pestañas + Tinte",
    clientName: "Sofia Martínez",
    clientPhone: "+5491144445555",
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: "15:00",
    notes: "Primera vez en el estudio",
    status: "confirmed",
    createdAt: new Date().toISOString()
  },
  {
    id: "b2",
    serviceId: "6",
    serviceName: "Combo VIP: Lash Lifting + Laminado Cejas",
    clientName: "Camila Rodríguez",
    clientPhone: "+5491122223333",
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Day after tomorrow
    time: "11:00",
    notes: "Tiene evento el fin de semana",
    status: "pending",
    createdAt: new Date().toISOString()
  }
];
