export const BASE_URL = "https://www.scsecuritysummit.com" as const;

export const PRECIOS = {
  estudiante: 850,
  general: 2500,
  vip: 4800,
} as const;

export type IconKey =
  | "shield-check"
  | "network"
  | "handshake"
  | "building-2"
  | "truck"
  | "globe"
  | "shopping-cart"
  | "monitor"
  | "eye"
  | "satellite"
  | "scan-line"
  | "book-open"
  | "mic-2"
  | "target"
  | "crown"
  | "trophy"
  | "medal"
  | "gem"
  | "ruler"
  | "layout-grid"
  | "users";

export const NAV_LINKS = {
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

export const FOOTER_LINKS = {
  es: [
    { href: "#enfoque", label: "Enfoque" },
    { href: "#speakers", label: "Conferencistas" },
    { href: "#agenda", label: "Agenda" },
    { href: "#audiencia", label: "Audiencia" },
    { href: "#accesos", label: "Accesos" },
    { href: "#patrocinadores", label: "Patrocinadores" },
    { href: "#ubicacion", label: "Ubicación" },
    { href: "#faq", label: "FAQ" },
  ],
  en: [
    { href: "#enfoque", label: "Focus" },
    { href: "#speakers", label: "Speakers" },
    { href: "#agenda", label: "Agenda" },
    { href: "#audiencia", label: "Audience" },
    { href: "#accesos", label: "Passes" },
    { href: "#patrocinadores", label: "Sponsors" },
    { href: "#ubicacion", label: "Location" },
    { href: "#faq", label: "FAQ" },
  ],
} as const;

export const UI_TEXT = {
  es: {
    skipToForm: "Ir al formulario de registro",
    switchLangLabel: "Cambiar a inglés",
    registerBtn: "REGISTRARME",
    dateLocation: "24 de septiembre, 2026 · Reynosa, Tamaulipas",
    heroAlt: "Summit de Seguridad en la Cadena de Suministros",
    heroTitlePrefix: "SUMMIT DE SEGURIDAD EN LA",
    heroTitleHighlight: "CADENA DE SUMINISTROS",
    heroDescription:
      "El punto de encuentro estratégico para blindar tu operación, accede a las soluciones de seguridad y cumplimiento que garantizan tu flujo comercial y conecta con socios clave para generar nuevas oportunidades B2B.",
    countdownLabel: "Faltan",
    registerNowBtn: "REGISTRARME AHORA",
    sponsorBtn: "PATROCINAR EL EVENTO",
    presentedBy: "Presentado por",
    whyAttendLabel: "POR QUÉ SER PARTE DEL SUMMIT",
    whyAttendTitle: "Por Qué Ser Parte del Summit",
    whyAttendDesc:
      "Lidera la integridad de la cadena de suministro. Implementa las mejores prácticas en seguridad para minimizar riesgos y garantizar la eficiencia operativa de tus rutas internacionales.",
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
    eventDayValue: "24 de septiembre, 2026",
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
      "Networking el día del evento",
    ],
    networkingCTA: "RESERVAR MI LUGAR",
    networkingStats: [
      { number: "500+", label: "LUGARES DISPONIBLES" },
      { number: "15+", label: "HORAS DE NETWORKING" },
      { number: "1", label: "DÍA DE EVENTO" },
      { number: "4", label: "SECTORES DE LA CADENA DE SUMINISTROS" },
    ],
    pricingLabel: "TIPOS DE ACCESO",
    pricingTitle: "Elige Tu Acceso",
    pricingDesc:
      "Un día de capacitación especializada · 24 de septiembre de 2026 · Centro de Convenciones, Reynosa",
    taxNote: "* Más I.V.A.",
    getAccessBtn: "OBTENER ACCESO",
    mostPopular: "MÁS POPULAR",
    paymentTitle: "¿Cómo funciona el proceso de pago?",
    paymentIntro: {
      parts: [
        { text: "Al completar el formulario de registro recibirás un " },
        { text: "folio de confirmación", strong: true },
        { text: " en pantalla. Un representante de Lanz Logistics te contactará en un plazo de " },
        { text: "24–48 horas hábiles", strong: true },
        {
          text: " con las instrucciones de pago (transferencia bancaria o depósito). Tu lugar queda reservado una vez confirmado el pago.",
        },
      ],
    },
    paymentSteps: [
      { step: "1", title: "Regístrate", desc: "Llena el formulario y recibe tu folio en pantalla" },
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
    datesValue: "24 de septiembre, 2026",
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
      "1er Summit de Seguridad en la Cadena de Suministros. 24 de septiembre, 2026. Centro de Convenciones de Reynosa, Tamaulipas, México.",
    footerPresentedBy: "Presentado por",
    footerEvent: "Evento",
    footerContact: "Contacto",
    footerCopyright: "© 2026 SC Security Summit. Todos los derechos reservados.",
    footerPrivacy: "Aviso de Privacidad",
    footerTerms: "Términos y Condiciones",
    galleryLabel: "ASÍ SERÁ EL SUMMIT",
    galleryTitle: "Así Será el Summit",
    galleryDesc:
      "Cuatro áreas de actividad diseñadas para maximizar tu experiencia y el valor que llevas a tu empresa.",
    galleryTag1: "Expo Comercial",
    galleryTag2: "Registro & Bienvenida",
    galleryTag3: "Conferencia Magistral",
    galleryTag4: "Business Hub B2B",
    galleryStripAlt: "Sala de exposición — SC Security Summit",
  },
  en: {
    skipToForm: "Skip to registration form",
    switchLangLabel: "Switch to Spanish",
    registerBtn: "REGISTER",
    dateLocation: "September 24, 2026 · Reynosa, Tamaulipas",
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
    eventDayValue: "September 24, 2026",
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
      "Networking on event day",
    ],
    networkingCTA: "RESERVE MY SPOT",
    networkingStats: [
      { number: "500+", label: "AVAILABLE SEATS" },
      { number: "15+", label: "NETWORKING HOURS" },
      { number: "1", label: "EVENT DAY" },
      { number: "4", label: "INDUSTRY SECTORS" },
    ],
    pricingLabel: "ACCESS TYPES",
    pricingTitle: "Choose Your Pass",
    pricingDesc:
      "One day of specialized training · September 24, 2026 · Reynosa Convention Center",
    taxNote: "* Plus VAT",
    getAccessBtn: "GET ACCESS",
    mostPopular: "MOST POPULAR",
    paymentTitle: "How does the payment process work?",
    paymentIntro: {
      parts: [
        { text: "After completing the registration form you will receive a " },
        { text: "confirmation code", strong: true },
        { text: " on screen. A Lanz Logistics representative will contact you within " },
        { text: "24–48 business hours", strong: true },
        {
          text: " with payment instructions (bank transfer or deposit). Your spot is reserved once payment is confirmed.",
        },
      ],
    },
    paymentSteps: [
      { step: "1", title: "Register", desc: "Fill out the form and receive your code on screen" },
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
    datesValue: "September 24, 2026",
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
      "1st Supply Chain Security Summit. September 24, 2026. Reynosa Convention Center, Tamaulipas, Mexico.",
    footerPresentedBy: "Presented by",
    footerEvent: "Event",
    footerContact: "Contact",
    footerCopyright: "© 2026 SC Security Summit. All rights reserved.",
    footerPrivacy: "Privacy Notice",
    footerTerms: "Terms and Conditions",
    galleryLabel: "WHAT AWAITS THE SUMMIT",
    galleryTitle: "What to Expect",
    galleryDesc:
      "Four activity areas designed to maximize your experience and the value you take back to your company.",
    galleryTag1: "Commercial Expo",
    galleryTag2: "Registration & Welcome",
    galleryTag3: "Keynote Session",
    galleryTag4: "Business Hub B2B",
    galleryStripAlt: "Exhibition hall — SC Security Summit",
  },
} as const;

export const HERO_STATS = {
  es: [
    { number: 10, suffix: "", label: "Horas de Capacitación" },
    { number: 3, suffix: "+", label: "Conferencistas Confirmados" },
    { number: 500, suffix: "+", label: "Lugares Disponibles" },
  ],
  en: [
    { number: 10, suffix: "", label: "Training Hours" },
    { number: 3, suffix: "+", label: "Confirmed Speakers" },
    { number: 500, suffix: "+", label: "Available Seats" },
  ],
} as const;

export const PILARES = {
  es: [
    {
      icon: "shield-check",
      title: "Cumplimiento y actualización",
      desc: "Accede a contenido de alto valor sobre certificaciones de seguridad, comercio exterior, gestión de riesgos y cumplimiento operativo con enfoque en estándares internacionales.",
      bullets: [
        "Tendencias y regulaciones vigentes",
        "Mejores prácticas internacionales",
        "Gestión de riesgos y controles",
      ],
      number: "01",
    },
    {
      icon: "network",
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
      icon: "handshake",
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
      icon: "shield-check",
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
      icon: "network",
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
      icon: "handshake",
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

export const SPEAKERS = {
  es: [
    {
      name: "Isidoro Juárez",
      role: "Mandatario Aduanal Certificado",
      topic: "Aduanas & Compliance",
      image: "/images/speaker-isidoro.webp",
    },
    {
      name: "Julio César Suárez",
      role: "Líder en Trade Compliance e Innovación",
      topic: "Trade Compliance",
      image: "/images/speaker-julio.webp",
    },
    {
      name: "Eduardo Luna",
      role: "Organización Operativa y Expansión Comercial",
      topic: "Organización & Expansión",
      image: "/images/speaker-eduardo.webp",
    },
  ],
  en: [
    {
      name: "Isidoro Juárez",
      role: "Certified Customs Broker",
      topic: "Customs & Compliance",
      image: "/images/speaker-isidoro.webp",
    },
    {
      name: "Julio César Suárez",
      role: "Trade Compliance & Innovation Leader",
      topic: "Trade Compliance",
      image: "/images/speaker-julio.webp",
    },
    {
      name: "Eduardo Luna",
      role: "Operational Organization & Commercial Expansion",
      topic: "Organization & Expansion",
      image: "/images/speaker-eduardo.webp",
    },
  ],
} as const;

export const ASISTENTES = {
  es: [
    { title: "Operaciones y Cadena de Suministro", desc: "Directores, gerentes, supervisores y coordinadores", icon: "building-2" },
    { title: "Logística y Transporte", desc: "Responsables de tráfico, distribución y transporte", icon: "truck" },
    { title: "Aduanas y Comercio Exterior", desc: "Import-export, cumplimiento aduanero y agencias aduanales", icon: "globe" },
    { title: "Seguridad patrimonial y corporativa", desc: "Protección de instalaciones, unidades, personal y mercancías", icon: "shield-check" },
    { title: "Abastecimiento y Compras", desc: "Compradores y gestión de proveedores", icon: "shopping-cart" },
    { title: "Tecnología, Sistemas y Ciberseguridad", desc: "Monitoreo, innovación IT y seguridad informática", icon: "monitor" },
    { title: "Recursos Humanos", desc: "Reclutamiento, capacitación y entrenamiento", icon: "users" },
  ],
  en: [
    { title: "Operations & Supply Chain", desc: "Directors, managers, supervisors and coordinators", icon: "building-2" },
    { title: "Logistics & Transportation", desc: "Traffic, distribution and transport leads", icon: "truck" },
    { title: "Customs & Foreign Trade", desc: "Import-export, customs compliance and customs brokers", icon: "globe" },
    { title: "Asset & Corporate Security", desc: "Protection of facilities, units, personnel and goods", icon: "shield-check" },
    { title: "Sourcing & Procurement", desc: "Buyers and supplier management", icon: "shopping-cart" },
    { title: "Technology, Systems & Cybersecurity", desc: "Monitoring, IT innovation and information security", icon: "monitor" },
    { title: "Human Resources", desc: "Recruitment, training and development", icon: "users" },
  ],
} as const;

export const PROVEEDORES = {
  es: [
    { title: "Transportistas", icon: "truck" },
    { title: "Agencias Aduanales", icon: "globe" },
    { title: "Videovigilancia CCTV", icon: "eye" },
    { title: "Telemetría GPS", icon: "satellite" },
    { title: "Control de Acceso", icon: "scan-line" },
    { title: "Consultoría", icon: "book-open" },
  ],
  en: [
    { title: "Carriers", icon: "truck" },
    { title: "Customs Brokers", icon: "globe" },
    { title: "CCTV Surveillance", icon: "eye" },
    { title: "GPS Telemetry", icon: "satellite" },
    { title: "Access Control", icon: "scan-line" },
    { title: "Consulting", icon: "book-open" },
  ],
} as const;

export const PRICING = {
  es: [
    {
      id: "vip",
      label: "Acceso VIP",
      price: "$4,800",
      featured: true,
      desc: "Ejecutivos y tomadores de decisión",
      features: [
        "Acceso a conferencias especializadas",
        "Acceso a workshops estratégicos y sesiones especiales dentro del Business Hub",
        "Participación prioritaria en Q&A de conferencias y paneles de expertos",
        "Acceso al Business Hub para networking empresarial, previo registro",
        "Asesoría especializada durante el evento en temas CTPAT/OEA",
        "Asiento preferente en sesiones principales",
        "Constancia de participación",
        "Material descargable, recursos y plantillas de trabajo",
        "Coffee break durante el evento",
        "Kit de bienvenida premium",
        "Gafete y pulsera de acceso",
      ],
    },
    {
      id: "general",
      label: "Acceso General",
      price: "$2,500",
      featured: false,
      desc: "Profesionales y operación",
      features: [
        "Acceso a conferencias especializadas",
        "Acceso a paneles con expertos de la industria",
        "Constancia de participación",
        "Kit de bienvenida",
        "Gafete de acceso",
      ],
    },
    {
      id: "estudiante",
      label: "Acceso Estudiante",
      price: "$850",
      featured: false,
      desc: "Perfil académico con credencial vigente / Cupo limitado",
      features: [
        "Acceso a conferencias especializadas",
        "Kit básico de bienvenida",
        "Gafete de acceso",
        "Constancia de participación disponible con costo preferencial",
      ],
    },
  ],
  en: [
    {
      id: "vip",
      label: "VIP Pass",
      price: "$4,800",
      featured: true,
      desc: "Executives and decision makers",
      features: [
        "Access to specialized conferences",
        "Access to strategic workshops and special sessions within the Business Hub",
        "Priority participation in Q&A at conferences and expert panels",
        "Business Hub access for corporate networking (pre-registration required)",
        "Specialized advisory during the event on CTPAT/OEA topics",
        "Priority seating at main sessions",
        "Certificate of participation",
        "Downloadable materials, resources, and work templates",
        "Coffee break during the event",
        "Premium welcome kit",
        "Access badge and wristband",
      ],
    },
    {
      id: "general",
      label: "General Pass",
      price: "$2,500",
      featured: false,
      desc: "Professionals and operations",
      features: [
        "Access to specialized conferences",
        "Access to industry expert panels",
        "Certificate of participation",
        "Welcome kit",
        "Access badge",
      ],
    },
    {
      id: "estudiante",
      label: "Student Pass",
      price: "$850",
      featured: false,
      desc: "Academic profile with valid ID / Limited spots",
      features: [
        "Access to specialized conferences",
        "Basic welcome kit",
        "Access badge",
        "Certificate of participation available at preferential cost",
      ],
    },
  ],
} as const;

export const PRICING_STRIPE = {
  general: "bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300",
  vip: "bg-gradient-to-r from-blue-800 via-cyan-400 to-blue-800",
  estudiante: "bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300",
} as const;

export type SponsorTierMeta = {
  level: number;
  icon: IconKey;
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

export const SPONSOR_TIER_META: readonly SponsorTierMeta[] = [
  {
    level: 1,
    icon: "crown",
    slotsTotal: 9,
    stand: "6 × 6 m",
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
    icon: "trophy",
    slotsTotal: 12,
    stand: "3 × 3 m",
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
    icon: "medal",
    slotsTotal: 12,
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
    icon: "gem",
    slotsTotal: 10,
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
] as const;

export const SPONSORS = {
  es: [
    {
      tier: "Patrocinador Platino",
      benefits: [
        "Acceso al Business Hub para generación de relaciones comerciales y networking estratégico con tomadores de decisión",
        "Acceso a directorio de contactos potenciales autorizados del evento para seguimiento comercial posterior",
        "Presentación comercial exclusiva de 10 minutos ante audiencia estratégica dentro del Business Hub",
        "Stand premium en ubicación principal del evento con espacio de 6m × 6m",
        "Campaña de difusión destacada en redes sociales y mailing antes, durante y después del evento",
        "Presencia de marca en materiales impresos y digitales: flyers, banners, sitio web, redes sociales, señalética y piezas promocionales",
        "Proyección de reel publicitario en pantallas oficiales del evento",
        "Inclusión de material promocional de la empresa en el kit de bienvenida para asistentes",
        "Mención institucional destacada durante la inauguración y clausura del evento",
        "10 accesos VIP a conferencias principales",
        "Capacitación in company de 4 horas para personal de la empresa patrocinadora",
        "Emisión de constancias de capacitación y formato DC-3 para participantes de la capacitación",
        "Servicio de coffee break disponible en el área asignada del patrocinador",
      ],
    },
    {
      tier: "Patrocinador Oro",
      benefits: [
        "Stand comercial en área preferencial de circulación del evento con espacio de 3m × 3m",
        "Acceso al Business Hub para actividades de networking y vinculación comercial",
        "Presencia de marca en materiales impresos y digitales del evento: flyers, banners, sitio web y redes sociales",
        "Publicación individual en redes sociales como patrocinador Oro",
        "Inclusión en mailing oficial del evento",
        "Mención institucional durante la inauguración",
        "6 accesos VIP a conferencias y actividades principales del evento",
        "Constancia de participación en el evento",
        "Inclusión de material promocional de la empresa en el kit de bienvenida para asistentes",
      ],
    },
    {
      tier: "Patrocinador Plata",
      benefits: [
        "Stand estándar en área de exhibición general con espacio de 3m × 3m",
        "Logo en material digital del evento: sitio web y redes sociales",
        "Publicación en redes sociales como patrocinador Plata",
        "4 accesos preferenciales a conferencias",
        "Constancia de asistencia al evento",
        "Mención como patrocinador Plata en el directorio digital del evento",
      ],
    },
    {
      tier: "Proveedor Participante de Soluciones de Seguridad",
      benefits: [
        "Stand estándar de exhibición con espacio de 3m × 3m en zona especializada de proveedores",
        "1 acceso general a conferencias del evento",
        'Identificación especial como "Proveedor participante de soluciones de seguridad"',
      ],
    },
  ],
  en: [
    {
      tier: "Platinum Sponsor",
      benefits: [
        "Business Hub access for commercial relationship building and strategic networking with decision makers",
        "Access to the event's authorized directory of potential contacts for post-event commercial follow-up",
        "Exclusive 10-minute commercial presentation before a strategic audience within the Business Hub",
        "Premium booth in the main location of the event with a 6m × 6m space",
        "Featured social media and email campaign before, during, and after the event",
        "Brand presence on printed and digital materials: flyers, banners, website, social media, signage, and promotional pieces",
        "Advertising reel on official event screens",
        "Inclusion of company promotional material in the attendee welcome kit",
        "Featured institutional mention at the event opening and closing ceremonies",
        "10 VIP passes to main conferences",
        "4-hour in-company training for the sponsor's staff",
        "Training certificates and DC-3 format for training participants",
        "Coffee break service available in the sponsor's designated area",
      ],
    },
    {
      tier: "Gold Sponsor",
      benefits: [
        "Commercial booth in a preferred circulation area of the event with a 3m × 3m space",
        "Business Hub access for networking and commercial engagement",
        "Brand presence on printed and digital event materials: flyers, banners, website, and social media",
        "Individual post on social media as a Gold Sponsor",
        "Inclusion in the official event mailing",
        "Institutional mention at the opening ceremony",
        "6 VIP passes to main conferences and activities",
        "Certificate of participation at the event",
        "Inclusion of company promotional material in the attendee welcome kit",
      ],
    },
    {
      tier: "Silver Sponsor",
      benefits: [
        "Standard booth in the general exhibition area with a 3m × 3m space",
        "Logo on digital event materials: website and social media",
        "Social media post as a Silver Sponsor",
        "4 preferential passes to conferences",
        "Certificate of attendance at the event",
        "Mention as Silver Sponsor in the official digital directory",
      ],
    },
    {
      tier: "Participating Security Solutions Provider",
      benefits: [
        "Standard exhibition booth with a 3m × 3m space in the specialized providers zone",
        "1 general pass to event conferences",
        '"Participating security solutions provider" special identification',
      ],
    },
  ],
} as const;

export const VALUE_HIGHLIGHTS = {
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

export const WHY_ATTEND = {
  es: [
    {
      icon: "book-open",
      title: "Actualización Estratégica",
      desc: "Temas actuales y especializados sobre seguridad, logística, comercio exterior y cumplimiento.",
    },
    {
      icon: "mic-2",
      title: "Expertos del Sector",
      desc: "Speakers y panelistas con experiencia práctica en operaciones, compliance y estrategia",
    },
    {
      icon: "target",
      title: "Impacto Real",
      desc: "Ideas, herramientas y contactos que pueden traducirse en mejoras concretas para tu empresa.",
    },
    {
      icon: "globe",
      title: "Visión Binacional y Comercial",
      desc: "Perspectiva binacional para impulsar comercio, colaboración y crecimiento.",
    },
  ],
  en: [
    {
      icon: "book-open",
      title: "Strategic Update",
      desc: "Master the standards to anticipate risks before they disrupt your operation",
    },
    {
      icon: "mic-2",
      title: "Industry Experts",
      desc: "Speakers and panelists with hands-on experience in operations, compliance and strategy",
    },
    {
      icon: "target",
      title: "Real Impact",
      desc: "Turn compliance into a competitive advantage that opens new B2B sales channels",
    },
    {
      icon: "globe",
      title: "Binational & Commercial Vision",
      desc: "Networking with decision-makers who are shaping the future of logistics security and improvements for your company",
    },
  ],
} as const;

export const FAQ_ITEMS = [
  {
    question: "¿Dónde y cuándo se llevará a cabo el Summit?",
    answer:
      "El Summit se realizará el 24 de septiembre de 2026 en el Centro de Convenciones de Reynosa, Tamaulipas, México. Las actividades comienzan a las 8:00 AM y se extienden hasta las 5:30 PM.",
  },
  {
    question: "¿A quién está dirigido este evento?",
    answer:
      "Está diseñado para profesionales y ejecutivos del sector de cadena de suministros: directores de operaciones, gerentes de logística, especialistas en comercio exterior, responsables de compliance, entre otros perfiles clave en la industria.",
  },
  {
    question: "¿Cómo puedo convertirme en patrocinador?",
    answer:
      "Contáctanos directamente a hola@scsecuritysummit.com.mx o al +1 (956) 515-8070. Te enviaremos el kit de patrocinio con los diferentes niveles de participación (Platino, Oro, Plata y Proveedor Participante de Soluciones de Seguridad) y los beneficios detallados de cada uno.",
  },
  {
    question: "¿Qué incluye cada tipo de acceso?",
    answer:
      "El acceso Estudiante incluye capacitación de 1 día, acceso a paneles y constancia digital. El acceso General agrega Business Hub B2B, kit estándar y coffee break. El acceso VIP incluye todo lo anterior más asientos prioritarios, constancia física, kit completo y plantillas descargables.",
  },
  {
    question: "¿Puedo obtener factura (CFDI)?",
    answer:
      "Sí. Al momento de tu registro puedes indicar que requieres factura y proporcionar tus datos fiscales. El CFDI se emitirá dentro de las 72 horas posteriores a la confirmación de tu pago.",
  },
  {
    question: "¿El acceso estudiantil requiere credencial?",
    answer:
      "Sí, es necesario presentar credencial vigente de la institución educativa al momento del check-in el día del evento. Este acceso es exclusivo para estudiantes activos de nivel licenciatura o posgrado.",
  },
] as const;

export const FAQ_ITEMS_EN = [
  {
    question: "Where and when will the Summit take place?",
    answer:
      "The Summit will be held on September 24, 2026, at the Reynosa Convention Center in Reynosa, Tamaulipas, Mexico. Activities begin at 8:00 AM and run through 5:30 PM.",
  },
  {
    question: "Who is this event designed for?",
    answer:
      "It is designed for supply chain professionals and executives: operations directors, logistics managers, foreign trade specialists, compliance leaders, and other key industry profiles.",
  },
  {
    question: "How can I become a sponsor?",
    answer:
      "Contact us at hola@scsecuritysummit.com.mx or +1 (956) 515-8070. We will send the sponsorship kit with participation levels (Platinum, Gold, Silver, and Participating Security Solutions Provider) and the benefits for each tier.",
  },
  {
    question: "What is included with each access type?",
    answer:
      "Student access includes 1-day training, panel access, and a digital certificate. General access adds Business Hub B2B, a standard kit, and coffee break. VIP includes all of the above plus priority seating, printed certificate, full kit, and downloadable templates.",
  },
  {
    question: "Can I request an invoice (CFDI)?",
    answer:
      "Yes. During registration you can indicate that you need an invoice and submit your tax details. The CFDI will be issued within 72 hours after payment confirmation.",
  },
  {
    question: "Does the student pass require an ID?",
    answer:
      "Yes, you must present a valid student ID from your institution during event check-in. This pass is only for active undergraduate or graduate students.",
  },
] as const;

export const CONTENT = {
  es: {
    nav: NAV_LINKS.es,
    footerLinks: FOOTER_LINKS.es,
    ui: UI_TEXT.es,
    heroStats: HERO_STATS.es,
    pillars: PILARES.es,
    speakers: SPEAKERS.es,
    attendees: ASISTENTES.es,
    providers: PROVEEDORES.es,
    pricing: PRICING.es,
    sponsorTierMeta: SPONSOR_TIER_META,
    sponsors: SPONSORS.es,
    valueHighlights: VALUE_HIGHLIGHTS.es,
    whyAttend: WHY_ATTEND.es,
    faq: FAQ_ITEMS,
  },
  en: {
    nav: NAV_LINKS.en,
    footerLinks: FOOTER_LINKS.en,
    ui: UI_TEXT.en,
    heroStats: HERO_STATS.en,
    pillars: PILARES.en,
    speakers: SPEAKERS.en,
    attendees: ASISTENTES.en,
    providers: PROVEEDORES.en,
    pricing: PRICING.en,
    sponsorTierMeta: SPONSOR_TIER_META,
    sponsors: SPONSORS.en,
    valueHighlights: VALUE_HIGHLIGHTS.en,
    whyAttend: WHY_ATTEND.en,
    faq: FAQ_ITEMS_EN,
  },
} as const;

export type Language = "es" | "en";
export type ContentSection<K extends keyof typeof CONTENT.es> = (typeof CONTENT.es)[K];
