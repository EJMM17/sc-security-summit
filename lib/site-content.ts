// ─── Site-wide content constants ─────────────────────────────────────────────
// Single source of truth for all copy, names, and data.

export const EVENT = {
  title: "1ER SUMMIT DE SEGURIDAD EN LA CADENA DE SUMINISTROS",
  year: "2026",
  edition: "Primera Edición",
  tagline: "Cumplimiento Internacional · Estándares Globales · Seguridad Operativa",
  dates: "24 y 25 de Septiembre, 2026",
  datesShort: "SEP 24–25, 2026",
  venue: "Centro de Convenciones Reynosa",
  venueCity: "Reynosa, Tamaulipas",
  venueDetail: "A 10 minutos de la frontera",
  schedule: "08:00 – 18:00 hrs",
  contact: "Contacto@LanzLogistics.com",
  website: "www.scsecuritysummit.com",
} as const;

export const ORGANIZERS = {
  presented_by: ["Lanz Logistics", "Thynk Unlimited"],
  aval: "Avalado por cámaras industriales de Tamaulipas y Texas",
} as const;

// ─── Speakers ─────────────────────────────────────────────────────────────────
export const SPEAKERS = [
  {
    id: 1,
    name: "Fidel Guerrero",
    role: "Director General",
    org: "INDEX — Industria Maquiladora",
    topic: "Panorama Industrial del Norte de México",
    image: "/images/speaker-fidel-guerrero.jpg",
  },
  {
    id: 2,
    name: "Isidoro Juárez",
    role: "Mandatario Aduanal Certificado",
    org: "Especialista en Comercio Exterior",
    topic: "Operaciones Aduanales y Cumplimiento",
    image: "/images/speaker-isidoro-juarez.jpg",
  },
  {
    id: 3,
    name: "Julio César Suárez",
    role: "Director de Trade Compliance",
    org: "Sector Maquilador Transfronterizo",
    topic: "Certificaciones Internacionales y Estándares Globales",
    image: "/images/speaker-julio-suarez.jpg",
  },
  {
    id: 4,
    name: "Eduardo Luna",
    role: "Director de Innovación",
    org: "Tecnología y Seguridad Logística",
    topic: "Innovación Tecnológica en Supply Chain",
    image: "/images/speaker-eduardo-luna.jpg",
  },
] as const;

// ─── Pricing ──────────────────────────────────────────────────────────────────
export const PRICING = [
  {
    id: "estudiante",
    label: "Estudiante",
    price: 1200,
    currency: "MXN",
    note: "Requiere credencial vigente",
    featured: false,
    perks: [
      "Acceso general al evento",
      "Materiales digitales",
      "Coffee breaks incluidos",
      "Certificado de participación",
    ],
  },
  {
    id: "general",
    label: "General",
    price: 5800,
    currency: "MXN",
    note: "Acceso completo",
    featured: true,
    perks: [
      "Acceso a todas las sesiones",
      "Directorio de asistentes",
      "Almuerzo ejecutivo incluido",
      "Materiales impresos y digitales",
      "Certificado de participación",
    ],
  },
  {
    id: "vip",
    label: "VIP",
    price: 7200,
    currency: "MXN",
    note: "Experiencia premium",
    featured: false,
    perks: [
      "Todo lo de General",
      "Asiento preferencial front-row",
      "Cena de clausura ejecutiva",
      "Meet & Greet con ponentes",
      "Acceso a sala VIP",
    ],
  },
] as const;

// ─── Stats ────────────────────────────────────────────────────────────────────
export const STATS = [
  { value: "300+", label: "Asistentes Ejecutivos" },
  { value: "15+", label: "Horas de Networking" },
  { value: "20+", label: "Ponentes Expertos" },
  { value: "4", label: "Sectores Industriales" },
] as const;

// ─── Hub Features ─────────────────────────────────────────────────────────────
export const HUB_FEATURES = [
  {
    icon: "Handshake",
    title: "Vinculación B2B",
    desc: "Reuniones pre-agendadas con compradores, proveedores y operadores aduanales de la región fronteriza.",
  },
  {
    icon: "ShieldCheck",
    title: "Actualización Normativa",
    desc: "Estándares Globales de Seguridad 2026, Certificaciones Internacionales y Reconocimiento Mutuo. Lo que impacta tu operación hoy.",
  },
  {
    icon: "Network",
    title: "Networking Estratégico",
    desc: "Mesas de trabajo por sector, coffee breaks y cena de clausura para socios y patrocinadores.",
  },
  {
    icon: "TrendingUp",
    title: "Casos de Éxito Reales",
    desc: "Empresas que redujeron tiempos de cruce hasta un 40% implementando estándares globales.",
  },
] as const;

