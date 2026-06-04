// ─── Site-wide content constants ─────────────────────────────────────────────
// Single source of truth for all copy, names, and data.

export const BASE_URL = "https://scsecuritysummit.com" as const;

// FAQ items exported for FAQPage JSON-LD schema in layout.tsx
export const FAQ_SCHEMA_ITEMS = [
  {
    question: "¿Dónde y cuándo se llevará a cabo el Summit?",
    answer:
      "El Summit se realizará los días 24 y 25 de septiembre de 2026 en el Centro de Convenciones de Reynosa, Tamaulipas, México. Las actividades comienzan a las 8:00 AM y se extienden hasta las 7:00 PM cada día.",
  },
  {
    question: "¿A quién está dirigido este evento?",
    answer:
      "Está diseñado para profesionales y ejecutivos del sector de cadena de suministros: directores de operaciones, gerentes de logística, especialistas en comercio exterior, responsables de compliance, entre otros perfiles clave en la industria.",
  },
  {
    question: "¿Qué incluye cada tipo de acceso?",
    answer:
      "El acceso Estudiante incluye capacitación de 2 días, acceso a paneles y constancia digital. El acceso General agrega Business Hub B2B, kit estándar y coffee break. El acceso VIP incluye todo lo anterior más asientos prioritarios, constancia física, kit completo y plantillas descargables.",
  },
  {
    question: "¿Puedo obtener factura (CFDI)?",
    answer:
      "Sí. Al momento de tu registro puedes indicar que requieres factura y proporcionar tus datos fiscales. El CFDI se emitirá dentro de las 72 horas posteriores a la confirmación de tu pago.",
  },
  {
    question: "¿El acceso estudiantil requiere credencial?",
    answer:
      "Sí, es necesario presentar credencial vigente de la institución educativa al momento del check-in el día del evento. Este acceso es exclusivo para estudiantes activos de nivel licenciatura.",
  },
  {
    question: "¿Cómo puedo convertirme en patrocinador?",
    answer:
      "Contáctanos directamente a hola@scsecuritysummit.com o al +1 (956) 515-8070. Te enviaremos toda la información sobre nuestras oportunidades de patrocinio y los beneficios detallados para posicionar tu marca en el evento.",
  },
] as const;

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
  schedule: "08:00 – 19:00 hrs",
  contact: "hola@scsecuritysummit.com",
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
    topic: "Panorama Industrial del Norte de México",
    image: "/images/speaker-fidel.webp",
  },
  {
    id: 2,
    name: "Isidoro Juárez",
    role: "Mandatario Aduanal Certificado",
    topic: "Operaciones Aduanales y Cumplimiento",
    image: "/images/speaker-isidoro.webp",
  },
  {
    id: 3,
    name: "Julio César Suárez",
    role: "Director de Trade Compliance",
    topic: "Certificaciones Internacionales y Estándares Globales",
    image: "/images/speaker-julio.webp",
  },
  {
    id: 4,
    name: "Eduardo Luna",
    role: "Organización Operativa y Expansión Comercial",
    topic: "Organización & Expansión",
    image: "/images/speaker-eduardo.webp",
  },
] as const;

// ─── Pricing ──────────────────────────────────────────────────────────────────
export const PRICING = [
  {
    id: "estudiante",
    label: "Estudiante",
    price: 850,
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
    price: 2500,
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
    price: 4800,
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

// ─── Social Proof ─────────────────────────────────────────────────────────────
export const SOCIAL_PROOF = [
  "Organizado por Lanz Logistics — 15 años en comercio exterior",
  "Co-producido con Thynk Unlimited — Especialistas en eventos corporativos",
  "Avalado por cámaras industriales de Tamaulipas y Texas",
  "Más de 120 empresas registradas en preventa",
  "Ponentes confirmados del CBP, SAT y sector privado",
] as const;
