import ScrollReveal from "@/components/ScrollReveal";
import FAQAccordion from "@/components/FAQAccordion";

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

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="section-label">PREGUNTAS FRECUENTES</span>
            <h2 className="section-title mt-3">¿Tienes Dudas?</h2>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <FAQAccordion items={FAQ_ITEMS} />
        </ScrollReveal>
      </div>
    </section>
  );
}
