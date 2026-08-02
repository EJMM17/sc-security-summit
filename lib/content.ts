export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://scsecuritysummit.com";
export const EVENTBRITE_URL =
  process.env.NEXT_PUBLIC_EVENTBRITE_URL?.trim() ||
  "https://www.eventbrite.com.mx/e/supply-chain-security-summit-tickets-1994843949954?aff=ebdsoporgprofile";

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
    { href: "#formacion", label: "Formación" },
    { href: "#programa", label: "Programa" },
    { href: "#especialistas", label: "Especialistas" },
    { href: "#accesos", label: "Accesos" },
    { href: "#registro", label: "Pase corporativo" },
    { href: "#patrocinadores", label: "Patrocinio" },
  ],
  en: [
    { href: "#formacion", label: "Training" },
    { href: "#programa", label: "Program" },
    { href: "#especialistas", label: "Specialists" },
    { href: "#accesos", label: "Passes" },
    { href: "#registro", label: "Corporate pass" },
    { href: "#patrocinadores", label: "Sponsorship" },
  ],
} as const;

export const FOOTER_LINKS = {
  es: [
    { href: "#formacion", label: "Formación" },
    { href: "#especialistas", label: "Especialistas" },
    { href: "#programa", label: "Programa" },
    { href: "#audiencia", label: "Audiencia" },
    { href: "#accesos", label: "Accesos" },
    { href: "#registro", label: "Pase corporativo" },
    { href: "#patrocinadores", label: "Patrocinio" },
    { href: "#ser-presentador", label: "Ser presentador" },
    { href: "#ubicacion", label: "Ubicación" },
    { href: "#faq", label: "FAQ" },
  ],
  en: [
    { href: "#formacion", label: "Training" },
    { href: "#especialistas", label: "Specialists" },
    { href: "#programa", label: "Program" },
    { href: "#audiencia", label: "Audience" },
    { href: "#accesos", label: "Passes" },
    { href: "#registro", label: "Corporate pass" },
    { href: "#patrocinadores", label: "Sponsorship" },
    { href: "#ser-presentador", label: "Be a presenter" },
    { href: "#ubicacion", label: "Location" },
    { href: "#faq", label: "FAQ" },
  ],
} as const;

export const UI_TEXT = {
  es: {
    skipToForm: "Ir al formulario de pases corporativos",
    switchLangLabel: "Cambiar a inglés",
    registerBtn: "CONSEGUIR ACCESOS",
    dateLocation: "24 de septiembre, 2026 · Reynosa, Tamaulipas",
    heroKicker: "SUMMIT PRESENCIAL · REYNOSA 2026",
    heroAlt: "Summit de Seguridad en la Cadena de Suministros",
    heroTitlePrefix: "Las mejores decisiones comienzan con una",
    heroTitleHighlight: "mejor formación",
    heroDescription:
      "Programa ejecutivo de formación especializada para profesionales responsables de proteger la seguridad, el cumplimiento y la continuidad de la cadena de suministro.",
    registerNowBtn: "CONSEGUIR ACCESOS",
    heroAgendaBtn: "VER PROGRAMA",
    sponsorBtn: "PATROCINAR EL EVENTO",
    presentedBy: "Presentado por",
    whyAttendLabel: "NO ES UNA EXPO",
    whyAttendTitle: "Es formación para quienes protegen la operación",
    whyAttendDesc:
      "La seguridad depende del criterio de las personas que identifican riesgos, aplican controles y toman decisiones cuando las condiciones cambian.",
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
    pillarsLabel: "COMPETENCIAS",
    pillarsTitle: "Una jornada para desarrollar competencias",
    pillarsDesc:
      "Competencias para actuar con mayor criterio dentro de tu organización.",
    speakersLabel: "ESPECIALISTAS CONFIRMADOS",
    speakersTitle: "Aprende de quienes enfrentan estos desafíos todos los días",
    speakersDesc:
      "Especialistas con experiencia directa en seguridad, cumplimiento, transporte, comercio exterior y continuidad operativa.",
    speakersMorePrefix: "Más conferencistas serán anunciados pronto.",
    speakersMoreCTA: "Regístrate para recibirlos primero →",
    speakerOpportunityTitle: "¿Quieres vincular tu marca con el Summit?",
    speakerOpportunityDesc:
      "Conoce las oportunidades para presentar soluciones ante una audiencia especializada.",
    speakerOpportunityCTA: "Conocer oportunidades",
    agendaLabel: "PROGRAMA EJECUTIVO",
    agendaTitle: "Tres dimensiones para fortalecer tu operación",
    agendaDesc:
      "Una ruta de aprendizaje que conecta visión, prevención, cumplimiento y aplicación.",
    valueLabel: "ASÍ SERÁ EL SUMMIT",
    valueTitle: "Una experiencia completa de formación",
    audienceCardTitle: "Perfil de Asistentes",
    audienceCardDesc:
      "Personal de la industria maquiladora, transportistas, agencias aduanales, compliance y seguridad de cadena de suministro.",
    audienceCardCTA: "Conseguir Accesos",
    eventDayLabel: "Día del evento",
    eventDayValue: "24 de septiembre, 2026",
    eventDayVenue: "Centro de Convenciones · Reynosa, Tamaulipas",
    participantsLabel: "A QUIÉN VA DIRIGIDO",
    participantsTitle: "Este programa es para ti si...",
    participantsDesc:
      "Para quienes mueven, protegen y fortalecen la cadena de suministro. Un punto de encuentro para líderes y especialistas en áreas clave.",
    providersLabel: "PROVEEDORES",
    providersTitle: "Ecosistema B2B",
    providersDesc:
      "Empresas especializadas en tecnología, seguridad y servicios para la industria y la cadena de suministro.",
    networkingLabel: "DEL APRENDIZAJE A LA IMPLEMENTACIÓN",
    networkingTitle: "Un espacio donde la formación se conecta con soluciones reales",
    networkingDesc:
      "Conoce servicios y especialistas que pueden ayudarte a aplicar en tu organización los criterios desarrollados durante el programa.",
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
    pricingTitle: "Elige tu experiencia de formación",
    pricingDesc:
      "Un día de capacitación especializada · 24 de septiembre de 2026 · Centro de Convenciones, Reynosa",
    taxNote: "* Más I.V.A.",
    getAccessBtn: "OBTENER ACCESO",
    mostPopular: "MÁS POPULAR",
    sponsorsLabel: "OPORTUNIDAD DE PATROCINIO",
    sponsorsTitle: "Lleva Tu Marca al Siguiente Nivel",
    sponsorsDesc:
      "Posiciona tu empresa como líder en seguridad de la cadena de suministros. Conecta directamente con más de 300 tomadores de decisión y maximiza tu visibilidad ante la audiencia que importa.",
    sponsorRequestInfo: "Quiero Ser Patrocinador",
    sponsorFormLabel: "SOLICITUD DE PATROCINIO",
    sponsorFormTitle: "Hablemos de Tu Marca",
    sponsorFormDesc:
      "Déjanos tus datos y un asesor se pondrá en contacto contigo para compartir disponibilidad y beneficios.",
    sponsorFormSubmit: "SOLICITAR INFORMACIÓN",
    sponsorSuccess: "Recibimos tu solicitud. Nuestro equipo se pondrá en contacto contigo.",
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
    addressLine1: "Libramiento Ote S/N, Azteca",
    addressLine2: "Reynosa, Tamaulipas, C.P. 88680",
    viewOnMaps: "Ver en Google Maps",
    loadInteractiveMap: "Cargar mapa interactivo",
    mapPrivacyNote:
      "Google Maps se carga solo cuando lo solicitas, evitando conexiones de terceros durante la visita inicial.",
    mapTitle: "Mapa del Centro de Convenciones de Reynosa",
    datesLabel: "Fechas",
    datesValue: "24 de septiembre, 2026",
    datesHours: "8:00 AM — 7:00 PM",
    contactLabel: "Contacto",
    faqLabel: "PREGUNTAS FRECUENTES",
    faqTitle: "Preguntas frecuentes",
    regLabel: "PASES CORPORATIVOS",
    regTitle: "Capacita a Tu Equipo Completo",
    regDesc:
      "Un solo pase, cobertura completa. Acceso para tu equipo a cualquier hora del día: cada departamento asiste al bloque que le corresponde.",
    corporateAccessTitle: "Hasta 10 Accesos Plus",
    corporateAccessNote: "DC-3 incluido para cada participante.",
    corporateSubmit: "SOLICITAR PASE CORPORATIVO",
    corporateSuccess: "Recibimos tu solicitud de pase corporativo. Te contactaremos muy pronto.",
    inquiryPrivacy:
      "Al continuar, aceptas que usemos tus datos únicamente para dar seguimiento a esta solicitud.",
    inquiryPrivacyLink: "Consulta el Aviso de Privacidad.",
    inquiryPreviewDisabled:
      "Vista previa: este formulario está desactivado y no recopila ni envía datos. Usa el sitio de producción para contactar al equipo.",
    inquiryPreviewDisabledButton: "NO DISPONIBLE EN VISTA PREVIA",
    inquirySending: "ENVIANDO...",
    inquiryInvalid: "Revisa los campos e inténtalo de nuevo.",
    inquiryRateLimited:
      "Has realizado varios intentos. Espera unos minutos antes de volver a intentar.",
    inquiryError:
      "No pudimos enviar tu solicitud en este momento. Escríbenos a hola@scsecuritysummit.com.",
    finalCTATitlePart1: "La seguridad comienza",
    finalCTATitlePart2: "formando mejores profesionales",
    finalCTADesc:
      "Invierte en desarrollar competencias que fortalecerán tu desempeño y la capacidad de respuesta de tu organización.",
    contactOrg: "CONTACTAR ORGANIZADOR",
    footerDesc:
      "1er Summit de Seguridad en la Cadena de Suministros. 24 de septiembre, 2026. Centro de Convenciones de Reynosa, Tamaulipas, México.",
    footerEvent: "Evento",
    footerContact: "Contacto",
    footerCopyright: "© 2026 SC Security Summit. Todos los derechos reservados.",
    footerPrivacy: "Aviso de Privacidad",
    footerTerms: "Términos y Condiciones",
    galleryLabel: "LA EXPERIENCIA",
    galleryTitle: "Diseñada para aprender, no solo para escuchar",
    galleryDesc:
      "Masterclasses, casos reales y panel técnico en una sola jornada, con el Centro de Conexiones B2B como complemento.",
    galleryTag1: "Expo Comercial",
    galleryTag2: "Registro & Bienvenida",
    galleryTag3: "Conferencia Magistral",
    galleryTag4: "Business Hub B2B",
    galleryStripAlt: "Sala de exposición — SC Security Summit",
  },
  en: {
    skipToForm: "Skip to corporate passes form",
    switchLangLabel: "Switch to Spanish",
    registerBtn: "GET PASSES",
    dateLocation: "September 24, 2026 · Reynosa, Tamaulipas",
    heroKicker: "IN-PERSON SUMMIT · REYNOSA 2026",
    heroAlt: "Supply Chain Security Summit",
    heroTitlePrefix: "Better decisions begin with",
    heroTitleHighlight: "better training",
    heroDescription:
      "An executive specialized training program for professionals responsible for supply chain security, compliance, and continuity.",
    registerNowBtn: "GET PASSES",
    heroAgendaBtn: "VIEW PROGRAM",
    sponsorBtn: "SPONSOR THE EVENT",
    presentedBy: "Presented by",
    whyAttendLabel: "THIS IS NOT AN EXPO",
    whyAttendTitle: "Training for those who protect the operation",
    whyAttendDesc:
      "Security depends on the judgment of the people who identify risks, apply controls, and make decisions when conditions change.",
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
    pillarsLabel: "CAPABILITIES",
    pillarsTitle: "One day to build stronger capabilities",
    pillarsDesc:
      "Capabilities you can use to act with greater judgment inside your organization.",
    speakersLabel: "CONFIRMED SPECIALISTS",
    speakersTitle: "Learn from those who face these challenges every day",
    speakersDesc:
      "Specialists with direct experience in security, compliance, transportation, foreign trade, and operational continuity.",
    speakersMorePrefix: "More speakers will be announced soon.",
    speakersMoreCTA: "Register to hear about them first →",
    speakerOpportunityTitle: "Would you like to connect your brand with the Summit?",
    speakerOpportunityDesc:
      "Explore opportunities to present solutions to a specialized audience.",
    speakerOpportunityCTA: "Explore opportunities",
    agendaLabel: "EXECUTIVE PROGRAM",
    agendaTitle: "Three dimensions to strengthen your operation",
    agendaDesc:
      "A learning path that connects vision, prevention, compliance, and application.",
    valueLabel: "THE SUMMIT EXPERIENCE",
    valueTitle: "A complete training experience",
    audienceCardTitle: "Attendee Profile",
    audienceCardDesc:
      "Professionals from the maquiladora industry, carriers, customs brokers, compliance and supply chain security.",
    audienceCardCTA: "Get Passes",
    eventDayLabel: "Event day",
    eventDayValue: "September 24, 2026",
    eventDayVenue: "Convention Center · Reynosa, Tamaulipas",
    participantsLabel: "WHO IT IS FOR",
    participantsTitle: "This program is for you if...",
    participantsDesc:
      "For those who move, protect and strengthen the supply chain. A meeting point for leaders and specialists in key areas.",
    providersLabel: "PROVIDERS",
    providersTitle: "B2B Ecosystem",
    providersDesc:
      "Companies specialized in technology, security and services for industry and the supply chain.",
    networkingLabel: "FROM LEARNING TO IMPLEMENTATION",
    networkingTitle: "Where training connects with real solutions",
    networkingDesc:
      "Meet services and specialists who can help your organization apply the criteria developed throughout the program.",
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
    pricingTitle: "Choose your training experience",
    pricingDesc:
      "One day of specialized training · September 24, 2026 · Reynosa Convention Center",
    taxNote: "* Plus VAT",
    getAccessBtn: "GET ACCESS",
    mostPopular: "MOST POPULAR",
    sponsorsLabel: "SPONSORSHIP OPPORTUNITY",
    sponsorsTitle: "Take Your Brand to the Next Level",
    sponsorsDesc:
      "Position your company as a leader in supply chain security. Connect directly with over 300 decision makers and maximize your visibility before the audience that matters.",
    sponsorRequestInfo: "Become a Sponsor",
    sponsorFormLabel: "SPONSORSHIP REQUEST",
    sponsorFormTitle: "Let's Talk About Your Brand",
    sponsorFormDesc:
      "Leave your details and an advisor will contact you with availability and benefit information.",
    sponsorFormSubmit: "REQUEST INFORMATION",
    sponsorSuccess: "We received your request. Our team will contact you shortly.",
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
    addressLine1: "Libramiento Ote S/N, Azteca",
    addressLine2: "Reynosa, Tamaulipas, C.P. 88680",
    viewOnMaps: "View on Google Maps",
    loadInteractiveMap: "Load interactive map",
    mapPrivacyNote:
      "Google Maps loads only when you request it, avoiding third-party connections during the initial visit.",
    mapTitle: "Map of the Reynosa Convention Center",
    datesLabel: "Dates",
    datesValue: "September 24, 2026",
    datesHours: "8:00 AM — 7:00 PM",
    contactLabel: "Contact",
    faqLabel: "FREQUENTLY ASKED QUESTIONS",
    faqTitle: "Frequently asked questions",
    regLabel: "CORPORATE PASSES",
    regTitle: "Train Your Entire Team",
    regDesc:
      "One pass, complete coverage. Your team can attend at any time of day, with each department joining the block that fits their role.",
    corporateAccessTitle: "Up to 10 Plus Passes",
    corporateAccessNote: "DC-3 training certificate included for each participant.",
    corporateSubmit: "REQUEST A CORPORATE PASS",
    corporateSuccess: "We received your corporate pass request. We will contact you shortly.",
    inquiryPrivacy:
      "By continuing, you agree that we may use your information only to follow up on this request.",
    inquiryPrivacyLink: "Read the Privacy Notice.",
    inquiryPreviewDisabled:
      "Preview mode: this form is disabled and does not collect or send data. Use the production site to contact the team.",
    inquiryPreviewDisabledButton: "UNAVAILABLE IN PREVIEW",
    inquirySending: "SENDING...",
    inquiryInvalid: "Review the fields and try again.",
    inquiryRateLimited:
      "There have been several attempts. Wait a few minutes before trying again.",
    inquiryError:
      "We could not send your request right now. Email us at hola@scsecuritysummit.com.",
    finalCTATitlePart1: "Security begins by",
    finalCTATitlePart2: "training better professionals",
    finalCTADesc:
      "Invest in capabilities that strengthen your performance and your organization’s ability to respond.",
    contactOrg: "CONTACT ORGANIZER",
    footerDesc:
      "1st Supply Chain Security Summit. September 24, 2026. Reynosa Convention Center, Tamaulipas, Mexico.",
    footerEvent: "Event",
    footerContact: "Contact",
    footerCopyright: "© 2026 SC Security Summit. All rights reserved.",
    footerPrivacy: "Privacy Notice",
    footerTerms: "Terms and Conditions",
    galleryLabel: "THE EXPERIENCE",
    galleryTitle: "Designed to learn, not just to listen",
    galleryDesc:
      "Masterclasses, real cases, and a technical panel in one day, complemented by the B2B Connections Center.",
    galleryTag1: "Commercial Expo",
    galleryTag2: "Registration & Welcome",
    galleryTag3: "Keynote Session",
    galleryTag4: "Business Hub B2B",
    galleryStripAlt: "Exhibition hall — SC Security Summit",
  },
} as const;

export const HERO_STATS = {
  es: [
    { number: "1 día", suffix: "", label: "de formación especializada" },
    { number: "Especialistas", suffix: "", label: "con experiencia en la industria" },
    { number: "Aplicación práctica", suffix: "", label: "para la operación" },
    { number: "Conexiones", suffix: "", label: "y vinculación" },
  ],
  en: [
    { number: "1 day", suffix: "", label: "of specialized training" },
    { number: "Specialists", suffix: "", label: "with industry experience" },
    { number: "Practical application", suffix: "", label: "for your operation" },
    { number: "Connections", suffix: "", label: "and professional networking" },
  ],
} as const;

export const HERO_TOPICS = {
  es: ["CTPAT", "OEA", "Gestión de riesgos", "Ciberseguridad", "Seguridad en transporte"],
  en: ["CTPAT", "AEO", "Risk management", "Cybersecurity", "Transportation security"],
} as const;

export const COMPETENCIES = {
  es: [
    "Gestión de riesgos",
    "Seguridad en transporte",
    "Criterios de seguridad CTPAT y OEA",
    "Ciberseguridad",
    "Continuidad operativa",
    "Liderazgo y gestión de equipos",
  ],
  en: [
    "Risk management",
    "Transportation security",
    "CTPAT and AEO security criteria",
    "Cybersecurity",
    "Operational continuity",
    "Leadership and team management",
  ],
} as const;

export const PRESENTERS_COPY = {
  es: {
    label: "PRESENTADORES EXCLUSIVOS",
    title: "Empresas comprometidas con el fortalecimiento de la seguridad",
    description: "Organizaciones que impulsan el desarrollo profesional de la industria.",
  },
  en: {
    label: "EXCLUSIVE PRESENTERS",
    title: "Companies committed to strengthening security",
    description: "Organizations that support professional development across the industry.",
  },
} as const;

// Call-for-speakers ("Ser presentador"). This is a mailto-based inquiry — it
// deliberately does NOT persist to Supabase, keeping the product boundary
// (only corporate-pass and sponsorship inquiries are stored) intact.
export const PRESENTER_CFP = {
  recipient: "contacto@scsecuritysummit.com",
  es: {
    label: "Convocatoria",
    title: "Quiero ser presentador",
    description:
      "Buscamos especialistas con experiencia directa en seguridad, cumplimiento, transporte, comercio exterior y continuidad operativa. Déjanos tus datos y te contactamos.",
    points: [
      "Sesiones de 50 minutos con caso real.",
      "Audiencia ejecutiva y operativa de la región.",
      "Respuesta del comité en 5 días hábiles.",
    ],
    formLabel: "Postúlate",
    formTitle: "Comparte tu propuesta",
    formDesc:
      "Cuéntanos qué te gustaría presentar y el comité revisará tu perfil.",
    firstName: "Nombre(s)",
    firstNamePlaceholder: "Sandra",
    lastName: "Apellidos",
    lastNamePlaceholder: "Romero",
    email: "Correo corporativo",
    emailPlaceholder: "nombre@empresa.com",
    phone: "Teléfono móvil",
    phonePlaceholder: "+52 899 000 0000",
    company: "Empresa",
    companyPlaceholder: "Empresa",
    role: "Cargo",
    rolePlaceholder: "Gerente de seguridad",
    topic: "Tema que te gustaría presentar",
    topicPlaceholder:
      "Describe brevemente tu propuesta y el caso que compartirías.",
    submit: "Enviar propuesta",
    note: "Se abrirá tu correo con los datos listos para enviar a contacto@scsecuritysummit.com",
    subject: "Propuesta de presentador — SC Security Summit 2026",
  },
  en: {
    label: "Call for speakers",
    title: "I want to be a presenter",
    description:
      "We're looking for specialists with direct experience in security, compliance, transportation, foreign trade, and operational continuity. Leave your details and we'll reach out.",
    points: [
      "50-minute sessions built around a real case.",
      "Executive and operational audience from the region.",
      "Committee response within 5 business days.",
    ],
    formLabel: "Apply",
    formTitle: "Share your proposal",
    formDesc: "Tell us what you'd like to present and the committee will review your profile.",
    firstName: "First name(s)",
    firstNamePlaceholder: "Sandra",
    lastName: "Last name(s)",
    lastNamePlaceholder: "Romero",
    email: "Corporate email",
    emailPlaceholder: "name@company.com",
    phone: "Mobile phone",
    phonePlaceholder: "+1 956 000 0000",
    company: "Company",
    companyPlaceholder: "Company",
    role: "Role",
    rolePlaceholder: "Security manager",
    topic: "Topic you'd like to present",
    topicPlaceholder: "Briefly describe your proposal and the case you'd share.",
    submit: "Send proposal",
    note: "Your email client will open with the details ready to send to contacto@scsecuritysummit.com",
    subject: "Speaker proposal — SC Security Summit 2026",
  },
} as const;

export const AUDIENCE_PATHS = {
  es: [
    {
      label: "PROFESIONAL",
      title: "Quieres fortalecer tu perfil",
      description:
        "Amplía tu visión, actualiza tus conocimientos y prepárate para asumir mayores responsabilidades.",
      cta: "Ver acceso recomendado",
      href: "#accesos",
    },
    {
      label: "LÍDER",
      title: "Tomas decisiones que afectan la operación",
      description:
        "Fortalece el criterio con el que diriges proyectos, equipos, auditorías y procesos de seguridad.",
      cta: "Obtener accesos",
      href: "#accesos",
    },
    {
      label: "EMPRESA",
      title: "Necesitas desarrollar capacidades en varias áreas",
      description:
        "Capacita a transporte, comercio exterior, seguridad, sistemas y cumplimiento bajo una misma visión.",
      cta: "Solicitar pase corporativo",
      href: "#registro",
    },
  ],
  en: [
    {
      label: "PROFESSIONAL",
      title: "You want to strengthen your profile",
      description:
        "Broaden your perspective, update your knowledge, and prepare for greater responsibilities.",
      cta: "View recommended pass",
      href: "#accesos",
    },
    {
      label: "LEADER",
      title: "You make decisions that affect the operation",
      description:
        "Strengthen the judgment you use to lead projects, teams, audits, and security processes.",
      cta: "Get passes",
      href: "#accesos",
    },
    {
      label: "COMPANY",
      title: "You need to build capabilities across teams",
      description:
        "Train transportation, foreign trade, security, systems, and compliance under one shared vision.",
      cta: "Request a corporate pass",
      href: "#registro",
    },
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
      name: "Sandra Romero",
      role: "Directora Lanz Logistics",
      topic: "Cultura de Seguridad",
      headline: "Certificado, pero sin capitalizar tu OEA",
      description:
        "Monitorear tu cadena de suministro no solo es control, es la ventaja competitiva de tu empresa.",
      image: "/images/speaker-sandra-4k.webp",
    },
    {
      name: "Fidel Guerrero",
      role: "Subdirector del Comité Nacional de Comercio Exterior y Aduanas de INDEX Nacional",
      topic: "Panorama Industrial",
      headline: "Certificado, pero sin capitalizar tu OEA",
      description:
        "Certificarse y no capitalizarlo es dejar dinero sobre la mesa. El reto no es solo contar con OEA, sino usar esa certificación como argumento de venta activo frente a clientes y socios.",
      image: "/images/speaker-fidel-4k.webp",
    },
    {
      name: "Isidoro Juárez",
      role: "Mandatario Aduanal Certificado",
      topic: "Aduanas & Compliance",
      headline: "El error de un socio, tu responsabilidad",
      description:
        "Un socio aduanal no validado es una responsabilidad que hereda tu empresa, aunque el error nunca haya sido tuyo.",
      image: "/images/speaker-isidoro-4k.webp",
    },
    {
      name: "Julio César Suárez",
      role: "Líder en Trade Compliance e Innovación",
      topic: "Trade Compliance",
      headline: "Apagar incendios en vez de prevenir",
      description:
        "¿Tu empresa está preparada para el riesgo, o solo lista para reaccionar cuando ya ocurrió?",
      image: "/images/speaker-julio-4k.webp",
    },
    {
      name: "Eduardo Luna",
      role: "Organización Operativa y Expansión Comercial",
      topic: "Organización & Expansión",
      headline: "Visión que nunca baja a operación, o viceversa",
      description:
        "Cuando la visión de dirección y la operación diaria no hablan el mismo idioma, cada decisión estratégica se pierde en la ejecución.",
      image: "/images/speaker-eduardo-4k.webp",
    },
  ],
  en: [
    {
      name: "Sandra Romero",
      role: "Director, Lanz Logistics",
      topic: "Security Culture",
      headline: "Certified, but not capitalizing on your AEO",
      description:
        "Monitoring your supply chain is more than control; it is a competitive advantage for your company.",
      image: "/images/speaker-sandra-4k.webp",
    },
    {
      name: "Fidel Guerrero",
      role: "Deputy Director, National Committee on Foreign Trade & Customs — INDEX Nacional",
      topic: "Industrial Overview",
      headline: "Certified, but not capitalizing on your AEO",
      description:
        "Getting certified and failing to capitalize on it leaves money on the table. The challenge is not merely having AEO status, but using it as an active sales argument with clients and partners.",
      image: "/images/speaker-fidel-4k.webp",
    },
    {
      name: "Isidoro Juárez",
      role: "Certified Customs Broker",
      topic: "Customs & Compliance",
      headline: "A partner's mistake, your responsibility",
      description:
        "An unvalidated customs partner becomes a liability your company inherits, even when the original mistake was not yours.",
      image: "/images/speaker-isidoro-4k.webp",
    },
    {
      name: "Julio César Suárez",
      role: "Trade Compliance & Innovation Leader",
      topic: "Trade Compliance",
      headline: "Putting out fires instead of preventing them",
      description:
        "Is your company prepared for risk, or only ready to react after it has already happened?",
      image: "/images/speaker-julio-4k.webp",
    },
    {
      name: "Eduardo Luna",
      role: "Operational Organization & Commercial Expansion",
      topic: "Organization & Expansion",
      headline: "A vision that never reaches operations, or vice versa",
      description:
        "When leadership's vision and daily operations do not speak the same language, every strategic decision gets lost in execution.",
      image: "/images/speaker-eduardo-4k.webp",
    },
  ],
} as const;

export const AGENDA = {
  es: [
    {
      title: "Bloque 1 — Visión Estratégica",
      time: "08:00 — 11:00",
      audience: "Gerencia y mandos medios de RH, entrenamiento, sistemas y seguridad",
      sessions: [
        { time: "08:00–08:30", title: "Registro y bienvenida" },
        { time: "08:30–09:00", title: "Stands y networking: Stands & Business Hub" },
        {
          time: "09:00–09:50",
          title: "De la visión a la acción: liderazgo y formación como pilares de seguridad",
          speaker: "Eduardo Luna",
        },
        {
          time: "10:00–11:00",
          title:
            "Ciberseguridad en la cadena de suministros: IA, protección de información y nuevos riesgos de cumplimiento",
        },
      ],
    },
    {
      title: "Bloque 2 — Riesgo y Cumplimiento",
      time: "11:00 — 14:30",
      audience: "Compliance, aduanas, logística, seguridad patrimonial y mantenimiento",
      sessions: [
        {
          time: "11:00–12:00",
          title:
            "Seguridad en el transporte de mercancías: controles operativos, inspección y prevención de vulnerabilidades en la cadena de suministro",
        },
        {
          time: "12:00–13:30",
          title:
            "Evaluación de riesgos en la cadena de suministro: identificación, análisis y mitigación de amenazas",
          speaker: "Julio César Suárez",
        },
        { time: "13:30–14:30", title: "Comida y networking: Stands & Business Hub" },
      ],
    },
    {
      title: "Bloque 3 — Cumplimiento Aduanal y OEA",
      time: "14:30 — 17:30",
      audience: "Gerencia, import/export, agentes aduanales, mandos medios y supervisores",
      sessions: [
        {
          time: "14:30–15:45",
          title: "Agencias aduanales como OEA: cumplimiento operativo y fiscal ante el SAT",
          speaker: "Isidoro Juárez",
        },
        { time: "15:45–16:15", title: "Networking: Stands & Business Hub" },
        {
          time: "16:15–17:30",
          title:
            "OEA como ventaja estratégica: seguridad, cumplimiento y competitividad en la cadena de suministro",
          speaker: "Fidel Guerrero",
        },
      ],
    },
    {
      title: "Bloque 4 — Cierre y Conclusiones",
      time: "17:30 — 19:00",
      audience: "Todos los departamentos",
      sessions: [
        { time: "17:30–18:00", title: "Panel de conferencistas" },
        { time: "18:00–18:15", title: "Clausura" },
        { time: "18:15–19:00", title: "Networking: Stands & Business Hub" },
      ],
    },
  ],
  en: [
    {
      title: "Block 1 — Strategic Vision",
      time: "08:00 — 11:00",
      audience: "Management and mid-level leaders in HR, training, systems and security",
      sessions: [
        { time: "08:00–08:30", title: "Registration and welcome" },
        { time: "08:30–09:00", title: "Booths and networking: Stands & Business Hub" },
        {
          time: "09:00–09:50",
          title: "From vision to action: leadership and training as pillars of security",
          speaker: "Eduardo Luna",
        },
        {
          time: "10:00–11:00",
          title:
            "Supply chain cybersecurity: AI, information protection and new compliance risks",
        },
      ],
    },
    {
      title: "Block 2 — Risk and Compliance",
      time: "11:00 — 14:30",
      audience: "Compliance, customs, logistics, asset security and maintenance",
      sessions: [
        {
          time: "11:00–12:00",
          title:
            "Freight security: operational controls, inspection and prevention of supply chain vulnerabilities",
        },
        {
          time: "12:00–13:30",
          title:
            "Supply chain risk assessment: identifying, analyzing and mitigating threats",
          speaker: "Julio César Suárez",
        },
        { time: "13:30–14:30", title: "Lunch and networking: Stands & Business Hub" },
      ],
    },
    {
      title: "Block 3 — Customs Compliance and AEO",
      time: "14:30 — 17:30",
      audience: "Management, import/export, customs brokers, mid-level leaders and supervisors",
      sessions: [
        {
          time: "14:30–15:45",
          title: "Customs agencies as AEOs: operational and tax compliance before SAT",
          speaker: "Isidoro Juárez",
        },
        { time: "15:45–16:15", title: "Networking: Stands & Business Hub" },
        {
          time: "16:15–17:30",
          title:
            "AEO as a strategic advantage: security, compliance and competitiveness across the supply chain",
          speaker: "Fidel Guerrero",
        },
      ],
    },
    {
      title: "Block 4 — Closing and Conclusions",
      time: "17:30 — 19:00",
      audience: "All departments",
      sessions: [
        { time: "17:30–18:00", title: "Speaker panel" },
        { time: "18:00–18:15", title: "Closing remarks" },
        { time: "18:15–19:00", title: "Networking: Stands & Business Hub" },
      ],
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
      priceValue: 4800,
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
      id: "plus",
      label: "Acceso Plus",
      price: "$2,500",
      priceValue: 2500,
      featured: false,
      desc: "Líderes de certificación y puntos de contacto",
      recommended: "Especialista CTPAT / OEA",
      features: [
        "Acceso a conferencias especializadas",
        "Acceso a paneles con expertos de la industria",
        "Constancia de participación",
        "Kit de bienvenida ejecutivo",
        "Gafete de acceso",
        "Material descargable, recursos y plantillas de trabajo",
      ],
    },
    {
      id: "general",
      label: "Acceso General",
      price: "$900",
      priceValue: 900,
      featured: false,
      desc: "Para los que sostienen la seguridad en la operación",
      recommended: "Operativo de Seguridad CTPAT / OEA",
      features: [
        "Acceso a conferencias especializadas",
        "Acceso a paneles con expertos de la industria",
        "Constancia digital de participación",
        "Kit básico de bienvenida profesional",
        "Gafete de acceso",
      ],
    },
    {
      id: "estudiante",
      label: "Acceso Estudiante",
      price: "$650",
      priceValue: 650,
      featured: false,
      desc: "Perfil de estudiante con credencial vigente",
      features: [
        "Acceso a conferencias especializadas",
        "Kit Futuros Líderes",
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
      priceValue: 4800,
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
      id: "plus",
      label: "Plus Pass",
      price: "$2,500",
      priceValue: 2500,
      featured: false,
      desc: "Certification leaders and key points of contact",
      recommended: "CTPAT / AEO Specialist",
      features: [
        "Access to specialized conferences",
        "Access to industry expert panels",
        "Certificate of participation",
        "Executive welcome kit",
        "Access badge",
        "Downloadable materials, resources and work templates",
      ],
    },
    {
      id: "general",
      label: "General Pass",
      price: "$900",
      priceValue: 900,
      featured: false,
      desc: "For those who sustain security in daily operations",
      recommended: "CTPAT / AEO Security Operator",
      features: [
        "Access to specialized conferences",
        "Access to industry expert panels",
        "Digital certificate of participation",
        "Professional basic welcome kit",
        "Access badge",
      ],
    },
    {
      id: "estudiante",
      label: "Student Pass",
      price: "$650",
      priceValue: 650,
      featured: false,
      desc: "Student profile with valid ID",
      features: [
        "Access to specialized conferences",
        "Future Leaders kit",
        "Access badge",
        "Certificate of participation available at preferential cost",
      ],
    },
  ],
} as const;

export const PRICING_STRIPE = {
  general: "bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300",
  vip: "bg-gradient-to-r from-blue-800 via-cyan-400 to-blue-800",
  plus: "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500",
  estudiante: "bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300",
} as const;

export const INQUIRY_FORMS = {
  es: {
    corporate: {
      firstName: "Nombre(s)",
      lastName: "Apellidos",
      email: "Correo corporativo",
      company: "Empresa",
      role: "Cargo",
      phone: "Teléfono móvil",
      requestedSeats: "Número de accesos",
      firstNamePlaceholder: "Ej. María",
      lastNamePlaceholder: "Ej. González López",
      emailPlaceholder: "nombre@empresa.com",
      companyPlaceholder: "Nombre de la empresa",
      rolePlaceholder: "Ej. Directora de Logística",
      phonePlaceholder: "+52 899 123 4567",
      subject: "Solicitud de pase corporativo — Summit 2026",
    },
    sponsor: {
      name: "Nombre completo",
      company: "Empresa",
      email: "Correo corporativo",
      phone: "Teléfono móvil",
      interest: "¿Qué te interesa conocer?",
      namePlaceholder: "Tu nombre",
      companyPlaceholder: "Nombre de la empresa",
      emailPlaceholder: "nombre@empresa.com",
      phonePlaceholder: "+52 899 123 4567",
      interestPlaceholder: "Cuéntanos brevemente qué busca tu marca",
      subject: "Solicitud de patrocinio — Summit 2026",
    },
  },
  en: {
    corporate: {
      firstName: "First name",
      lastName: "Last name",
      email: "Corporate email",
      company: "Company",
      role: "Job title",
      phone: "Mobile phone",
      requestedSeats: "Number of passes",
      firstNamePlaceholder: "e.g. Maria",
      lastNamePlaceholder: "e.g. Gonzalez Lopez",
      emailPlaceholder: "name@company.com",
      companyPlaceholder: "Company name",
      rolePlaceholder: "e.g. Logistics Director",
      phonePlaceholder: "+1 956 123 4567",
      subject: "Corporate pass request — Summit 2026",
    },
    sponsor: {
      name: "Full name",
      company: "Company",
      email: "Corporate email",
      phone: "Mobile phone",
      interest: "What would you like to know?",
      namePlaceholder: "Your name",
      companyPlaceholder: "Company name",
      emailPlaceholder: "name@company.com",
      phonePlaceholder: "+1 956 123 4567",
      interestPlaceholder: "Briefly tell us what your brand is looking for",
      subject: "Sponsorship request — Summit 2026",
    },
  },
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
] as const;

export const SPONSORS = {
  es: [
    {
      tier: "Patrocinio Exclusivo",
      benefits: [
        "Acceso al Business Hub para generación de relaciones comerciales y networking estratégico con tomadores de decisión",
        "Acceso a directorio de contactos potenciales autorizados del evento para seguimiento comercial posterior",
        "Presentación comercial exclusiva de 10 minutos ante audiencia estratégica dentro del Business Hub",
        "Espacios para stand",
        "Servicio de coffee break disponible en el área asignada del patrocinador",
        "Campaña de difusión destacada en redes sociales y mailing antes, durante y después del evento",
        "Presencia de marca en materiales impresos y digitales: flyers, banners, sitio web, redes sociales, señalética y piezas promocionales",
        "Proyección de reel publicitario en pantallas oficiales del evento",
        "Inclusión de material promocional de la empresa en el kit de bienvenida para asistentes",
        "Mención institucional destacada durante la inauguración y clausura del evento",
        "10 accesos VIP a conferencias principales",
        "Capacitación in company de 4 horas para personal de la empresa patrocinadora",
        "Emisión de constancias de capacitación y formato DC-3 para participantes de la capacitación",
      ],
    },
  ],
  en: [
    {
      tier: "Exclusive Sponsorship",
      benefits: [
        "Business Hub access for commercial relationship building and strategic networking with decision makers",
        "Access to the event's authorized directory of potential contacts for post-event commercial follow-up",
        "Exclusive 10-minute commercial presentation before a strategic audience within the Business Hub",
        "Booth spaces",
        "Coffee break service available in the sponsor's designated area",
        "Featured social media and email campaign before, during, and after the event",
        "Brand presence on printed and digital materials: flyers, banners, website, social media, signage, and promotional pieces",
        "Advertising reel on official event screens",
        "Inclusion of company promotional material in the attendee welcome kit",
        "Featured institutional mention at the event opening and closing ceremonies",
        "10 VIP passes to main conferences",
        "4-hour in-company training for the sponsor's staff",
        "Training certificates and DC-3 format for training participants",
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
      icon: "target",
      title: "Comprender",
      desc: "Analiza los riesgos que están transformando la seguridad de la cadena de suministro.",
    },
    {
      icon: "network",
      title: "Decidir",
      desc: "Fortalece el criterio con el que evalúas amenazas, cumplimiento y continuidad.",
    },
    {
      icon: "book-open",
      title: "Aplicar",
      desc: "Regresa a tu operación con ideas, enfoques y acciones concretas.",
    },
    {
      icon: "layout-grid",
      title: "No vienes a recorrer stands",
      desc: "Vienes a desarrollar competencias. La formación es el producto; la vinculación complementa la experiencia.",
    },
  ],
  en: [
    {
      icon: "target",
      title: "Understand",
      desc: "Analyze the risks transforming supply chain security.",
    },
    {
      icon: "network",
      title: "Decide",
      desc: "Strengthen the judgment you use to assess threats, compliance, and continuity.",
    },
    {
      icon: "book-open",
      title: "Apply",
      desc: "Return to your operation with practical ideas, approaches, and actions.",
    },
    {
      icon: "layout-grid",
      title: "You are not here to browse booths",
      desc: "You are here to build capabilities. Training is the product; networking complements the experience.",
    },
  ],
} as const;

export const FAQ_ITEMS = [
  {
    question: "¿Dónde y cuándo se llevará a cabo el Summit?",
    answer:
      "El Summit se realizará el 24 de septiembre de 2026 en el Centro de Convenciones de Reynosa, Tamaulipas, México. Las actividades comienzan a las 8:00 AM y se extienden hasta las 7:00 PM.",
  },
  {
    question: "¿A quién está dirigido este evento?",
    answer:
      "Está diseñado para profesionales y ejecutivos del sector de cadena de suministros: directores de operaciones, gerentes de logística, especialistas en comercio exterior, responsables de compliance, entre otros perfiles clave en la industria.",
  },
  {
    question: "¿Cómo puedo convertirme en patrocinador?",
    answer:
      "Contáctanos directamente a hola@scsecuritysummit.com o al +52 899 112 8755. Te enviaremos toda la información sobre nuestras oportunidades de patrocinio y los beneficios detallados para posicionar tu marca en el evento.",
  },
  {
    question: "¿Cómo compro mi acceso?",
    answer:
      "Desde cualquier botón de acceso del sitio llegas a Eventbrite, donde eliges tu tipo de acceso y realizas el pago. Eventbrite te envía por correo tu boleto y el comprobante de compra; ese boleto es el que presentas el día del evento.",
  },
  {
    question: "¿Qué incluye cada tipo de acceso?",
    answer:
      "El acceso Estudiante incluye conferencias especializadas, kit Futuros Líderes y gafete. El acceso General agrega paneles con expertos de la industria, constancia digital de participación y kit básico. El acceso Plus suma constancia de participación, kit de bienvenida ejecutivo y material descargable con plantillas de trabajo. El acceso VIP incluye todo lo anterior más workshops estratégicos y sesiones especiales en el Business Hub, participación prioritaria en Q&A, asesoría CTPAT/OEA durante el evento, asiento preferente, coffee break y kit de bienvenida premium.",
  },
  {
    question: "¿Puedo comprar accesos para mi equipo?",
    answer:
      "Sí. El pase corporativo cubre hasta 10 accesos Plus con DC-3 incluido para cada participante, para que cada departamento asista al bloque que le corresponde. Solicítalo desde la sección de pases corporativos del sitio y un asesor te responde por correo con la cotización.",
  },
  {
    question: "¿Puedo obtener factura (CFDI)?",
    answer:
      "Sí. Una vez completada tu compra en Eventbrite, escríbenos a hola@scsecuritysummit.com con tu número de orden y tus datos fiscales. El CFDI se emite dentro de las 72 horas posteriores a la confirmación de tu pago.",
  },
  {
    question: "¿El acceso estudiantil requiere credencial?",
    answer:
      "Sí, es necesario presentar credencial vigente de la institución educativa al momento del check-in el día del evento. Este acceso es exclusivo para estudiantes activos de nivel licenciatura.",
  },
] as const;

export const FAQ_ITEMS_EN = [
  {
    question: "Where and when will the Summit take place?",
    answer:
      "The Summit will be held on September 24, 2026, at the Reynosa Convention Center in Reynosa, Tamaulipas, Mexico. Activities begin at 8:00 AM and run through 7:00 PM.",
  },
  {
    question: "Who is this event designed for?",
    answer:
      "It is designed for supply chain professionals and executives: operations directors, logistics managers, foreign trade specialists, compliance leaders, and other key industry profiles.",
  },
  {
    question: "How can I become a sponsor?",
    answer:
      "Contact us at hola@scsecuritysummit.com or +52 899 112 8755. We will send you all the information about our sponsorship opportunities and the detailed benefits to position your brand at the event.",
  },
  {
    question: "How do I buy my pass?",
    answer:
      "Any access button on the site takes you to Eventbrite, where you pick your access type and pay. Eventbrite emails you the ticket and the receipt; that ticket is what you present on the day of the event.",
  },
  {
    question: "What is included with each access type?",
    answer:
      "Student access includes the specialized conferences, the Future Leaders kit, and a badge. General access adds panels with industry experts, a digital certificate of participation, and a basic kit. Plus access adds a printed certificate of participation, an executive welcome kit, and downloadable materials with work templates. VIP includes all of the above plus strategic workshops and special Business Hub sessions, priority Q&A participation, CTPAT/AEO advisory during the event, preferred seating, coffee break, and a premium welcome kit.",
  },
  {
    question: "Can I buy passes for my team?",
    answer:
      "Yes. The corporate pass covers up to 10 Plus passes with a DC-3 certificate for each participant, so every department attends the block that matches its role. Request it from the corporate passes section of the site and an advisor will reply by email with a quote.",
  },
  {
    question: "Can I request an invoice (CFDI)?",
    answer:
      "Yes. Once your purchase is complete on Eventbrite, email us at hola@scsecuritysummit.com with your order number and tax details. The CFDI is issued within 72 hours after payment confirmation.",
  },
  {
    question: "Does the student pass require an ID?",
    answer:
      "Yes, you must present a valid student ID from your institution during event check-in. This pass is only for active undergraduate students.",
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
    agenda: AGENDA.es,
    attendees: ASISTENTES.es,
    providers: PROVEEDORES.es,
    pricing: PRICING.es,
    forms: INQUIRY_FORMS.es,
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
    agenda: AGENDA.en,
    attendees: ASISTENTES.en,
    providers: PROVEEDORES.en,
    pricing: PRICING.en,
    forms: INQUIRY_FORMS.en,
    sponsorTierMeta: SPONSOR_TIER_META,
    sponsors: SPONSORS.en,
    valueHighlights: VALUE_HIGHLIGHTS.en,
    whyAttend: WHY_ATTEND.en,
    faq: FAQ_ITEMS_EN,
  },
} as const;

export type Language = "es" | "en";
export type ContentSection<K extends keyof typeof CONTENT.es> = (typeof CONTENT.es)[K];
