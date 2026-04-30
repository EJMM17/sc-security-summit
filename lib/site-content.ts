import { BASE_URL, CONTENT, PRECIOS, SPEAKERS } from "./content";

export { BASE_URL };

export const FAQ_SCHEMA_ITEMS = CONTENT.es.faq;

export const EVENT = {
  title: "1ER SUMMIT DE SEGURIDAD EN LA CADENA DE SUMINISTROS",
  year: "2026",
  edition: "Primera Edición",
  tagline: "Cumplimiento Internacional · Estándares Globales · Seguridad Operativa",
  dates: "24 de Septiembre, 2026",
  datesShort: "SEP 24, 2026",
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

export const PRICING = [
  {
    id: "estudiante",
    label: CONTENT.es.pricing.find((plan) => plan.id === "estudiante")!.label,
    price: PRECIOS.estudiante,
    currency: "MXN",
    note: "Requiere credencial vigente",
    featured: false,
    perks: [
      "Acceso a capacitación especializada",
      "Participación en paneles con expertos del sector",
      "Gafete de acceso",
      "Kit básico del participante",
      "Constancia de participación disponible con costo adicional",
    ],
  },
  {
    id: "general",
    label: CONTENT.es.pricing.find((plan) => plan.id === "general")!.label,
    price: PRECIOS.general,
    currency: "MXN",
    note: "Acceso completo",
    featured: true,
    perks: [
      "Acceso a capacitación especializada",
      "Participación en paneles con expertos de la industria",
      "Gafete de acceso",
      "Material impreso y kit del participante",
      "Constancia oficial de participación y DC-3",
      "Acceso al Business Hub y espacios de networking",
    ],
  },
  {
    id: "vip",
    label: CONTENT.es.pricing.find((plan) => plan.id === "vip")!.label,
    price: PRECIOS.vip,
    currency: "MXN",
    note: "Experiencia premium",
    featured: false,
    perks: [
      "Conferencias magistrales y sesiones especializadas",
      "Paneles con expertos de la industria",
      "Gafete de acceso, pulsera de acceso y registro oficial",
      "Kit de bienvenida premium",
      "Constancia oficial de participación y formato DC-3",
      "Ingreso al Business Hub para networking y vinculación empresarial",
      "Asiento preferente en las sesiones principales",
      "Acceso prioritario en filas, preguntas y actividades del Hub",
      "Material descargable, recursos y plantillas de trabajo",
      "Workshop especializado incluido",
      "Coffee break durante el evento",
    ],
  },
] as const;

export const STATS = [
  { value: "300+", label: "Asistentes Ejecutivos" },
  { value: "15+", label: "Horas de Networking" },
  { value: "20+", label: "Ponentes Expertos" },
  { value: "4", label: "Sectores Industriales" },
] as const;

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

export const SOCIAL_PROOF = [
  "Organizado por Lanz Logistics — 15 años en comercio exterior",
  "Co-producido con Thynk Unlimited — Especialistas en eventos corporativos",
  "Avalado por cámaras industriales de Tamaulipas y Texas",
  "Más de 120 empresas registradas en preventa",
  "Ponentes confirmados del CBP, SAT y sector privado",
] as const;

export const SPEAKERS_ES = SPEAKERS.es;
export const SPEAKERS_EN = SPEAKERS.en;
