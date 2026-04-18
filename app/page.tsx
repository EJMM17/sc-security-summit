"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Shield,
  MapPin,
  Calendar,
  Building2,
  Truck,
  Globe,
  ShieldCheck,
  ShoppingCart,
  Monitor,
  Eye,
  Satellite,
  ScanLine,
  BookOpen,
  CheckCircle2,
  Network,
  Handshake,
  ArrowRight,
  Star,
  Users,
  Clock,
  Award,
  Mail,
  Phone,
  ExternalLink,
  Mic2,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  Quote,
  Briefcase,
  Lightbulb,
  Compass,
  Crosshair,
} from "lucide-react";
import MobileNav from "@/components/MobileNav";
import RegistroForm from "@/components/RegistroForm";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import FAQAccordion from "@/components/FAQAccordion";
import HeaderScroll from "@/components/HeaderScroll";

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const NAV_LINKS = {
  es: [
    { href: "#enfoque", label: "Enfoque" },
    { href: "#speakers", label: "Conferencistas" },
    { href: "#agenda", label: "Agenda" },
    { href: "#audiencia", label: "Audiencia" },
    { href: "#accesos", label: "Accesos" },
    { href: "#patrocinadores", label: "Patrocinadores" },
    { href: "#ubicacion", label: "Ubicación" },
  ],
  en: [
    { href: "#enfoque", label: "Focus" },
    { href: "#speakers", label: "Speakers" },
    { href: "#agenda", label: "Agenda" },
    { href: "#audiencia", label: "Audience" },
    { href: "#accesos", label: "Passes" },
    { href: "#patrocinadores", label: "Sponsors" },
    { href: "#ubicacion", label: "Location" },
  ],
} as const;

const UI_TEXT = {
  es: {
    skipToForm: "Ir al formulario de registro",
    registerBtn: "REGISTRARME",
    dateLocation: "24 y 25 de septiembre, 2026 · Reynosa, Tamaulipas",
    heroAlt: "Summit de Seguridad en la Cadena de Suministros",
    heroTitlePrefix: "SUMMIT DE SEGURIDAD EN LA",
    heroTitleHighlight: "CADENA DE SUMINISTROS",
    heroDescription:
      "El encuentro donde convergen la actualización estratégica, la vinculación empresarial y las soluciones tecnológicas para fortalecer la industria del norte de México.",
    countdownLabel: "Faltan",
    registerNowBtn: "REGISTRARME AHORA",
    sponsorBtn: "PATROCINAR EL EVENTO",
  },
  en: {
    skipToForm: "Skip to registration form",
    registerBtn: "REGISTER",
    dateLocation: "September 24-25, 2026 · Reynosa, Tamaulipas",
    heroAlt: "Supply Chain Security Summit",
    heroTitlePrefix: "SECURITY SUMMIT FOR THE",
    heroTitleHighlight: "SUPPLY CHAIN",
    heroDescription:
      "Where strategic updates, business networking, and technology solutions come together to strengthen northern Mexico's industrial ecosystem.",
    countdownLabel: "Time left",
    registerNowBtn: "REGISTER NOW",
    sponsorBtn: "SPONSOR THE EVENT",
  },
} as const;

const HERO_STATS = [
  { number: 2, suffix: "", label: "Días de Capacitación" },
  { number: 4, suffix: "+", label: "Conferencistas Confirmados" },
  { number: 300, suffix: "", label: "Lugares Disponibles" },
  { number: 4, suffix: "", label: "Sectores Industriales" },
];

const PILARES = [
  {
    icon: ShieldCheck,
    title: "Actualización Estratégica",
    desc: "Accede a contenido de alto valor sobre certificaciones de seguridad, comercio exterior, gestión de riesgos y cumplimiento operativo con enfoque en estándares internacionales.",
    bullets: [
      "Tendencias y regulaciones vigentes",
      "Mejores prácticas internacionales",
      "Gestión de riesgos y controles",
    ],
    number: "01",
  },
  {
    icon: Network,
    title: "Soluciones e Innovación",
    desc: "Descubre tecnologías, herramientas y servicios especializados para la seguridad de tu cadena: trazabilidad, monitoreo inteligente y ciberseguridad aplicada.",
    bullets: [
      "Tecnologías de seguridad avanzada",
      "Monitoreo logístico en tiempo real",
      "Ciberseguridad para supply chain",
    ],
    number: "02",
  },
  {
    icon: Handshake,
    title: "Business Hub B2B",
    desc: "Conecta con empresas, especialistas y tomadores de decisión. Impulsa relaciones de negocio en el entorno aduanal y logístico del norte de México.",
    bullets: [
      "Networking dirigido por industria",
      "Generación de leads calificados",
      "Alianzas comerciales estratégicas",
    ],
    number: "03",
  },
];

const SPEAKERS = [
  {
    name: "Fidel Guerrero",
    role: "Subdirector, Comité Nacional de Aduanas y Comercio Exterior",
    org: "INDEX",
    topic: "Aduanas & Comercio Exterior",
    image: "/images/speaker-fidel.png",
  },
  {
    name: "Isidoro Juárez",
    role: "Mandatario Aduanal Certificado",
    org: "Especialista en Comercio Exterior",
    topic: "Aduanas & Compliance",
    image: "/images/speaker-isidoro.png",
  },
  {
    name: "Julio César Suárez",
    role: "Líder en Trade Compliance e Innovación",
    org: "Sector Automotriz e Industrial",
    topic: "Trade Compliance",
    image: "/images/speaker-julio.png",
  },
  {
    name: "Eduardo Luna",
    role: "Especialista en Innovación Estratégica",
    org: "Certificación Internacional en Enseñanza",
    topic: "Innovación & Aprendizaje",
    image: "/images/speaker-eduardo.png",
  },
];

const AGENDA_DIA1 = [
  { time: "08:00 — 09:00", title: "Registro y Welcome Coffee", type: "break" },
  { time: "09:00 — 09:30", title: "Ceremonia de Inauguración", type: "keynote" },
  { time: "09:30 — 10:30", title: "Panorama Actual de la Seguridad en Supply Chain", type: "keynote" },
  { time: "10:30 — 11:00", title: "Coffee Break & Networking", type: "break" },
  { time: "11:00 — 12:30", title: "Panel: Certificaciones Internacionales de Seguridad — Retos y Beneficios", type: "panel" },
  { time: "12:30 — 13:30", title: "Workshop: Gestión de Riesgos en Comercio Exterior", type: "workshop" },
  { time: "13:30 — 15:00", title: "Comida & Business Hub B2B", type: "break" },
  { time: "15:00 — 16:30", title: "Tecnologías de Trazabilidad y Monitoreo Logístico", type: "talk" },
  { time: "16:30 — 17:30", title: "Sesión de Networking Dirigida", type: "networking" },
];

const AGENDA_DIA2 = [
  { time: "08:30 — 09:00", title: "Welcome Coffee", type: "break" },
  { time: "09:00 — 10:30", title: "Trade Compliance: Normativas y Cumplimiento", type: "keynote" },
  { time: "10:30 — 11:00", title: "Coffee Break", type: "break" },
  { time: "11:00 — 12:00", title: "Ciberseguridad Aplicada a la Cadena de Suministros", type: "talk" },
  { time: "12:00 — 13:00", title: "Panel: Innovación y Aprendizaje Estratégico", type: "panel" },
  { time: "13:00 — 14:30", title: "Comida & Rondas B2B", type: "break" },
  { time: "14:30 — 16:00", title: "Workshops Simultáneos — Track A & B", type: "workshop" },
  { time: "16:00 — 17:00", title: "Ceremonia de Clausura y Reconocimientos", type: "keynote" },
];

const ASISTENTES = [
  { title: "Operaciones & Supply Chain", desc: "Directores, gerentes y coordinaciones", icon: Building2 },
  { title: "Logística & Transporte", desc: "Responsables de tráfico y distribución", icon: Truck },
  { title: "Aduanas & Comercio Exterior", desc: "Import-export y cumplimiento operativo", icon: Globe },
  { title: "Compliance & Seguridad", desc: "Seguridad patrimonial y control interno", icon: ShieldCheck },
  { title: "Abastecimiento & Compras", desc: "Decisores de compra y proveedores", icon: ShoppingCart },
  { title: "Sistemas & Tecnología", desc: "Monitoreo e innovación IT", icon: Monitor },
];

const PROVEEDORES = [
  { title: "Transportistas", icon: Truck },
  { title: "Agencias Aduanales", icon: Globe },
  { title: "Videovigilancia CCTV", icon: Eye },
  { title: "Telemetría GPS", icon: Satellite },
  { title: "Control de Acceso", icon: ScanLine },
  { title: "Consultoría", icon: BookOpen },
];

const PRICING = [
  {
    id: "estudiante",
    label: "Acceso Estudiante",
    price: "$1,200",
    featured: false,
    desc: "Perfil académico con credencial vigente",
    features: ["Capacitación 2 días", "Acceso a paneles", "Constancia digital", "Kit básico"],
  },
  {
    id: "general",
    label: "Acceso General",
    price: "$5,800",
    featured: true,
    desc: "Profesionales y operación",
    features: ["Capacitación 2 días", "Acceso a paneles", "Business Hub B2B", "Kit estándar", "Constancia digital", "Coffee break"],
  },
  {
    id: "vip",
    label: "Acceso VIP",
    price: "$7,200",
    featured: false,
    desc: "Ejecutivos y tomadores de decisión",
    features: ["Todo lo de General", "Asientos prioritarios", "Constancia física", "Kit completo", "Plantillas descargables", "Acceso total B2B"],
  },
];

const COMPARISON_ROWS = [
  { feature: "Acceso a capacitación (2 días)", vip: true, general: true, estudiante: true },
  { feature: "Acceso a paneles", vip: true, general: true, estudiante: true },
  { feature: "Nivel de Gafete", vip: "VIP Premium", general: "General", estudiante: "Básico" },
  { feature: "Kit Operativo", vip: "Completo", general: "Estándar", estudiante: "Mínimo" },
  { feature: "Constancia Oficial", vip: "Física", general: "Digital", estudiante: "Digital" },
  { feature: "Business Hub B2B", vip: "Acceso Total", general: true, estudiante: false },
  { feature: "Asientos Prioritarios", vip: true, general: false, estudiante: false },
  { feature: "Plantillas Descargables", vip: true, general: false, estudiante: false },
  { feature: "Coffee Break", vip: true, general: false, estudiante: false },
];

const SPONSORS = [
  {
    tier: "Patrocinador Platino",
    slots: "Disponibilidad limitada · 8 espacios",
    stand: "Stand 5×6m",
    benefits: [
      "Stand Premium en ubicación privilegiada (5m × 6m)",
      "Logo en material impreso y digital (flyers, banners, sitio web, redes sociales)",
      "Mención destacada en inauguración y clausura del evento",
      "Espacio de presentación comercial ante la audiencia (5 min)",
      "5 accesos VIP a conferencias",
      "Inclusión de material promocional en el kit de bienvenida",
      "Publicación destacada en redes sociales y mailing",
      "Acceso a actividades de vinculación con compradores y autoridades",
      "Directorio de visitantes y contactos potenciales",
      "Coffee break con servicio en el lugar",
      "Reel publicitario en pantallas",
    ],
  },
  {
    tier: "Patrocinador Oro",
    slots: "Disponibilidad limitada · 10 espacios",
    stand: "Stand 4×4m",
    benefits: [
      "Stand en área central del evento (4m × 4m)",
      "Logo en material impreso y digital",
      "Mención durante la inauguración",
      "3 accesos VIP a conferencias",
      "Publicación en redes sociales y mailing",
      "Oportunidad de distribuir material promocional",
    ],
  },
  {
    tier: "Patrocinador Plata",
    slots: "Disponibilidad limitada · 14 espacios",
    stand: "Stand 3×3m",
    benefits: [
      "Stand estándar en área de exhibición (3m × 3m)",
      "Logo en material digital (sitio web, redes sociales)",
      "2 accesos VIP a conferencias",
      "Publicación en redes sociales",
    ],
  },
  {
    tier: "Proveedor Aliado Estratégico",
    slots: "Categoría especial · 16 espacios",
    stand: "Stand 3×3m",
    benefits: [
      "Stand 3×3m en zona de proveedores",
      "1 acceso a conferencias incluido",
      "Inclusión en directorio de soluciones",
      'Badge "Proveedor Recomendado" en materiales del evento',
      "Diseñado para proveedores especializados en certificaciones de seguridad",
    ],
  },
];

const VALUE_HIGHLIGHTS = [
  "Contenido especializado con aplicación directa en tu operación diaria",
  "Networking estratégico con más de 300 profesionales de la industria",
  "Acceso a soluciones tecnológicas de vanguardia en seguridad y logística",
  "Vinculación directa con tomadores de decisión y compradores",
  "Certificaciones y estándares internacionales con enfoque práctico",
  "Workshops y paneles dirigidos por expertos con experiencia real",
  "Business Hub B2B para generación de alianzas comerciales",
  "Perspectiva binacional para impulsar el comercio seguro y eficiente",
];

const WHY_ATTEND = [
  {
    icon: BookOpen,
    title: "Actualización Estratégica",
    desc: "Temas actuales y especializados sobre seguridad, logística, comercio exterior y cumplimiento.",
  },
  {
    icon: Mic2,
    title: "Expertos del Sector",
    desc: "Speakers y panelistas con experiencia práctica en operaciones, compliance y estrategia.",
  },
  {
    icon: Target,
    title: "Impacto Real",
    desc: "Ideas, herramientas y contactos que pueden traducirse en mejoras concretas para tu empresa.",
  },
  {
    icon: Globe,
    title: "Visión Binacional y Comercial",
    desc: "Perspectiva binacional para impulsar comercio, colaboración y crecimiento.",
  },
];

const FAQ_ITEMS = [
  {
    question: "¿Dónde y cuándo se llevará a cabo el Summit?",
    answer: "El Summit se realizará los días 24 y 25 de septiembre de 2026 en el Centro de Convenciones de Reynosa, Tamaulipas, México. Las actividades comienzan a las 8:00 AM y se extienden hasta las 5:30 PM cada día.",
  },
  {
    question: "¿A quién está dirigido este evento?",
    answer: "Está diseñado para profesionales y ejecutivos del sector de cadena de suministros: directores de operaciones, gerentes de logística, especialistas en comercio exterior, responsables de compliance, entre otros perfiles clave en la industria.",
  },
  {
    question: "¿Qué incluye cada tipo de acceso?",
    answer: "El acceso Estudiante incluye capacitación de 2 días, acceso a paneles y constancia digital. El acceso General agrega Business Hub B2B, kit estándar y coffee break. El acceso VIP incluye todo lo anterior más asientos prioritarios, constancia física, kit completo y plantillas descargables.",
  },
  {
    question: "¿Puedo obtener factura (CFDI)?",
    answer: "Sí. Al momento de tu registro puedes indicar que requieres factura y proporcionar tus datos fiscales. El CFDI se emitirá dentro de las 72 horas posteriores a la confirmación de tu pago.",
  },
  {
    question: "¿El acceso estudiantil requiere credencial?",
    answer: "Sí, es necesario presentar credencial vigente de la institución educativa al momento del check-in el día del evento. Este acceso es exclusivo para estudiantes activos de nivel licenciatura o posgrado.",
  },
  {
    question: "¿Cómo puedo convertirme en patrocinador?",
    answer: "Contáctanos directamente a Contacto@LanzLogistics.com o al +1 (956) 515-8070. Te enviaremos el kit de patrocinio con los diferentes niveles de participación (Platino, Oro, Plata y Proveedor Aliado Estratégico) y los beneficios detallados de cada uno.",
  },
];

const FAQ_ITEMS_EN = [
  {
    question: "Where and when will the Summit take place?",
    answer: "The Summit will be held on September 24 and 25, 2026, at the Reynosa Convention Center in Reynosa, Tamaulipas, Mexico. Activities begin at 8:00 AM and run through 5:30 PM each day.",
  },
  {
    question: "Who is this event designed for?",
    answer: "It is designed for supply chain professionals and executives: operations directors, logistics managers, foreign trade specialists, compliance leaders, and other key industry profiles.",
  },
  {
    question: "What is included with each access type?",
    answer: "Student access includes 2-day training, panel access, and a digital certificate. General access adds Business Hub B2B, a standard kit, and coffee break. VIP includes all of the above plus priority seating, printed certificate, full kit, and downloadable templates.",
  },
  {
    question: "Can I request an invoice (CFDI)?",
    answer: "Yes. During registration you can indicate that you need an invoice and submit your tax details. The CFDI will be issued within 72 hours after payment confirmation.",
  },
  {
    question: "Does the student pass require an ID?",
    answer: "Yes, you must present a valid student ID from your institution during event check-in. This pass is only for active undergraduate or graduate students.",
  },
  {
    question: "How can I become a sponsor?",
    answer: "Contact us at Contacto@LanzLogistics.com or +1 (956) 515-8070. We will send the sponsorship kit with participation levels (Platinum, Gold, Silver, and Strategic Allied Provider) and the benefits for each tier.",
  },
];

/* ═══ WAVE SVG COMPONENT ═══ */
function WaveSeparator({ color = "#EFF6FF", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div className={`wave-separator ${flip ? "wave-separator-flip" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,40 1440,30 L1440,80 L0,80 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

/* ═══ AGENDA TYPE BADGE ═══ */
function AgendaBadge({ type, language }: { type: string; language: "es" | "en" }) {
  const styles: Record<string, string> = {
    keynote: "bg-blue-100 text-blue-700",
    panel: "bg-indigo-100 text-indigo-700",
    workshop: "bg-cyan-100 text-cyan-700",
    talk: "bg-sky-100 text-sky-700",
    networking: "bg-emerald-100 text-emerald-700",
    break: "bg-slate-100 text-slate-500",
  };
  const labelsByLanguage: Record<"es" | "en", Record<string, string>> = {
    es: {
      keynote: "Conferencia Magistral",
      panel: "Panel",
      workshop: "Taller",
      talk: "Conferencia",
      networking: "Networking",
      break: "Receso",
    },
    en: {
      keynote: "Keynote",
      panel: "Panel",
      workshop: "Workshop",
      talk: "Talk",
      networking: "Networking",
      break: "Break",
    },
  };
  const labels = labelsByLanguage[language];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[type] || styles.break}`}>
      {labels[type] || type}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const [language, setLanguage] = useState<"es" | "en">("es");

  useEffect(() => {
    const saved = window.localStorage.getItem("scss-language");
    if (saved === "es" || saved === "en") {
      setLanguage(saved);
      return;
    }
    setLanguage(window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("scss-language", language);
  }, [language]);

  const navLinks = NAV_LINKS[language];
  const text = UI_TEXT[language];

  return (
    <>
      {/* ── SKIP TO CONTENT (accesibilidad) ── */}
      <a
        href="#registro"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        {text.skipToForm}
      </a>

      {/* ── HEADER ─────────────────────────── */}
      <HeaderScroll>
        <header className="fixed top-0 w-full z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[62px] sm:h-[68px] flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <a href="#" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-oswald block truncate text-base sm:text-lg font-bold tracking-tight text-slate-900">SC SUMMIT</span>
                <span className="hidden sm:block text-[10px] font-bold tracking-[0.18em] text-blue-600">REYNOSA 2026</span>
              </div>
            </a>

            {/* Nav Desktop */}
            <nav className="hidden lg:flex items-center gap-4">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="nav-link">
                  {l.label}
                </a>
              ))}
            </nav>

            {/* CTA + Mobile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLanguage((prev) => (prev === "es" ? "en" : "es"))}
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label={language === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
              >
                {language === "es" ? "EN" : "ES"}
              </button>
              <a href="#registro" className="btn-primary hidden md:inline-flex text-sm">
                {text.registerBtn} <ArrowRight className="w-4 h-4" />
              </a>
              <MobileNav language={language} />
            </div>
          </div>
        </header>
      </HeaderScroll>

      <div className="pt-[62px] sm:pt-[68px]">
        {/* ═══════════════════════════════════════════════════════════
            1. HERO — with background image
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative w-full min-h-[90vh] sm:min-h-[92vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <Image
            src="/images/hero-bg.png"
            alt={text.heroAlt}
            fill
            className="object-cover"
            priority
            quality={85}
          />
          {/* Gradient Overlay */}
          <div className="hero-image-overlay" />

          {/* Floating decorative elements */}
          <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
            <div className="absolute top-[20%] left-[8%] w-20 h-20 border border-white/10 rounded-2xl float-shape" />
            <div className="absolute top-[30%] right-[12%] w-16 h-16 border border-cyan-400/15 rounded-full float-shape-reverse" />
            <div className="absolute bottom-[25%] left-[15%] w-12 h-12 border border-blue-400/10 rounded-lg float-shape" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-[20%] right-[8%] w-24 h-24 border border-white/5 rounded-3xl float-shape-reverse" style={{ animationDelay: "1s" }} />
            {/* Grid subtle pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px"
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 pt-6 pb-10 sm:py-0 max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="inline-flex w-full sm:w-auto max-w-full flex-wrap items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-full px-3 sm:px-5 py-2.5 mb-6 sm:mb-8">
                <Calendar className="w-4 h-4 text-cyan-300" />
                <span className="text-xs sm:text-sm text-white/90 font-medium">
                  {text.dateLocation}
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="font-oswald text-[2rem] sm:text-5xl md:text-7xl font-bold text-white leading-[1.08] mb-5 sm:mb-6">
                {text.heroTitlePrefix}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                  {text.heroTitleHighlight}
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-base sm:text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-7 sm:mb-8 leading-relaxed">
                {text.heroDescription}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="card-dark p-6 sm:p-8 mb-8 inline-flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold tracking-widest uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{text.countdownLabel}</span>
                </div>
                <CountdownTimer language={language} />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                <a href="#registro" className="btn-primary px-8 py-4 text-base w-full sm:w-auto">
                  {text.registerNowBtn} <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#patrocinadores" className="btn-outline px-8 py-4 text-base border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  {text.sponsorBtn}
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            2. SOCIAL PROOF BAR
           ═══════════════════════════════════════════════════════════ */}
        <section className="py-8 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {HERO_STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <AnimatedCounter target={s.number} className="number-accent text-3xl sm:text-4xl" />
                  {s.suffix && <span className="number-accent text-2xl">{s.suffix}</span>}
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">
                  {s.label}
                </p>
              </div>
            ))}
            <div className="hidden sm:block text-center border-l border-slate-200 pl-8">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Presentado por</p>
              <p className="font-bold text-slate-700 text-sm mt-1">Lanz Logistics <span className="text-blue-500">+</span> Thynk Unlimited</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. ¿POR QUÉ ASISTIR? — Zig-Zag Layout
           ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="accent-line" />
                  <span className="section-label">PORQUE SER PARTE DEL SUMMIT</span>
                  <div className="accent-line" />
                </div>
                <h2 className="section-title">Lo Que Te Espera</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4 text-lg">
                  Más que un congreso. Una experiencia de capacitación, networking e innovación
                  diseñada para transformar tu operación.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-6">
              {WHY_ATTEND.map((item, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="group relative p-8 rounded-2xl border border-slate-100 bg-white hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-500 hover:shadow-lg">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-oswald text-xl font-bold text-slate-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            VISIÓN & MISIÓN
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 py-20 sm:py-28 overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }} />
          <div className="absolute top-10 right-10 w-40 h-40 border border-white/5 rounded-full float-shape" />
          <div className="absolute bottom-10 left-10 w-28 h-28 border border-cyan-400/8 rounded-2xl float-shape-reverse" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
                  <Compass className="w-3.5 h-3.5 text-cyan-300" /> PROPÓSITO
                </span>
                <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Visión y Misión
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              {/* MISIÓN */}
              <ScrollReveal>
                <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <Crosshair className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-oswald text-2xl font-bold text-white">Misión</h3>
                  </div>
                  <div className="space-y-4 text-blue-100/75 text-sm leading-relaxed">
                    <p>
                      Reunir en un solo espacio a los sectores clave de la cadena de suministro para fortalecer las estrategias de seguridad, compartir mejores prácticas, difundir actualizaciones relevantes en certificaciones internacionales, y generar oportunidades de vinculación estratégica entre empresas, especialistas y proveedores de soluciones.
                    </p>
                    <p>
                      Nuestra misión es impulsar el desarrollo de cadenas de suministro más seguras, informadas y competitivas, mediante experiencias de alto valor como conferencias, paneles, talleres y networking especializado.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* VISIÓN */}
              <ScrollReveal delay={200}>
                <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-oswald text-2xl font-bold text-white">Visión</h3>
                  </div>
                  <div className="space-y-4 text-blue-100/75 text-sm leading-relaxed">
                    <p>
                      Ser el Summit líder en el norte de México en temas de seguridad en la cadena de suministro, comercio exterior, logística y cumplimiento normativo, reconocido por conectar a empresas, expertos y proveedores estratégicos en un ecosistema de aprendizaje, innovación y crecimiento colaborativo.
                    </p>
                    <p>
                      Aspiramos a consolidarnos como el evento de referencia para impulsar una cultura de prevención, cumplimiento y excelencia operativa que fortalezca el comercio seguro y eficiente a nivel regional y binacional.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Acerca del evento (About) */}
            <ScrollReveal delay={300}>
              <div className="mt-12 p-8 sm:p-10 rounded-2xl bg-white/[0.04] border border-white/8 text-center max-w-4xl mx-auto">
                <p className="text-blue-100/70 text-sm leading-relaxed">
                  El 1er Summit de Seguridad en la Cadena de Suministro es un espacio especializado creado para reunir a los principales actores de la industria maquiladora, transporte, aduanas, seguridad y compliance, con el propósito de fortalecer la seguridad, la eficiencia y la competitividad del comercio en la región. A través de conferencias, paneles, workshops y espacios de vinculación comercial como el Business Hub, buscamos impulsar alianzas estratégicas, promover soluciones de alto impacto y contribuir al desarrollo de una cadena de suministro más segura, resiliente y eficiente.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Wave → */}
        <WaveSeparator color="#F8FAFC" />

        {/* ═══════════════════════════════════════════════════════════
            4. 3 EJES TEMÁTICOS — Numbered Cards
           ═══════════════════════════════════════════════════════════ */}
        <section id="enfoque" className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label">EJES TEMÁTICOS</span>
                <h2 className="section-title mt-3">Tres Pilares, Un Objetivo</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  Cada eje del Summit fue diseñado para cubrir las necesidades reales
                  de los profesionales de la cadena de suministros.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-8">
              {PILARES.map((p, i) => (
                <ScrollReveal key={i} delay={i * 150}>
                  <div className="card-elevated p-8 h-full group">
                    {/* Big number */}
                    <span className="number-accent text-6xl font-oswald font-bold opacity-20 group-hover:opacity-40 transition-opacity">{p.number}</span>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                      <p.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-oswald text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-5">{p.desc}</p>
                    <ul className="space-y-2">
                      {p.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Wave → */}
        <WaveSeparator color="#FFFFFF" flip />

        {/* ═══════════════════════════════════════════════════════════
            5. CONFERENCISTAS — with real photos
           ═══════════════════════════════════════════════════════════ */}
        <section id="speakers" className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label flex items-center justify-center gap-2">
                  <Mic2 className="w-4 h-4" /> CONFERENCISTAS CONFIRMADOS
                </span>
                <h2 className="section-title mt-3">Especialistas de Primer Nivel</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  Líderes en estándares internacionales, comercio exterior, cumplimiento operativo e
                  innovación estratégica.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {SPEAKERS.map((s, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="speaker-card group text-center">
                    {/* Photo */}
                    <div className="relative w-44 h-44 mx-auto mb-5 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/10 group-hover:shadow-blue-500/20 transition-shadow">
                      <Image
                        src={s.image}
                        alt={s.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Topic badge */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-blue-900/90 to-transparent pt-8 pb-3 px-3">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">{s.topic}</span>
                      </div>
                    </div>

                    <h3 className="font-oswald text-lg font-bold text-slate-900">{s.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-snug">{s.role}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">{s.org}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={500}>
              <p className="text-center text-sm text-slate-400 mt-12">
                Más conferencistas serán anunciados pronto.{" "}
                <a href="#registro" className="text-blue-600 font-semibold hover:underline">
                  Regístrate para recibirlos primero →
                </a>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            6. VALOR DEL EVENTO — Bullet Points + Perfil de Asistentes
           ═══════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Left: Bullet Points (3 cols) */}
              <div className="lg:col-span-3">
                <ScrollReveal>
                  <span className="section-label">LO QUE OBTENDRÁS</span>
                  <h2 className="section-title mt-3 mb-8">Valor Real Para Tu Empresa</h2>
                </ScrollReveal>
                <ScrollReveal delay={100}>
                  <div className="space-y-3">
                    {VALUE_HIGHLIGHTS.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[15px] text-slate-700 font-medium leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              {/* Right: Perfil de Asistentes (2 cols) */}
              <div className="lg:col-span-2">
                <ScrollReveal delay={200}>
                  <div className="sticky top-24 p-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-oswald text-xl font-bold text-slate-900">Perfil de Asistentes</h3>
                    </div>
                    <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                      Personal de la industria maquiladora, transportistas, agencias aduanales,
                      compliance y seguridad de cadena de suministro.
                    </p>
                    <div className="space-y-3">
                      {ASISTENTES.slice(0, 4).map((a, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                          <a.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="font-medium">{a.title}</span>
                        </div>
                      ))}
                    </div>
                    <a href="#registro" className="btn-primary w-full mt-8 py-3 text-sm justify-center">
                      Registrarme Ahora <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* Wave → */}
        <WaveSeparator color="#FFFFFF" />

        {/* ═══════════════════════════════════════════════════════════
            7. AGENDA / PROGRAMA — Timeline
           ═══════════════════════════════════════════════════════════ */}
        <section id="agenda" className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label">AGENDA DEL EVENTO</span>
                <h2 className="section-title mt-3">Programa Preliminar</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  Dos días intensivos de capacitación, paneles de expertos, workshops prácticos y
                  sesiones de networking dirigidas.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Día 1 */}
              <ScrollReveal>
                <div className="card-elevated p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-oswald text-xl font-bold text-slate-900">Día 1</h3>
                      <p className="text-xs text-slate-400">Miércoles, 24 de septiembre</p>
                    </div>
                  </div>
                  <div>
                    {AGENDA_DIA1.map((item, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-xs font-mono text-blue-600 font-semibold whitespace-nowrap">{item.time}</span>
                          <AgendaBadge type={item.type} language={language} />
                        </div>
                        <p className="text-sm text-slate-700 font-medium mt-1">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Día 2 */}
              <ScrollReveal delay={200}>
                <div className="card-elevated p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-oswald text-xl font-bold text-slate-900">Día 2</h3>
                      <p className="text-xs text-slate-400">Jueves, 25 de septiembre</p>
                    </div>
                  </div>
                  <div>
                    {AGENDA_DIA2.map((item, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-xs font-mono text-blue-600 font-semibold whitespace-nowrap">{item.time}</span>
                          <AgendaBadge type={item.type} language={language} />
                        </div>
                        <p className="text-sm text-slate-700 font-medium mt-1">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={300}>
              <p className="text-center text-xs text-slate-400 mt-8">
                * Programa sujeto a ajustes menores. La agenda final se publicará 30 días antes del evento.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            8. AUDIENCIA + PROVEEDORES
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#F8FAFC" />
        <section id="audiencia" className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label">PARTICIPANTES</span>
                <h2 className="section-title mt-3">¿A Quién Va Dirigido?</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  Para quienes mueven, protegen y fortalecen la cadena de suministro. Un punto de
                  encuentro para líderes y especialistas en áreas clave.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
              {ASISTENTES.map((a, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <div className="flex items-center gap-4 p-5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <a.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{a.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Proveedores */}
            <ScrollReveal>
              <div className="card-elevated p-8 sm:p-10">
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="md:w-2/5">
                    <span className="section-label text-xs">PROVEEDORES</span>
                    <h3 className="font-oswald text-2xl font-bold text-slate-900 mt-2">Ecosistema B2B</h3>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                      Empresas especializadas en tecnología, seguridad y servicios para la industria y la cadena de suministro.
                    </p>
                  </div>
                  <div className="md:w-3/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROVEEDORES.map((prov, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all text-sm font-medium text-slate-700">
                        <prov.icon className="w-4 h-4 text-blue-500" />
                        {prov.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            9. NETWORKING HUB — Blue Banner
           ═══════════════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 py-20 sm:py-28 relative overflow-hidden">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "40px 40px"
          }} />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-3/5">
                <ScrollReveal>
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
                    OPORTUNIDAD COMERCIAL
                  </span>
                  <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-[1.15] mb-4">
                    Sala de Networking & Business Hub
                  </h2>
                  <p className="text-blue-100/80 max-w-lg text-base leading-relaxed mb-6">
                    Un espacio físico dedicado al encuentro de negocios. Diseñado
                    para conectar compradores, proveedores y decisores en reuniones
                    de alto valor.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                      "Mesas B2B por industria",
                      "Directorio de asistentes",
                      "Área de presentaciones",
                      "Acceso prioritario VIP",
                      "Coffee break en sesiones",
                      "Networking los 2 días",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                        <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={200}>
                  <a href="#registro" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg">
                    RESERVAR MI LUGAR <ArrowRight className="w-4 h-4" />
                  </a>
                </ScrollReveal>
              </div>

              {/* Stats */}
              <div className="md:w-2/5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Users, number: "300", label: "LUGARES DISPONIBLES" },
                    { icon: Clock, number: "15+", label: "HORAS DE NETWORKING" },
                    { icon: Handshake, number: "2", label: "DÍAS DE EVENTO" },
                    { icon: Award, number: "4", label: "SECTORES" },
                  ].map((stat, i) => (
                    <ScrollReveal key={i} delay={i * 100}>
                      <div className="card-dark p-5 text-center group hover:-translate-y-1 transition-transform">
                        <stat.icon className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
                        <span className="font-oswald text-2xl font-bold text-white block">{stat.number}</span>
                        <span className="text-[10px] text-blue-200/60 tracking-widest font-semibold">{stat.label}</span>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            10. PRICING / ACCESOS
           ═══════════════════════════════════════════════════════════ */}
        <section id="accesos" className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-6">
                <span className="section-label">TIPOS DE ACCESO</span>
                <h2 className="section-title mt-3">Elige Tu Acceso</h2>
                <p className="text-slate-500 max-w-xl mx-auto mt-4">
                  Dos días de capacitación especializada · 24 y 25 de septiembre de 2026 · Centro de
                  Convenciones, Reynosa
                </p>
              </div>
            </ScrollReveal>

            {/* Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {PRICING.map((plan, i) => (
                <ScrollReveal key={plan.id} delay={i * 100}>
                  <div
                    className={`relative p-8 rounded-2xl h-full flex flex-col transition-all duration-300 ${plan.featured
                        ? "text-white border-2 border-blue-400 shadow-2xl md:scale-[1.03]"
                        : "bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300"
                      }`}
                    style={plan.featured ? {
                      background: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 50%, #172554 100%)",
                      boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.35)",
                    } : undefined}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg" style={{ background: "linear-gradient(90deg, #22d3ee, #60a5fa)" }}>
                        Más Popular
                      </div>
                    )}
                    <h3 className={`font-oswald text-xl font-bold ${plan.featured ? "text-white" : "text-slate-900"}`}>
                      {plan.label}
                    </h3>
                    <p className={`text-sm mt-1 ${plan.featured ? "text-blue-200" : "text-slate-400"}`}>
                      {plan.desc}
                    </p>
                    <div className="mt-6 mb-6">
                      <span className={`font-oswald text-4xl font-bold ${plan.featured ? "text-white" : "text-slate-900"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm ml-1 ${plan.featured ? "text-blue-200" : "text-slate-400"}`}>MXN</span>
                      <p className={`text-xs mt-1 ${plan.featured ? "text-blue-300" : "text-slate-400"}`}>* Más I.V.A.</p>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className={`flex items-center gap-2 text-sm ${plan.featured ? "text-blue-100" : "text-slate-600"}`}>
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.featured ? "text-cyan-300" : "text-blue-500"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#registro"
                      className={`w-full py-3.5 rounded-lg font-bold text-sm text-center block transition-all ${plan.featured
                          ? "bg-white text-blue-800 hover:bg-blue-50 shadow-lg"
                          : "btn-primary"
                        }`}
                    >
                      OBTENER ACCESO
                    </a>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Instrucciones de Pago */}
            <ScrollReveal delay={200}>
              <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-oswald text-lg font-bold text-slate-900 mb-1">¿Cómo funciona el proceso de pago?</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      Al completar el formulario de registro recibirás un <strong>folio de confirmación</strong> en pantalla y por correo. Un representante de Lanz Logistics te contactará en un plazo de <strong>24–48 horas hábiles</strong> con las instrucciones de pago (transferencia bancaria, depósito o pago en línea). Tu lugar queda reservado una vez confirmado el pago.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { step: "1", title: "Regístrate", desc: "Llena el formulario y recibe tu folio" },
                        { step: "2", title: "Recibe instrucciones", desc: "Te contactamos en 24-48 hrs hábiles" },
                        { step: "3", title: "Confirma tu lugar", desc: "Realiza el pago y recibes tu confirmación" },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-100">
                          <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{s.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                      ¿Preguntas sobre el pago? Escríbenos a{" "}
                      <a href="mailto:Contacto@LanzLogistics.com" className="text-blue-600 hover:underline font-medium">Contacto@LanzLogistics.com</a>
                      {" "}o al <a href="tel:+19565158070" className="text-blue-600 hover:underline font-medium">+1 (956) 515-8070</a>
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Comparison Table */}
            <ScrollReveal delay={300}>
              <div className="card-elevated mt-16 overflow-x-auto">
                <p className="px-4 pt-4 text-[11px] sm:hidden text-slate-500">
                  Desliza horizontalmente para comparar todos los beneficios.
                </p>
                <table className="comparison-table w-full min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="text-left p-5 font-oswald text-xs tracking-wider text-slate-400 uppercase">Beneficio</th>
                      <th className="text-center p-5 font-oswald text-sm text-slate-600 uppercase">General</th>
                      <th className="text-center p-5 font-oswald text-sm text-blue-600 uppercase font-bold">VIP</th>
                      <th className="text-center p-5 font-oswald text-xs text-slate-400 uppercase">Estudiante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 text-sm text-slate-700 font-medium">{row.feature}</td>
                        <td className="p-4 text-center">
                          {typeof row.general === "boolean" ? (
                            row.general ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                          ) : <span className="text-sm text-slate-600">{row.general}</span>}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.vip === "boolean" ? (
                            row.vip ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                          ) : <span className="text-sm font-semibold text-blue-600">{row.vip}</span>}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.estudiante === "boolean" ? (
                            row.estudiante ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                          ) : <span className="text-sm text-slate-500">{row.estudiante}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            11. PATROCINADORES
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#F8FAFC" />
        <section id="patrocinadores" className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label">OPORTUNIDADES DE PATROCINIO</span>
                <h2 className="section-title mt-3">Posiciona Tu Marca</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  Marcas que buscan máxima visibilidad, posicionamiento y presencia comercial
                  destacada en el evento. Conecta tu empresa con más de 300 profesionales de la cadena de suministros.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SPONSORS.map((s, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="card-elevated p-6 h-full flex flex-col rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                    <h3 className="font-oswald text-lg font-bold text-slate-900 mb-2">
                      {s.tier}
                    </h3>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">{s.slots}</span>
                      <span className="text-[11px] text-slate-400">{s.stand}</span>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                      {s.benefits.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="mailto:Contacto@LanzLogistics.com?subject=Patrocinio%20Summit%202026"
                      className="inline-flex items-center justify-center gap-2 mt-6 w-full py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                    >
                      Solicitar Info <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </ScrollReveal>
              ))}
            </div>


          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            12. UBICACIÓN
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#FFFFFF" flip />
        <section id="ubicacion" className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="section-label flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> SEDE DEL EVENTO
                </span>
                <h2 className="section-title mt-3">Centro de Convenciones de Reynosa</h2>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="grid md:grid-cols-5 gap-8 items-start">
                {/* Map */}
                <div className="md:col-span-3 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <iframe
                    src="https://www.google.com/maps?q=Blvd.+Morelos+190,+Col.+Longoria,+88630+Reynosa,+Tamaulipas,+Mexico&output=embed"
                    className="w-full h-[280px] sm:h-[350px]"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Centro de Convenciones de Reynosa"
                  />
                </div>

                {/* Info */}
                <div className="md:col-span-2 space-y-6">
                  <div className="card-elevated p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Dirección</h4>
                        <p className="text-sm text-slate-700 font-medium mt-1">Centro de Convenciones de Reynosa</p>
                        <p className="text-sm text-slate-500 mt-0.5">Blvd. Morelos 190, Col. Longoria</p>
                        <p className="text-sm text-slate-500">Reynosa, Tamaulipas, C.P. 88630</p>
                        <a
                          href="https://maps.google.com/?q=Blvd.+Morelos+190,+Col.+Longoria,+88630+Reynosa,+Tamaulipas,+Mexico"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" /> Ver en Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="card-elevated p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Fechas</h4>
                        <p className="text-sm text-slate-500 mt-1">24 y 25 de septiembre, 2026</p>
                        <p className="text-xs text-slate-400 mt-1">8:00 AM — 5:30 PM</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-elevated p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Contacto</h4>
                        <p className="text-sm text-slate-500 mt-1">+1 (956) 515-8070</p>
                        <a href="mailto:Contacto@LanzLogistics.com" className="text-sm text-blue-600 hover:underline">Contacto@LanzLogistics.com</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            13. FAQ
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#F8FAFC" />
        <section id="faq" className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="section-label">PREGUNTAS FRECUENTES</span>
                <h2 className="section-title mt-3">¿Tienes Dudas?</h2>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <FAQAccordion items={language === "es" ? FAQ_ITEMS : FAQ_ITEMS_EN} />
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            14. REGISTRO
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#FFFFFF" flip />
        <section id="registro" className="py-20 sm:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <span className="section-label">RESERVA TU LUGAR</span>
                <h2 className="section-title mt-3">Formulario de Registro</h2>
                <p className="text-slate-500 max-w-xl mx-auto mt-4">
                  Completa los siguientes datos para asegurar tu lugar.
                  Los campos con * son obligatorios.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="card-elevated p-6 sm:p-10">
                <RegistroForm language={language} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            15. FINAL CTA Banner
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 py-20 overflow-hidden">
          {/* Decorative */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "30px 30px"
          }} />
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/5 rounded-full float-shape" />
          <div className="absolute bottom-10 right-10 w-24 h-24 border border-cyan-400/10 rounded-2xl float-shape-reverse" />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <ScrollReveal>
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                Cupo Limitado. ¿Listo para{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                  Fortalecer Tu Cadena?
                </span>
              </h2>
              <p className="text-blue-100/60 mt-4 max-w-xl mx-auto">
                El registro garantiza tu lugar en el evento de seguridad en cadena de
                suministros más relevante del norte de México. No te quedes fuera.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <a href="#registro" className="btn-primary px-8 py-4 text-base">
                  REGISTRARME AHORA <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="mailto:Contacto@LanzLogistics.com"
                  className="btn-outline px-8 py-4 text-base border-white/30 text-white hover:bg-white/10"
                >
                  CONTACTAR ORGANIZADOR
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            16. FOOTER
           ═══════════════════════════════════════════════════════════ */}
        <footer className="bg-slate-900 pt-16 pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-oswald text-lg font-bold text-white">SC SUMMIT</span>
                    <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-400">REYNOSA 2026</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                  1er Summit de Seguridad en la Cadena de Suministros. 24
                  y 25 de septiembre, 2026. Centro de Convenciones de
                  Reynosa, Tamaulipas, México.
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  Presentado por <span className="text-blue-400 font-semibold">Lanz Logistics</span> + <span className="text-blue-400 font-semibold">Thynk Unlimited</span>
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">Evento</h4>
                <nav className="flex flex-col gap-2.5">
                  {[
                    { href: "#enfoque", label: "Enfoque" },
                    { href: "#speakers", label: "Conferencistas" },
                    { href: "#agenda", label: "Agenda" },
                    { href: "#audiencia", label: "Audiencia" },
                    { href: "#accesos", label: "Accesos" },
                    { href: "#patrocinadores", label: "Patrocinadores" },
                    { href: "#ubicacion", label: "Ubicación" },
                    { href: "#faq", label: "FAQ" },
                  ].map((l) => (
                    <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto</h4>
                <div className="space-y-3">
                  <a href="mailto:Contacto@LanzLogistics.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                    <Mail className="w-4 h-4" /> Contacto@LanzLogistics.com
                  </a>
                  <a href="tel:+19565158070" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                    <Phone className="w-4 h-4" /> +1 (956) 515-8070
                  </a>
                  <a href="https://scsecuritysummit.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
                    <ExternalLink className="w-4 h-4" /> scsecuritysummit.com
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                © 2026 SC Security Summit. Todos los derechos reservados.
              </p>
              <div className="flex items-center gap-6">
                <a href="/aviso-de-privacidad" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Aviso de Privacidad
                </a>
                <a href="/terminos-y-condiciones" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Términos y Condiciones
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
