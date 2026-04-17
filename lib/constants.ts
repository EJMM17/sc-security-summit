// ─── EVENT CONSTANTS ────────────────────────────────────────────────────────

export const EVENT = {
  name: "1er Summit de Seguridad en la Cadena de Suministros",
  year: "2026",
  shortName: "SC Security Summit 2026",
  dates: "24 & 25 de Septiembre, 2026",
  datesShort: "SEP 24–25 · 2026",
  venue: "Centro de Convenciones Reynosa",
  venueDetail: "A 10 min de la frontera",
  city: "Reynosa, Tamaulipas",
  schedule: "08:00 – 18:00 hrs",
  edition: "1RA EDICIÓN",
  contact: "Contacto@LanzLogistics.com",
} as const;

// ─── SPONSOR CONSTANTS ───────────────────────────────────────────────────────

export const SPONSORS = {
  presented_by: "Lanz Logistics",
  gold: ["Grupo TM", "Customs Pro MX"],
  silver: ["Aduana Digital", "LogiSec Solutions"],
} as const;

// ─── STATS ───────────────────────────────────────────────────────────────────

export const STATS = [
  { value: "300+", label: "Asistentes Ejecutivos", sublabel: "Directivos, Gerentes y Especialistas" },
  { value: "15+", label: "Horas de Networking", sublabel: "Sesiones estructuradas B2B" },
  { value: "20+", label: "Ponentes Expertos", sublabel: "Nacionales e Internacionales" },
] as const;

// ─── ROI REASONS ─────────────────────────────────────────────────────────────

export const ROI_REASONS = [
  {
    number: "01",
    title: "Decisores de alto nivel",
    desc: "El 78% de los asistentes tienen poder de compra o firma directa. Tu marca estará frente al C-Level y directores de operaciones.",
  },
  {
    number: "02",
    title: "Zona estratégica norte",
    desc: "Reynosa concentra el mayor corredor maquilador del noreste. Acceso directo al ecosistema industrial de Tamaulipas y Texas.",
  },
  {
    number: "03",
    title: "Visibilidad de marca antes, durante y después",
    desc: "Logotipo en materiales físicos, digitales, redes sociales, pantallas del evento y en el directorio oficial de patrocinadores.",
  },
  {
    number: "04",
    title: "Generación de leads calificados",
    desc: "Acceso a la lista de asistentes con cargo, empresa y sector. El lead más difícil de conseguir ya llegó al evento.",
  },
  {
    number: "05",
    title: "Asociación con autoridad del sector",
    desc: "Tu empresa aparece junto a organismos regulatorios, cámaras de comercio y líderes de la industria logística transfronteriza.",
  },
] as const;

// ─── FEATURE CARDS ───────────────────────────────────────────────────────────

export const FEATURE_CARDS = [
  {
    icon: "Handshake",
    title: "Vinculación B2B Directa",
    desc: "Reuniones pre-agendadas con compradores, proveedores y operadores de comercio exterior de la región.",
  },
  {
    icon: "Zap",
    title: "Actualización Normativa",
    desc: "Estándares Globales de Seguridad 2026, Certificaciones Internacionales, reconocimiento mutuo y cambios regulatorios que impactan tu operación hoy.",
  },
  {
    icon: "Coffee",
    title: "Networking Estructurado",
    desc: "Mesas de trabajo por sector, coffee breaks estratégicos y cena de clausura para socios fundadores.",
  },
  {
    icon: "Presentation",
    title: "Casos de Éxito Reales",
    desc: "Ponencias de empresas que ya implementaron estándares globales y redujeron tiempos de cruce en un 40%.",
  },
] as const;

// ─── SOCIAL PROOF ─────────────────────────────────────────────────────────────

export const SOCIAL_PROOF = [
  "Organizado por Lanz Logistics — 15 años en comercio exterior",
  "Avalado por cámaras industriales de Tamaulipas y Texas",
  "Más de 120 empresas registradas en preventa",
  "Ponentes confirmados del CBP, SAT y sector privado",
  "Sede certificada con capacidad para 400+ personas",
] as const;

// ─── PRECIOS ─────────────────────────────────────────────────────────────────

export const ACCESO_OPTIONS = [
  {
    value: "estudiante" as const,
    label: "ESTUDIANTE",
    price: "$1,200",
    currency: "MXN",
    note: "Requiere credencial vigente",
    perks: ["Acceso general al evento", "Materiales digitales", "Coffee breaks"],
  },
  {
    value: "general" as const,
    label: "GENERAL",
    price: "$5,800",
    currency: "MXN",
    note: "Acceso completo",
    perks: ["Acceso a todas las sesiones", "Directorio de asistentes", "Almuerzo incluido", "Materiales impresos"],
    popular: true,
  },
  {
    value: "vip" as const,
    label: "VIP",
    price: "$7,200",
    currency: "MXN",
    note: "Experiencia premium",
    perks: ["Todo lo de General", "Asiento preferencial", "Cena de clausura", "Meet & Greet con ponentes", "Certificado de participación"],
  },
] as const;
