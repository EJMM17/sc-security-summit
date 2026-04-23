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
  Crown,
  Trophy,
  Medal,
  Sparkles,
  Gem,
} from "lucide-react";
import MobileNav from "@/components/MobileNav";
import RegistroForm from "@/components/RegistroForm";
import CountdownTimer from "@/components/CountdownTimer";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import FAQAccordion from "@/components/FAQAccordion";
import HeaderScroll from "@/components/HeaderScroll";
import ScrollProgress from "@/components/ScrollProgress";

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

const NAV_LINKS = {
  es: [
    { href: "#enfoque", label: "Enfoque" },
    { href: "#speakers", label: "Conferencistas" },
    { href: "#audiencia", label: "Audiencia" },
    { href: "#accesos", label: "Accesos" },
    { href: "#patrocinadores", label: "Patrocinadores" },
    { href: "#ubicacion", label: "Ubicación" },
  ],
  en: [
    { href: "#enfoque", label: "Focus" },
    { href: "#speakers", label: "Speakers" },
    { href: "#audiencia", label: "Audience" },
    { href: "#accesos", label: "Passes" },
    { href: "#patrocinadores", label: "Sponsors" },
    { href: "#ubicacion", label: "Location" },
  ],
} as const;

const FOOTER_LINKS = {
  es: [
    { href: "#enfoque", label: "Enfoque" },
    { href: "#speakers", label: "Conferencistas" },
    { href: "#audiencia", label: "Audiencia" },
    { href: "#accesos", label: "Accesos" },
    { href: "#patrocinadores", label: "Patrocinadores" },
    { href: "#ubicacion", label: "Ubicación" },
    { href: "#faq", label: "FAQ" },
  ],
  en: [
    { href: "#enfoque", label: "Focus" },
    { href: "#speakers", label: "Speakers" },
    { href: "#audiencia", label: "Audience" },
    { href: "#accesos", label: "Passes" },
    { href: "#patrocinadores", label: "Sponsors" },
    { href: "#ubicacion", label: "Location" },
    { href: "#faq", label: "FAQ" },
  ],
} as const;

const UI_TEXT = {
  es: {
    skipToForm: "Ir al formulario de registro",
    switchLangLabel: "Cambiar a inglés",
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
    presentedBy: "Presentado por",
    whyAttendLabel: "PORQUE SER PARTE DEL SUMMIT",
    whyAttendTitle: "Lo Que Te Espera",
    whyAttendDesc:
      "Más que un congreso. Una experiencia de capacitación, networking e innovación diseñada para transformar tu operación.",
    purposeLabel: "PROPÓSITO",
    visionMissionTitle: "Visión y Misión",
    missionLabel: "Misión",
    missionP1:
      "Reunir en un solo espacio a los sectores clave de la cadena de suministro para fortalecer las estrategias de seguridad, compartir mejores prácticas, difundir actualizaciones relevantes en certificaciones internacionales, y generar oportunidades de vinculación estratégica entre empresas, especialistas y proveedores de soluciones.",
    missionP2:
      "Nuestra misión es impulsar el desarrollo de cadenas de suministro más seguras, informadas y competitivas, mediante experiencias de alto valor como conferencias, paneles, talleres y networking especializado.",
    visionLabel: "Visión",
    visionP1:
      "Ser el Summit líder en el norte de México en temas de seguridad en la cadena de suministro, comercio exterior, logística y cumplimiento normativo, reconocido por conectar a empresas, expertos y proveedores estratégicos en un ecosistema de aprendizaje, innovación y crecimiento colaborativo.",
    visionP2:
      "Aspiramos a consolidarnos como el evento de referencia para impulsar una cultura de prevención, cumplimiento y excelencia operativa que fortalezca el comercio seguro y eficiente a nivel regional y binacional.",
    aboutText:
      "El 1er Summit de Seguridad en la Cadena de Suministro es un espacio especializado creado para reunir a los principales actores de la industria maquiladora, transporte, aduanas, seguridad y compliance, con el propósito de fortalecer la seguridad, la eficiencia y la competitividad del comercio en la región. A través de conferencias, paneles, workshops y espacios de vinculación comercial como el Business Hub, buscamos impulsar alianzas estratégicas, promover soluciones de alto impacto y contribuir al desarrollo de una cadena de suministro más segura, resiliente y eficiente.",
    pillarsLabel: "EJES TEMÁTICOS",
    pillarsTitle: "Tres Pilares, Un Objetivo",
    pillarsDesc:
      "Cada eje del Summit fue diseñado para cubrir las necesidades reales de los profesionales de la cadena de suministros.",
    speakersLabel: "CONFERENCISTAS CONFIRMADOS",
    speakersTitle: "Especialistas de Primer Nivel",
    speakersDesc:
      "Líderes en estándares internacionales, comercio exterior, cumplimiento operativo e innovación estratégica.",
    speakersMorePrefix: "Más conferencistas serán anunciados pronto.",
    speakersMoreCTA: "Regístrate para recibirlos primero →",
    valueLabel: "LO QUE OBTENDRÁS",
    valueTitle: "Valor Real Para Tu Empresa",
    audienceCardTitle: "Perfil de Asistentes",
    audienceCardDesc:
      "Personal de la industria maquiladora, transportistas, agencias aduanales, compliance y seguridad de cadena de suministro.",
    audienceCardCTA: "Registrarme Ahora",
    eventDayLabel: "Día del evento",
    eventDayValue: "24 y 25 de septiembre, 2026",
    eventDayVenue: "Centro de Convenciones · Reynosa, Tamaulipas",
    participantsLabel: "PARTICIPANTES",
    participantsTitle: "¿A Quién Va Dirigido?",
    participantsDesc:
      "Para quienes mueven, protegen y fortalecen la cadena de suministro. Un punto de encuentro para líderes y especialistas en áreas clave.",
    providersLabel: "PROVEEDORES",
    providersTitle: "Ecosistema B2B",
    providersDesc:
      "Empresas especializadas en tecnología, seguridad y servicios para la industria y la cadena de suministro.",
    networkingLabel: "OPORTUNIDAD COMERCIAL",
    networkingTitle: "Sala de Networking & Business Hub",
    networkingDesc:
      "Un espacio físico dedicado al encuentro de negocios. Diseñado para conectar compradores, proveedores y decisores en reuniones de alto valor.",
    networkingFeatures: [
      "Mesas B2B por industria",
      "Directorio de asistentes",
      "Área de presentaciones",
      "Acceso prioritario VIP",
      "Coffee break en sesiones",
      "Networking los 2 días",
    ],
    networkingCTA: "RESERVAR MI LUGAR",
    networkingStats: [
      { number: "300", label: "LUGARES DISPONIBLES" },
      { number: "15+", label: "HORAS DE NETWORKING" },
      { number: "2", label: "DÍAS DE EVENTO" },
      { number: "4", label: "SECTORES" },
    ],
    pricingLabel: "TIPOS DE ACCESO",
    pricingTitle: "Elige Tu Acceso",
    pricingDesc:
      "Dos días de capacitación especializada · 24 y 25 de septiembre de 2026 · Centro de Convenciones, Reynosa",
    taxNote: "* Más I.V.A.",
    getAccessBtn: "OBTENER ACCESO",
    paymentTitle: "¿Cómo funciona el proceso de pago?",
    paymentIntroHtml:
      "Al completar el formulario de registro recibirás un <strong>folio de confirmación</strong> en pantalla y por correo. Un representante de Lanz Logistics te contactará en un plazo de <strong>24–48 horas hábiles</strong> con las instrucciones de pago (transferencia bancaria, depósito o pago en línea). Tu lugar queda reservado una vez confirmado el pago.",
    paymentSteps: [
      { step: "1", title: "Regístrate", desc: "Llena el formulario y recibe tu folio" },
      { step: "2", title: "Recibe instrucciones", desc: "Te contactamos en 24-48 hrs hábiles" },
      { step: "3", title: "Confirma tu lugar", desc: "Realiza el pago y recibes tu confirmación" },
    ],
    paymentQuestionsPrefix: "¿Preguntas sobre el pago? Escríbenos a",
    paymentOr: "o al",
    sponsorsLabel: "OPORTUNIDADES DE PATROCINIO",
    sponsorsTitle: "Posiciona Tu Marca",
    sponsorsDesc:
      "Marcas que buscan máxima visibilidad, posicionamiento y presencia comercial destacada en el evento. Conecta tu empresa con más de 300 profesionales de la cadena de suministros.",
    sponsorRequestInfo: "Solicitar Info",
    sponsorTierLabel: "Nivel",
    sponsorSlotsLabel: "cupos exclusivos",
    sponsorBenefitsLabel: "beneficios incluidos",
    sponsorExclusiveBadge: "Experiencia Élite",
    sponsorRecommendedBadge: "Más Solicitado",
    sponsorStandLabel: "Stand",
    locationLabel: "SEDE DEL EVENTO",
    locationTitle: "Centro de Convenciones de Reynosa",
    addressLabel: "Dirección",
    addressName: "Centro de Convenciones de Reynosa",
    addressLine1: "Blvd. Morelos 190, Col. Longoria",
    addressLine2: "Reynosa, Tamaulipas, C.P. 88630",
    viewOnMaps: "Ver en Google Maps",
    datesLabel: "Fechas",
    datesValue: "24 y 25 de septiembre, 2026",
    datesHours: "8:00 AM — 5:30 PM",
    contactLabel: "Contacto",
    faqLabel: "PREGUNTAS FRECUENTES",
    faqTitle: "¿Tienes Dudas?",
    regLabel: "RESERVA TU LUGAR",
    regTitle: "Formulario de Registro",
    regDesc:
      "Completa los siguientes datos para asegurar tu lugar. Los campos con * son obligatorios.",
    finalCTATitlePart1: "Cupo Limitado. ¿Listo para",
    finalCTATitlePart2: "Fortalecer Tu Cadena?",
    finalCTADesc:
      "El registro garantiza tu lugar en el evento de seguridad en cadena de suministros más relevante del norte de México. No te quedes fuera.",
    contactOrg: "CONTACTAR ORGANIZADOR",
    footerDesc:
      "1er Summit de Seguridad en la Cadena de Suministros. 24 y 25 de septiembre, 2026. Centro de Convenciones de Reynosa, Tamaulipas, México.",
    footerPresentedBy: "Presentado por",
    footerEvent: "Evento",
    footerContact: "Contacto",
    footerCopyright: "© 2026 SC Security Summit. Todos los derechos reservados.",
    footerPrivacy: "Aviso de Privacidad",
    footerTerms: "Términos y Condiciones",
    galleryLabel: "GALERÍA DE EDICIONES PREVIAS",
    galleryTitle: "Así Se Vive el Summit",
    galleryDesc: "Networking especializado, conferencias magistrales y vinculación empresarial — esto es lo que te espera.",
    galleryTag1: "Expo Comercial",
    galleryTag2: "Registro & Bienvenida",
    galleryTag3: "Conferencia Magistral",
    galleryTag4: "Business Hub",
    galleryStripAlt: "Sala de exposición — SC Security Summit",
  },
  en: {
    skipToForm: "Skip to registration form",
    switchLangLabel: "Switch to Spanish",
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
    presentedBy: "Presented by",
    whyAttendLabel: "WHY JOIN THE SUMMIT",
    whyAttendTitle: "What Awaits You",
    whyAttendDesc:
      "More than a conference. A training, networking and innovation experience designed to transform your operation.",
    purposeLabel: "PURPOSE",
    visionMissionTitle: "Vision & Mission",
    missionLabel: "Mission",
    missionP1:
      "Bring together the key players of the supply chain in a single space to strengthen security strategies, share best practices, broadcast updates on international certifications, and create strategic networking opportunities among companies, specialists and solution providers.",
    missionP2:
      "Our mission is to drive the development of safer, better-informed and more competitive supply chains through high-value experiences such as conferences, panels, workshops and specialized networking.",
    visionLabel: "Vision",
    visionP1:
      "To be the leading Summit in northern Mexico for supply chain security, foreign trade, logistics and regulatory compliance, recognized for connecting companies, experts and strategic providers in an ecosystem of learning, innovation and collaborative growth.",
    visionP2:
      "We aspire to become the reference event that drives a culture of prevention, compliance and operational excellence, strengthening safe and efficient trade at the regional and binational level.",
    aboutText:
      "The 1st Supply Chain Security Summit is a specialized forum created to bring together leading players from the maquiladora industry, transport, customs, security and compliance sectors, with the goal of strengthening the security, efficiency and competitiveness of trade in the region. Through conferences, panels, workshops and business networking spaces such as the Business Hub, we aim to promote strategic alliances, showcase high-impact solutions and contribute to a safer, more resilient and more efficient supply chain.",
    pillarsLabel: "STRATEGIC PILLARS",
    pillarsTitle: "Three Pillars, One Goal",
    pillarsDesc:
      "Every pillar of the Summit was designed to meet the real needs of supply chain professionals.",
    speakersLabel: "CONFIRMED SPEAKERS",
    speakersTitle: "Top-Tier Specialists",
    speakersDesc:
      "Leaders in international standards, foreign trade, operational compliance and strategic innovation.",
    speakersMorePrefix: "More speakers will be announced soon.",
    speakersMoreCTA: "Register to hear about them first →",
    valueLabel: "WHAT YOU WILL GAIN",
    valueTitle: "Real Value For Your Company",
    audienceCardTitle: "Attendee Profile",
    audienceCardDesc:
      "Professionals from the maquiladora industry, carriers, customs brokers, compliance and supply chain security.",
    audienceCardCTA: "Register Now",
    eventDayLabel: "Event day",
    eventDayValue: "September 24 & 25, 2026",
    eventDayVenue: "Convention Center · Reynosa, Tamaulipas",
    participantsLabel: "PARTICIPANTS",
    participantsTitle: "Who Is It For?",
    participantsDesc:
      "For those who move, protect and strengthen the supply chain. A meeting point for leaders and specialists in key areas.",
    providersLabel: "PROVIDERS",
    providersTitle: "B2B Ecosystem",
    providersDesc:
      "Companies specialized in technology, security and services for industry and the supply chain.",
    networkingLabel: "BUSINESS OPPORTUNITY",
    networkingTitle: "Networking Lounge & Business Hub",
    networkingDesc:
      "A physical space dedicated to business meetings. Designed to connect buyers, providers and decision makers in high-value conversations.",
    networkingFeatures: [
      "B2B tables by industry",
      "Attendee directory",
      "Presentation area",
      "VIP priority access",
      "Coffee breaks during sessions",
      "Networking both days",
    ],
    networkingCTA: "RESERVE MY SPOT",
    networkingStats: [
      { number: "300", label: "AVAILABLE SEATS" },
      { number: "15+", label: "NETWORKING HOURS" },
      { number: "2", label: "EVENT DAYS" },
      { number: "4", label: "INDUSTRY SECTORS" },
    ],
    pricingLabel: "ACCESS TYPES",
    pricingTitle: "Choose Your Pass",
    pricingDesc:
      "Two days of specialized training · September 24-25, 2026 · Reynosa Convention Center",
    taxNote: "* Plus VAT",
    getAccessBtn: "GET ACCESS",
    paymentTitle: "How does the payment process work?",
    paymentIntroHtml:
      "After completing the registration form you will receive a <strong>confirmation code</strong> on screen and by email. A Lanz Logistics representative will contact you within <strong>24–48 business hours</strong> with payment instructions (bank transfer, deposit or online payment). Your spot is reserved once payment is confirmed.",
    paymentSteps: [
      { step: "1", title: "Register", desc: "Fill out the form and receive your code" },
      { step: "2", title: "Get instructions", desc: "We contact you within 24-48 business hours" },
      { step: "3", title: "Confirm your spot", desc: "Complete the payment and receive confirmation" },
    ],
    paymentQuestionsPrefix: "Questions about payment? Email us at",
    paymentOr: "or call",
    sponsorsLabel: "SPONSORSHIP OPPORTUNITIES",
    sponsorsTitle: "Position Your Brand",
    sponsorsDesc:
      "Brands seeking maximum visibility, positioning and prominent commercial presence at the event. Connect your company with more than 300 supply chain professionals.",
    sponsorRequestInfo: "Request Info",
    sponsorTierLabel: "Tier",
    sponsorSlotsLabel: "exclusive slots",
    sponsorBenefitsLabel: "benefits included",
    sponsorExclusiveBadge: "Elite Experience",
    sponsorRecommendedBadge: "Most Requested",
    sponsorStandLabel: "Booth",
    locationLabel: "EVENT VENUE",
    locationTitle: "Reynosa Convention Center",
    addressLabel: "Address",
    addressName: "Reynosa Convention Center",
    addressLine1: "Blvd. Morelos 190, Col. Longoria",
    addressLine2: "Reynosa, Tamaulipas, C.P. 88630",
    viewOnMaps: "View on Google Maps",
    datesLabel: "Dates",
    datesValue: "September 24-25, 2026",
    datesHours: "8:00 AM — 5:30 PM",
    contactLabel: "Contact",
    faqLabel: "FREQUENTLY ASKED QUESTIONS",
    faqTitle: "Have Questions?",
    regLabel: "RESERVE YOUR SPOT",
    regTitle: "Registration Form",
    regDesc:
      "Fill out the information below to secure your spot. Fields marked with * are required.",
    finalCTATitlePart1: "Limited Seats. Ready to",
    finalCTATitlePart2: "Strengthen Your Chain?",
    finalCTADesc:
      "Registering guarantees your spot at the most relevant supply chain security event in northern Mexico. Don't miss out.",
    contactOrg: "CONTACT ORGANIZER",
    footerDesc:
      "1st Supply Chain Security Summit. September 24 and 25, 2026. Reynosa Convention Center, Tamaulipas, Mexico.",
    footerPresentedBy: "Presented by",
    footerEvent: "Event",
    footerContact: "Contact",
    footerCopyright: "© 2026 SC Security Summit. All rights reserved.",
    footerPrivacy: "Privacy Notice",
    footerTerms: "Terms and Conditions",
    galleryLabel: "PAST EDITIONS GALLERY",
    galleryTitle: "Experience the Summit",
    galleryDesc: "Specialized networking, keynote sessions and business connections — this is what awaits you.",
    galleryTag1: "Commercial Expo",
    galleryTag2: "Registration & Welcome",
    galleryTag3: "Keynote Session",
    galleryTag4: "Business Hub",
    galleryStripAlt: "Exhibition hall — SC Security Summit",
  },
} as const;

const HERO_STATS = {
  es: [
    { number: 2, suffix: "", label: "Días de Capacitación" },
    { number: 4, suffix: "+", label: "Conferencistas Confirmados" },
    { number: 300, suffix: "", label: "Lugares Disponibles" },
    { number: 4, suffix: "", label: "Sectores Industriales" },
  ],
  en: [
    { number: 2, suffix: "", label: "Training Days" },
    { number: 4, suffix: "+", label: "Confirmed Speakers" },
    { number: 300, suffix: "", label: "Available Seats" },
    { number: 4, suffix: "", label: "Industry Sectors" },
  ],
} as const;

const PILARES = {
  es: [
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
  ],
  en: [
    {
      icon: ShieldCheck,
      title: "Strategic Update",
      desc: "Access high-value content on security certifications, foreign trade, risk management and operational compliance with a focus on international standards.",
      bullets: [
        "Current trends and regulations",
        "International best practices",
        "Risk management and controls",
      ],
      number: "01",
    },
    {
      icon: Network,
      title: "Solutions & Innovation",
      desc: "Discover technologies, tools and specialized services for the security of your chain: traceability, intelligent monitoring and applied cybersecurity.",
      bullets: [
        "Advanced security technologies",
        "Real-time logistics monitoring",
        "Cybersecurity for supply chain",
      ],
      number: "02",
    },
    {
      icon: Handshake,
      title: "Business Hub B2B",
      desc: "Connect with companies, specialists and decision makers. Build business relationships in northern Mexico's customs and logistics ecosystem.",
      bullets: [
        "Industry-focused networking",
        "Qualified lead generation",
        "Strategic commercial alliances",
      ],
      number: "03",
    },
  ],
} as const;

const SPEAKERS = {
  es: [
    {
      name: "Fidel Guerrero",
      role: "Subdirector, Comité Nacional de Aduanas y Comercio Exterior",
      org: "INDEX",
      topic: "Aduanas & Comercio Exterior",
      image: "/images/speaker-fidel.webp",
    },
    {
      name: "Isidoro Juárez",
      role: "Mandatario Aduanal Certificado",
      org: "Especialista en Comercio Exterior",
      topic: "Aduanas & Compliance",
      image: "/images/speaker-isidoro.webp",
    },
    {
      name: "Julio César Suárez",
      role: "Líder en Trade Compliance e Innovación",
      org: "Sector Automotriz e Industrial",
      topic: "Trade Compliance",
      image: "/images/speaker-julio.webp",
    },
    {
      name: "Eduardo Luna",
      role: "Especialista en Innovación Estratégica",
      org: "Certificación Internacional en Enseñanza",
      topic: "Innovación & Aprendizaje",
      image: "/images/speaker-eduardo.webp",
    },
  ],
  en: [
    {
      name: "Fidel Guerrero",
      role: "Deputy Director, National Committee of Customs & Foreign Trade",
      org: "INDEX",
      topic: "Customs & Foreign Trade",
      image: "/images/speaker-fidel.webp",
    },
    {
      name: "Isidoro Juárez",
      role: "Certified Customs Broker",
      org: "Foreign Trade Specialist",
      topic: "Customs & Compliance",
      image: "/images/speaker-isidoro.webp",
    },
    {
      name: "Julio César Suárez",
      role: "Trade Compliance & Innovation Leader",
      org: "Automotive & Industrial Sector",
      topic: "Trade Compliance",
      image: "/images/speaker-julio.webp",
    },
    {
      name: "Eduardo Luna",
      role: "Strategic Innovation Specialist",
      org: "International Teaching Certification",
      topic: "Innovation & Learning",
      image: "/images/speaker-eduardo.webp",
    },
  ],
} as const;

const ASISTENTES = {
  es: [
    { title: "Operaciones & Supply Chain", desc: "Directores, gerentes y coordinaciones", icon: Building2 },
    { title: "Logística & Transporte", desc: "Responsables de tráfico y distribución", icon: Truck },
    { title: "Aduanas & Comercio Exterior", desc: "Import-export y cumplimiento operativo", icon: Globe },
    { title: "Compliance & Seguridad", desc: "Seguridad patrimonial y control interno", icon: ShieldCheck },
    { title: "Abastecimiento & Compras", desc: "Decisores de compra y proveedores", icon: ShoppingCart },
    { title: "Sistemas & Tecnología", desc: "Monitoreo e innovación IT", icon: Monitor },
  ],
  en: [
    { title: "Operations & Supply Chain", desc: "Directors, managers and coordinators", icon: Building2 },
    { title: "Logistics & Transportation", desc: "Traffic and distribution leads", icon: Truck },
    { title: "Customs & Foreign Trade", desc: "Import-export and operational compliance", icon: Globe },
    { title: "Compliance & Security", desc: "Asset protection and internal control", icon: ShieldCheck },
    { title: "Sourcing & Procurement", desc: "Purchasing decision-makers and suppliers", icon: ShoppingCart },
    { title: "Systems & Technology", desc: "Monitoring and IT innovation", icon: Monitor },
  ],
} as const;

const PROVEEDORES = {
  es: [
    { title: "Transportistas", icon: Truck },
    { title: "Agencias Aduanales", icon: Globe },
    { title: "Videovigilancia CCTV", icon: Eye },
    { title: "Telemetría GPS", icon: Satellite },
    { title: "Control de Acceso", icon: ScanLine },
    { title: "Consultoría", icon: BookOpen },
  ],
  en: [
    { title: "Carriers", icon: Truck },
    { title: "Customs Brokers", icon: Globe },
    { title: "CCTV Surveillance", icon: Eye },
    { title: "GPS Telemetry", icon: Satellite },
    { title: "Access Control", icon: ScanLine },
    { title: "Consulting", icon: BookOpen },
  ],
} as const;

const PRICING = {
  es: [
    {
      id: "general",
      label: "Acceso General",
      price: "$5,800",
      featured: false,
      desc: "Profesionales y operación",
      features: [
        "Capacitación de 2 días",
        "Acceso a paneles",
        "Gafete nivel General",
        "Kit operativo estándar",
        "Constancia oficial digital",
        "Business Hub B2B",
        "Coffee break",
      ],
    },
    {
      id: "vip",
      label: "Acceso VIP",
      price: "$7,200",
      featured: true,
      desc: "Ejecutivos y tomadores de decisión",
      features: [
        "Capacitación de 2 días",
        "Acceso a paneles",
        "Gafete VIP Premium",
        "Kit operativo completo",
        "Constancia oficial física",
        "Acceso total al Business Hub B2B",
        "Asientos prioritarios",
        "Plantillas descargables",
        "Coffee break",
      ],
    },
    {
      id: "estudiante",
      label: "Acceso Estudiante",
      price: "$1,200",
      featured: false,
      desc: "Perfil académico con credencial vigente",
      features: [
        "Capacitación de 2 días",
        "Acceso a paneles",
        "Gafete nivel Básico",
        "Kit operativo mínimo",
        "Constancia oficial digital",
      ],
    },
  ],
  en: [
    {
      id: "general",
      label: "General Pass",
      price: "$5,800",
      featured: false,
      desc: "Professionals and operations",
      features: [
        "2-day training",
        "Panel access",
        "General badge level",
        "Standard operational kit",
        "Official digital certificate",
        "B2B Business Hub",
        "Coffee break",
      ],
    },
    {
      id: "vip",
      label: "VIP Pass",
      price: "$7,200",
      featured: true,
      desc: "Executives and decision makers",
      features: [
        "2-day training",
        "Panel access",
        "VIP Premium badge",
        "Complete operational kit",
        "Official printed certificate",
        "Full B2B Business Hub access",
        "Priority seating",
        "Downloadable templates",
        "Coffee break",
      ],
    },
    {
      id: "estudiante",
      label: "Student Pass",
      price: "$1,200",
      featured: false,
      desc: "Academic profile with valid ID",
      features: [
        "2-day training",
        "Panel access",
        "Basic badge level",
        "Minimal operational kit",
        "Official digital certificate",
      ],
    },
  ],
} as const;

type SponsorTierMeta = {
  level: number;
  icon: typeof Crown;
  slotsTotal: number;
  stand: string;
  stripe: string;
  iconBg: string;
  iconFg: string;
  chipBg: string;
  chipFg: string;
  accent: string;
  ring: string;
  featured: boolean;
  highlighted: boolean;
};

const SPONSOR_TIER_META: readonly SponsorTierMeta[] = [
  {
    level: 1,
    icon: Crown,
    slotsTotal: 8,
    stand: "5 × 6 m",
    stripe: "bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400",
    iconBg: "bg-slate-900",
    iconFg: "text-slate-100",
    chipBg: "bg-slate-900",
    chipFg: "text-slate-50",
    accent: "text-slate-900",
    ring: "hover:ring-2 hover:ring-slate-300",
    featured: true,
    highlighted: false,
  },
  {
    level: 2,
    icon: Trophy,
    slotsTotal: 10,
    stand: "4 × 4 m",
    stripe: "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300",
    iconBg: "bg-amber-500",
    iconFg: "text-white",
    chipBg: "bg-amber-50",
    chipFg: "text-amber-700",
    accent: "text-amber-600",
    ring: "hover:ring-2 hover:ring-amber-300",
    featured: false,
    highlighted: true,
  },
  {
    level: 3,
    icon: Medal,
    slotsTotal: 14,
    stand: "3 × 3 m",
    stripe: "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300",
    iconBg: "bg-slate-500",
    iconFg: "text-white",
    chipBg: "bg-slate-100",
    chipFg: "text-slate-600",
    accent: "text-slate-600",
    ring: "hover:ring-2 hover:ring-slate-200",
    featured: false,
    highlighted: false,
  },
  {
    level: 4,
    icon: Gem,
    slotsTotal: 16,
    stand: "3 × 3 m",
    stripe: "bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400",
    iconBg: "bg-blue-600",
    iconFg: "text-white",
    chipBg: "bg-blue-50",
    chipFg: "text-blue-700",
    accent: "text-blue-600",
    ring: "hover:ring-2 hover:ring-blue-200",
    featured: false,
    highlighted: false,
  },
];

const SPONSORS = {
  es: [
    {
      tier: "Patrocinador Platino",
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
      benefits: [
        "Stand estándar en área de exhibición (3m × 3m)",
        "Logo en material digital (sitio web, redes sociales)",
        "2 accesos VIP a conferencias",
        "Publicación en redes sociales",
      ],
    },
    {
      tier: "Proveedor Aliado Estratégico",
      benefits: [
        "Stand 3×3m en zona de proveedores",
        "1 acceso a conferencias incluido",
        "Inclusión en directorio de soluciones",
        'Badge "Proveedor Recomendado" en materiales del evento',
        "Diseñado para proveedores especializados en certificaciones de seguridad",
      ],
    },
  ],
  en: [
    {
      tier: "Platinum Sponsor",
      benefits: [
        "Premium booth in privileged location (5m × 6m)",
        "Logo on printed and digital material (flyers, banners, website, social media)",
        "Featured mention at opening and closing ceremonies",
        "Commercial presentation slot on stage (5 min)",
        "5 VIP passes to conferences",
        "Promotional material in the welcome kit",
        "Featured posts on social media and mailing",
        "Access to networking activities with buyers and authorities",
        "Attendee and prospect directory",
        "On-site coffee break service",
        "Advertising reel on screens",
      ],
    },
    {
      tier: "Gold Sponsor",
      benefits: [
        "Booth in the central area of the event (4m × 4m)",
        "Logo on printed and digital material",
        "Mention during the opening ceremony",
        "3 VIP passes to conferences",
        "Social media and mailing posts",
        "Opportunity to distribute promotional material",
      ],
    },
    {
      tier: "Silver Sponsor",
      benefits: [
        "Standard booth in the exhibition area (3m × 3m)",
        "Logo on digital material (website, social media)",
        "2 VIP passes to conferences",
        "Social media posts",
      ],
    },
    {
      tier: "Strategic Allied Provider",
      benefits: [
        "3×3m booth in the providers zone",
        "1 conference pass included",
        "Inclusion in the solutions directory",
        '"Recommended Provider" badge on event materials',
        "Designed for providers specializing in security certifications",
      ],
    },
  ],
} as const;

const VALUE_HIGHLIGHTS = {
  es: [
    "Contenido especializado con aplicación directa en tu operación diaria",
    "Networking estratégico con más de 300 profesionales de la industria",
    "Acceso a soluciones tecnológicas de vanguardia en seguridad y logística",
    "Vinculación directa con tomadores de decisión y compradores",
    "Certificaciones y estándares internacionales con enfoque práctico",
    "Workshops y paneles dirigidos por expertos con experiencia real",
    "Business Hub B2B para generación de alianzas comerciales",
    "Perspectiva binacional para impulsar el comercio seguro y eficiente",
  ],
  en: [
    "Specialized content with direct application to your daily operation",
    "Strategic networking with more than 300 industry professionals",
    "Access to cutting-edge security and logistics technology solutions",
    "Direct connection with decision makers and buyers",
    "International certifications and standards with a practical focus",
    "Workshops and panels led by experts with real-world experience",
    "B2B Business Hub to drive commercial alliances",
    "Binational perspective to boost safe and efficient trade",
  ],
} as const;

const WHY_ATTEND = {
  es: [
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
  ],
  en: [
    {
      icon: BookOpen,
      title: "Strategic Update",
      desc: "Current and specialized topics on security, logistics, foreign trade and compliance.",
    },
    {
      icon: Mic2,
      title: "Industry Experts",
      desc: "Speakers and panelists with hands-on experience in operations, compliance and strategy.",
    },
    {
      icon: Target,
      title: "Real Impact",
      desc: "Ideas, tools and contacts that translate into concrete improvements for your company.",
    },
    {
      icon: Globe,
      title: "Binational & Commercial Vision",
      desc: "A binational perspective to drive trade, collaboration and growth.",
    },
  ],
} as const;

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
      {/* ── SCROLL PROGRESS BAR ── */}
      <ScrollProgress />

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
                aria-label={text.switchLangLabel}
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
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-cyan-300/90">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{text.eventDayLabel}</span>
                  </div>
                  <p className="font-oswald text-base sm:text-lg font-bold text-white tracking-wide">
                    {text.eventDayValue}
                  </p>
                  <p className="text-[11px] sm:text-xs text-blue-100/70">
                    {text.eventDayVenue}
                  </p>
                </div>
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
            {HERO_STATS[language].map((s, i) => (
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
              <p className="text-xs text-slate-400 uppercase tracking-wider">{text.presentedBy}</p>
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
                  <span className="section-label">{text.whyAttendLabel}</span>
                  <div className="accent-line" />
                </div>
                <h2 className="section-title">{text.whyAttendTitle}</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4 text-lg">
                  {text.whyAttendDesc}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-6">
              {WHY_ATTEND[language].map((item, i) => (
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
            GALERÍA — Bento Editorial Grid
           ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 bg-slate-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-14">
                <span className="section-label">{text.galleryLabel}</span>
                <h2 className="section-title mt-3">{text.galleryTitle}</h2>
                <p className="text-slate-500 max-w-xl mx-auto mt-4 text-base leading-relaxed">
                  {text.galleryDesc}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="gallery-bento">
                {/* Photo 1 — Exhibition Hall (feature, spans 2 cols on desktop) */}
                <div className="gallery-photo gallery-p1">
                  <Image
                    src="/images/gallery-hall.jpg"
                    alt={text.galleryTag1}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, (max-width: 1024px) 100vw, 62vw"
                  />
                  <div className="gallery-photo-overlay" />
                  <div className="gallery-photo-label">
                    <span className="gallery-photo-tag">
                      <Building2 className="w-3 h-3" /> {text.galleryTag1}
                    </span>
                    <p className="text-white font-oswald text-xl font-bold leading-tight mt-1 drop-shadow-sm">
                      SC Security Summit 2026
                    </p>
                  </div>
                </div>

                {/* Photo 2 — Registration (tall portrait, spans 2 rows on desktop) */}
                <div className="gallery-photo gallery-p2">
                  <Image
                    src="/images/gallery-registro.jpg"
                    alt={text.galleryTag2}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 26vw"
                  />
                  <div className="gallery-photo-overlay" />
                  <div className="gallery-photo-label">
                    <span className="gallery-photo-tag">
                      <Users className="w-3 h-3" /> {text.galleryTag2}
                    </span>
                    <p className="text-white/85 text-xs mt-1">Reynosa, Tamaulipas</p>
                  </div>
                </div>

                {/* Photo 3 — Keynote */}
                <div className="gallery-photo gallery-p3">
                  <Image
                    src="/images/gallery-keynote.jpg"
                    alt={text.galleryTag3}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 36vw"
                  />
                  <div className="gallery-photo-overlay" />
                  <div className="gallery-photo-label">
                    <span className="gallery-photo-tag">
                      <Mic2 className="w-3 h-3" /> {text.galleryTag3}
                    </span>
                  </div>
                </div>

                {/* Photo 4 — Business Hub */}
                <div className="gallery-photo gallery-p4">
                  <Image
                    src="/images/gallery-hub.jpg"
                    alt={text.galleryTag4}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 30vw"
                  />
                  <div className="gallery-photo-overlay" />
                  <div className="gallery-photo-label">
                    <span className="gallery-photo-tag">
                      <Network className="w-3 h-3" /> {text.galleryTag4}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            VISIÓN & MISIÓN
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 rhythm-pause-md overflow-hidden">
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
                  <Compass className="w-3.5 h-3.5 text-cyan-300" /> {text.purposeLabel}
                </span>
                <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {text.visionMissionTitle}
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              {/* MISIÓN */}
              <ScrollReveal>
                <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 h-full offset-up-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <Crosshair className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-oswald text-2xl font-bold text-white">{text.missionLabel}</h3>
                  </div>
                  <div className="space-y-4 text-blue-100/75 text-sm leading-relaxed">
                    <p>{text.missionP1}</p>
                    <p>{text.missionP2}</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* VISIÓN */}
              <ScrollReveal delay={140}>
                <div className="relative p-8 sm:p-10 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 h-full offset-down-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-oswald text-2xl font-bold text-white">{text.visionLabel}</h3>
                  </div>
                  <div className="space-y-4 text-blue-100/75 text-sm leading-relaxed">
                    <p>{text.visionP1}</p>
                    <p>{text.visionP2}</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Acerca del evento (About) */}
            <ScrollReveal delay={300}>
              <div className="mt-12 p-8 sm:p-10 rounded-2xl bg-white/[0.04] border border-white/8 text-center max-w-4xl mx-auto">
                <p className="text-blue-100/70 text-sm leading-relaxed">
                  {text.aboutText}
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
                <span className="section-label">{text.pillarsLabel}</span>
                <h2 className="section-title mt-3">{text.pillarsTitle}</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  {text.pillarsDesc}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-8">
              {PILARES[language].map((p, i) => (
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
        <section id="speakers" className="rhythm-pause-lg bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label flex items-center justify-center gap-2">
                  <Mic2 className="w-4 h-4" /> {text.speakersLabel}
                </span>
                <h2 className="section-title mt-3">{text.speakersTitle}</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  {text.speakersDesc}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {SPEAKERS[language].map((s, i) => (
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
                {text.speakersMorePrefix}{" "}
                <a href="#registro" className="text-blue-600 font-semibold hover:underline">
                  {text.speakersMoreCTA}
                </a>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            6. VALOR DEL EVENTO — Bullet Points + Perfil de Asistentes
           ═══════════════════════════════════════════════════════════ */}
        <section className="rhythm-pause-md bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Left: Bullet Points (3 cols) */}
              <div className="lg:col-span-3">
                <ScrollReveal>
                  <span className="section-label">{text.valueLabel}</span>
                  <h2 className="section-title mt-3 mb-8">{text.valueTitle}</h2>
                </ScrollReveal>
                <ScrollReveal delay={100}>
                  <div className="space-y-3">
                    {VALUE_HIGHLIGHTS[language].map((item, i) => (
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
                      <h3 className="font-oswald text-xl font-bold text-slate-900">{text.audienceCardTitle}</h3>
                    </div>
                    <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                      {text.audienceCardDesc}
                    </p>
                    <div className="space-y-3">
                      {ASISTENTES[language].slice(0, 4).map((a, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                          <a.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="font-medium">{a.title}</span>
                        </div>
                      ))}
                    </div>
                    <a href="#registro" className="btn-primary w-full mt-8 py-3 text-sm justify-center">
                      {text.audienceCardCTA} <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            7. AUDIENCIA + PROVEEDORES
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#F8FAFC" />
        <section id="audiencia" className="py-20 sm:py-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <span className="section-label">{text.participantsLabel}</span>
                <h2 className="section-title mt-3">{text.participantsTitle}</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  {text.participantsDesc}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
              {ASISTENTES[language].map((a, i) => (
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
                    <span className="section-label text-xs">{text.providersLabel}</span>
                    <h3 className="font-oswald text-2xl font-bold text-slate-900 mt-2">{text.providersTitle}</h3>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                      {text.providersDesc}
                    </p>
                  </div>
                  <div className="md:w-3/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROVEEDORES[language].map((prov, i) => (
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
        <section className="bg-gradient-to-br from-blue-900 via-blue-900 to-blue-950 py-20 sm:py-28 relative overflow-hidden">
          {/* Background Photo — Business Hub atmosphere */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/gallery-hub.jpg"
              alt=""
              fill
              className="object-cover opacity-[0.18]"
              aria-hidden="true"
            />
          </div>
          {/* Gradient overlay to blend photo into brand color */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-blue-900/96 via-blue-900/80 to-blue-900/60" />
          {/* Decorative grid */}
          <div className="absolute inset-0 z-[2] opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "40px 40px"
          }} />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-3/5">
                <ScrollReveal>
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs text-white/90 font-semibold tracking-wider uppercase mb-6">
                    {text.networkingLabel}
                  </span>
                  <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-white leading-[1.15] mb-4">
                    {text.networkingTitle}
                  </h2>
                  <p className="text-blue-100/80 max-w-lg text-base leading-relaxed mb-6">
                    {text.networkingDesc}
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {text.networkingFeatures.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                        <CheckCircle2 className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={200}>
                  <a href="#registro" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg">
                    {text.networkingCTA} <ArrowRight className="w-4 h-4" />
                  </a>
                </ScrollReveal>
              </div>

              {/* Stats */}
              <div className="md:w-2/5">
                <div className="grid grid-cols-2 gap-4">
                  {text.networkingStats.map((stat, i) => {
                    const icons = [Users, Clock, Handshake, Award];
                    const Icon = icons[i];
                    return (
                      <ScrollReveal key={i} delay={i * 100}>
                        <div className="card-dark p-5 text-center group hover:-translate-y-1 transition-transform">
                          <Icon className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
                          <span className="font-oswald text-2xl font-bold text-white block">{stat.number}</span>
                          <span className="text-[10px] text-blue-200/60 tracking-widest font-semibold">{stat.label}</span>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            10. PRICING / ACCESOS
           ═══════════════════════════════════════════════════════════ */}
        <section id="accesos" className="rhythm-pause-lg bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-6">
                <span className="section-label">{text.pricingLabel}</span>
                <h2 className="section-title mt-3">{text.pricingTitle}</h2>
                <p className="text-slate-500 max-w-xl mx-auto mt-4">
                  {text.pricingDesc}
                </p>
              </div>
            </ScrollReveal>

            {/* Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {PRICING[language].map((plan, i) => (
                <ScrollReveal key={plan.id} delay={i * 100}>
                  <div
                    className={`relative p-8 rounded-2xl h-full flex flex-col transition-all duration-300 ${plan.featured
                        ? "text-white border-2 border-amber-400/70 shadow-2xl md:scale-[1.03]"
                        : "bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-blue-300"
                      }`}
                    style={plan.featured ? {
                      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #111827 100%)",
                      boxShadow: "0 25px 50px -12px rgba(217, 119, 6, 0.4)",
                    } : undefined}
                  >
                    <h3 className={`font-oswald text-xl font-bold ${plan.featured ? "text-amber-300" : "text-slate-900"}`}>
                      {plan.label}
                    </h3>
                    <p className={`text-sm mt-1 ${plan.featured ? "text-amber-100/80" : "text-slate-400"}`}>
                      {plan.desc}
                    </p>
                    <div className="mt-6 mb-6">
                      <span className={`font-oswald text-4xl font-bold ${plan.featured ? "text-white" : "text-slate-900"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm ml-1 ${plan.featured ? "text-amber-100/80" : "text-slate-400"}`}>MXN</span>
                      <p className={`text-xs mt-1 ${plan.featured ? "text-amber-200/70" : "text-slate-400"}`}>{text.taxNote}</p>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className={`flex items-center gap-2 text-sm ${plan.featured ? "text-amber-50/95" : "text-slate-600"}`}>
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.featured ? "text-amber-300" : "text-blue-500"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#registro"
                      className={`w-full py-3.5 rounded-lg font-bold text-sm text-center block transition-all ${plan.featured
                          ? "bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-lg"
                          : "btn-primary"
                        }`}
                    >
                      {text.getAccessBtn}
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
                    <h3 className="font-oswald text-lg font-bold text-slate-900 mb-1">{text.paymentTitle}</h3>
                    {/* dangerouslySetInnerHTML is intentional: content is authored in UI_TEXT (this file),
                        not user-supplied. It only contains <strong> tags. Do NOT replace with user data. */}
                    <p className="text-sm text-slate-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: text.paymentIntroHtml }} />
                    <div className="grid sm:grid-cols-3 gap-3">
                      {text.paymentSteps.map((s) => (
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
                      {text.paymentQuestionsPrefix}{" "}
                      <a href="mailto:Contacto@LanzLogistics.com" className="text-blue-600 hover:underline font-medium">Contacto@LanzLogistics.com</a>
                      {" "}{text.paymentOr} <a href="tel:+19565158070" className="text-blue-600 hover:underline font-medium">+1 (956) 515-8070</a>
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* ═══ CINEMATIC STRIP — Expo Comercial ═══ */}
        <div className="photo-strip">
          <Image
            src="/images/gallery-stands.jpg"
            alt={text.galleryStripAlt}
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div
            className="photo-strip-overlay"
            style={{
              background:
                "linear-gradient(to right, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 50%, rgba(15,23,42,0.72) 100%)",
            }}
          />
          <div className="photo-strip-content">
            <ScrollReveal>
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-cyan-300/90 mb-3">
                SC Security Summit 2026
              </p>
              <h3 className="font-oswald text-3xl sm:text-5xl font-bold text-white leading-tight drop-shadow-xl">
                {language === "es" ? "300+ Empresas. 1 Espacio." : "300+ Companies. 1 Space."}
              </h3>
              <p className="text-blue-100/70 text-sm sm:text-base mt-3 max-w-md">
                {language === "es"
                  ? "El ecosistema B2B más completo del norte de México."
                  : "The most complete B2B ecosystem in northern Mexico."}
              </p>
            </ScrollReveal>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            11. PATROCINADORES
           ═══════════════════════════════════════════════════════════ */}
        <WaveSeparator color="#F8FAFC" />
        <section id="patrocinadores" className="sponsors-section py-20 sm:py-28 relative overflow-hidden">
          <div className="sponsors-bg-glow" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-14 sm:mb-16">
                <span className="section-label justify-center">{text.sponsorsLabel}</span>
                <h2 className="section-title mt-3">{text.sponsorsTitle}</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                  {text.sponsorsDesc}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {SPONSORS[language].map((s, i) => {
                const meta = SPONSOR_TIER_META[i];
                const TierIcon = meta.icon;
                const levelLabel = String(meta.level).padStart(2, "0");
                const benefitsCount = s.benefits.length;
                return (
                  <ScrollReveal key={i} delay={i * 100}>
                    <div
                      className={`sponsor-card relative h-full flex flex-col rounded-2xl bg-white border border-slate-200/70 overflow-hidden transition-all duration-500 ${meta.ring} ${
                        meta.featured ? "sponsor-card--featured" : ""
                      }`}
                    >
                      <div className={`h-1.5 w-full ${meta.stripe}`} aria-hidden="true" />

                      {meta.featured && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900 text-slate-50 text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full shadow-md">
                          <Sparkles className="w-3 h-3" />
                          <span>{text.sponsorExclusiveBadge}</span>
                        </div>
                      )}
                      {meta.highlighted && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full shadow-md">
                          <Star className="w-3 h-3 fill-white" />
                          <span>{text.sponsorRecommendedBadge}</span>
                        </div>
                      )}

                      <div className="p-6 pb-5 flex flex-col flex-1">
                        <div className="flex items-start gap-3 mb-5">
                          <div
                            className={`relative w-12 h-12 rounded-xl ${meta.iconBg} ${meta.iconFg} flex items-center justify-center shadow-lg flex-shrink-0`}
                            aria-hidden="true"
                          >
                            <TierIcon className="w-6 h-6" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full ${meta.chipBg} ${meta.chipFg}`}>
                              <span>{text.sponsorTierLabel}</span>
                              <span className="font-mono">{levelLabel}</span>
                            </div>
                            <h3 className="font-oswald text-lg font-bold text-slate-900 mt-1.5 leading-tight">
                              {s.tier}
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-5">
                          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {text.sponsorStandLabel}
                            </p>
                            <p className={`text-sm font-bold mt-0.5 ${meta.accent}`}>{meta.stand}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {text.sponsorSlotsLabel}
                            </p>
                            <p className={`text-sm font-bold mt-0.5 ${meta.accent}`}>
                              <span className="font-mono">{meta.slotsTotal}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            {benefitsCount} {text.sponsorBenefitsLabel}
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${meta.accent}`}>
                            {"●".repeat(Math.min(benefitsCount, 5)).split("").join(" ")}
                          </span>
                        </div>

                        <ul className="space-y-2 flex-1">
                          {s.benefits.map((b, j) => (
                            <li key={j} className="flex items-start gap-2 text-[13px] leading-snug text-slate-600">
                              <CheckCircle2 className={`w-4 h-4 ${meta.accent} flex-shrink-0 mt-0.5`} />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>

                        <a
                          href={`mailto:Contacto@LanzLogistics.com?subject=${encodeURIComponent(`Patrocinio ${s.tier} – Summit 2026`)}`}
                          className="sponsor-cta inline-flex items-center justify-center gap-2 mt-6 w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all bg-slate-900 text-white hover:bg-slate-800"
                        >
                          {text.sponsorRequestInfo}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
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
                  <MapPin className="w-4 h-4" /> {text.locationLabel}
                </span>
                <h2 className="section-title mt-3">{text.locationTitle}</h2>
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
                        <h4 className="font-bold text-slate-800 text-sm">{text.addressLabel}</h4>
                        <p className="text-sm text-slate-700 font-medium mt-1">{text.addressName}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{text.addressLine1}</p>
                        <p className="text-sm text-slate-500">{text.addressLine2}</p>
                        <a
                          href="https://maps.google.com/?q=Blvd.+Morelos+190,+Col.+Longoria,+88630+Reynosa,+Tamaulipas,+Mexico"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" /> {text.viewOnMaps}
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
                        <h4 className="font-bold text-slate-800 text-sm">{text.datesLabel}</h4>
                        <p className="text-sm text-slate-500 mt-1">{text.datesValue}</p>
                        <p className="text-xs text-slate-400 mt-1">{text.datesHours}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-elevated p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{text.contactLabel}</h4>
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
        <section id="faq" className="rhythm-pause-md bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-12">
                <span className="section-label">{text.faqLabel}</span>
                <h2 className="section-title mt-3">{text.faqTitle}</h2>
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
                <span className="section-label">{text.regLabel}</span>
                <h2 className="section-title mt-3">{text.regTitle}</h2>
                <p className="text-slate-500 max-w-xl mx-auto mt-4">
                  {text.regDesc}
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
                {text.finalCTATitlePart1}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                  {text.finalCTATitlePart2}
                </span>
              </h2>
              <p className="text-blue-100/60 mt-4 max-w-xl mx-auto">
                {text.finalCTADesc}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <a href="#registro" className="btn-primary px-8 py-4 text-base">
                  {text.registerNowBtn} <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="mailto:Contacto@LanzLogistics.com"
                  className="btn-outline px-8 py-4 text-base border-white/30 text-white hover:bg-white/10"
                >
                  {text.contactOrg}
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
                  {text.footerDesc}
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  {text.footerPresentedBy} <span className="text-blue-400 font-semibold">Lanz Logistics</span> + <span className="text-blue-400 font-semibold">Thynk Unlimited</span>
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">{text.footerEvent}</h4>
                <nav className="flex flex-col gap-2.5">
                  {FOOTER_LINKS[language].map((l) => (
                    <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-oswald text-sm font-bold text-white uppercase tracking-wider mb-4">{text.footerContact}</h4>
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
                {text.footerCopyright}
              </p>
              <div className="flex items-center gap-6">
                <a href="/aviso-de-privacidad" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  {text.footerPrivacy}
                </a>
                <a href="/terminos-y-condiciones" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  {text.footerTerms}
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
