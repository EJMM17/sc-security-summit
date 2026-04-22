import type { Metadata } from "next";
import { Shield, ArrowLeft } from "lucide-react";

export const revalidate = 86400; // 24 hours — static content, revalidate daily

export const metadata: Metadata = {
  title: "Aviso de Privacidad | SC Security Summit 2026",
  description:
    "Aviso de privacidad de Lanz Logistics para el 1er Summit de Seguridad en la Cadena de Suministros 2026.",
  robots: { index: false, follow: false },
};

export default function AvisoPrivacidad() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight" style={{ fontFamily: "var(--font-oswald)" }}>SC SUMMIT</span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-blue-400">REYNOSA 2026</span>
            </div>
          </a>
          <a href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Regresar
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
          Aviso de Privacidad
        </h1>
        <p className="text-sm text-slate-400 mb-10">Última actualización: abril de 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Identidad y domicilio del Responsable</h2>
            <p>
              <strong>Lanz Logistics</strong>, con domicilio en Reynosa, Tamaulipas, México (en adelante, "el Responsable"),
              es el responsable del tratamiento de sus datos personales, de conformidad con lo establecido en la
              Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
            </p>
            <p className="mt-3">
              Para cualquier consulta relacionada con el presente Aviso de Privacidad, puede contactarnos en:
            </p>
            <ul className="list-none mt-2 space-y-1 pl-0">
              <li><span className="font-semibold">Correo electrónico:</span> Contacto@LanzLogistics.com</li>
              <li><span className="font-semibold">Teléfono:</span> +1 (956) 515-8070</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Datos Personales que se Recaban</h2>
            <p>Para llevar a cabo las finalidades descritas en el presente Aviso de Privacidad, el Responsable recabará los siguientes datos personales:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Nombre(s) y apellidos</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono móvil</li>
              <li>Empresa y cargo</li>
              <li>Tipo de acceso al evento</li>
              <li>Datos fiscales para facturación (RFC, razón social y código postal fiscal), únicamente si el titular los proporciona voluntariamente al solicitar una factura CFDI</li>
            </ul>
            <p className="mt-3">
              El Responsable <strong>no recaba datos personales sensibles</strong> en el sentido del artículo 3, fracción VI de la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Finalidades del Tratamiento</h2>
            <p><strong>Finalidades primarias</strong> (necesarias para la relación jurídica entre el Responsable y el titular):</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Procesar y confirmar el registro al 1er Summit de Seguridad en la Cadena de Suministros 2026.</li>
              <li>Generar y enviar el folio de confirmación de registro.</li>
              <li>Enviar instrucciones de pago y confirmación de asistencia.</li>
              <li>Emitir la factura CFDI cuando sea solicitada por el titular.</li>
              <li>Gestionar el acceso al evento el día de su celebración.</li>
            </ul>
            <p className="mt-4"><strong>Finalidades secundarias</strong> (no necesarias para la relación jurídica; puede oponerse a ellas):</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Envío de comunicaciones informativas sobre futuros eventos organizados por Lanz Logistics.</li>
              <li>Realización de encuestas de satisfacción posteriores al evento.</li>
            </ul>
            <p className="mt-3">
              Si no desea que sus datos sean tratados para las finalidades secundarias, puede manifestarlo enviando un correo a{" "}
              <a href="mailto:Contacto@LanzLogistics.com" className="text-blue-600 hover:underline">Contacto@LanzLogistics.com</a>{" "}
              con el asunto "Oposición finalidades secundarias".
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Transferencias de Datos</h2>
            <p>
              El Responsable no realizará transferencias de datos personales a terceros sin el consentimiento del titular,
              salvo las excepciones previstas en el artículo 37 de la LFPDPPP, incluyendo:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Cuando sea necesario por virtud de un contrato celebrado o por celebrar en interés del titular.</li>
              <li>Cuando sea preciso para el mantenimiento o cumplimiento de una relación jurídica entre el Responsable y el titular.</li>
              <li>Cuando la transferencia sea efectuada a encargados del Responsable (ej. proveedores de tecnología) que traten los datos conforme a instrucciones del Responsable y con las mismas medidas de seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Derechos ARCO</h2>
            <p>
              De conformidad con la LFPDPPP, el titular de los datos personales tiene derecho a <strong>Acceder</strong>,{" "}
              <strong>Rectificar</strong>, <strong>Cancelar</strong> u <strong>Oponerse</strong> (derechos ARCO) al
              tratamiento de sus datos personales. Para ejercer estos derechos, deberá enviar una solicitud al correo{" "}
              <a href="mailto:Contacto@LanzLogistics.com" className="text-blue-600 hover:underline">Contacto@LanzLogistics.com</a>{" "}
              con los siguientes datos:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nombre completo y correo electrónico con el que se registró.</li>
              <li>Descripción clara del derecho que desea ejercer.</li>
              <li>Cualquier documento que facilite la localización de sus datos.</li>
            </ul>
            <p className="mt-3">
              El Responsable responderá en un plazo máximo de 20 días hábiles a partir de la recepción de la solicitud.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Uso de Cookies y Tecnologías de Seguimiento</h2>
            <p>
              El sitio web del Summit puede utilizar cookies técnicas estrictamente necesarias para el funcionamiento
              del mismo. No se utilizan cookies de seguimiento publicitario ni se comparte información de navegación
              con redes publicitarias de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Medidas de Seguridad</h2>
            <p>
              El Responsable ha implementado medidas de seguridad técnicas, administrativas y físicas para proteger
              sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no
              autorizado. Los datos son almacenados en infraestructura en la nube con cifrado en reposo y en tránsito.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Cambios al Aviso de Privacidad</h2>
            <p>
              El Responsable se reserva el derecho de modificar el presente Aviso de Privacidad. Cualquier modificación
              será publicada en el sitio web{" "}
              <a href="https://www.scsecuritysummit.com/aviso-de-privacidad" className="text-blue-600 hover:underline">
                www.scsecuritysummit.com/aviso-de-privacidad
              </a>.
              Se recomienda consultar esta página periódicamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Autoridad de Control</h2>
            <p>
              Si considera que el tratamiento de sus datos personales no está siendo realizado conforme a la LFPDPPP,
              tiene derecho a presentar una queja ante el Instituto Nacional de Transparencia, Acceso a la Información
              y Protección de Datos Personales (INAI), a través de su sitio web{" "}
              <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.inai.org.mx
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            © 2026 Lanz Logistics. Todos los derechos reservados.
          </p>
          <a href="/" className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al Summit
          </a>
        </div>
      </main>
    </div>
  );
}
