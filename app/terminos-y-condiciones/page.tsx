import type { Metadata } from "next";
import { Shield, ArrowLeft } from "lucide-react";

export const revalidate = 86400; // 24 hours — static content, revalidate daily

export const metadata: Metadata = {
  title: "Términos y Condiciones | SC Security Summit 2026",
  description:
    "Términos y condiciones de participación para el 1er Summit de Seguridad en la Cadena de Suministros 2026.",
  robots: { index: false, follow: false },
};

export default function TerminosCondiciones() {
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
          Términos y Condiciones
        </h1>
        <p className="text-sm text-slate-400 mb-10">Última actualización: abril de 2026</p>

        <div className="space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Organización del Evento</h2>
            <p>
              El <strong>1er Summit de Seguridad en la Cadena de Suministros 2026</strong> (en adelante, "el Evento") es
              organizado por <strong>Lanz Logistics</strong>, con sede en Reynosa, Tamaulipas, México, en colaboración
              con Thynk Unlimited. El Evento se celebrará los días 24 y 25 de septiembre de 2026 en el
              Centro de Convenciones de Reynosa, Blvd. Morelos 190, Col. Longoria, Reynosa, Tamaulipas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Registro y Confirmación</h2>
            <p>
              El registro al Evento se realiza a través del formulario oficial en línea. Al completar el
              formulario, el participante recibirá un <strong>folio de confirmación</strong> que acredita su
              solicitud de registro. Dicho folio no garantiza por sí mismo la reserva del lugar; la reserva
              queda confirmada únicamente al realizarse el pago correspondiente y recibir la confirmación por
              correo electrónico por parte de Lanz Logistics.
            </p>
            <p className="mt-3">
              Lanz Logistics se reserva el derecho de rechazar o cancelar registros en caso de datos
              incompletos, incorrectos o fraudulentos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Proceso de Pago</h2>
            <p>
              Una vez recibido el registro, un representante de Lanz Logistics contactará al participante en
              un plazo de <strong>24 a 48 horas hábiles</strong> con las instrucciones de pago. Los precios
              indicados no incluyen I.V.A. El pago puede realizarse mediante transferencia bancaria, depósito
              o los métodos indicados por el organizador.
            </p>
            <p className="mt-3">
              El lugar en el Evento queda reservado únicamente al momento en que el pago sea confirmado por
              el organizador. El cupo es limitado y se asigna en orden de confirmación de pago.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Política de Cancelación y Reembolso</h2>
            <p>
              Las cancelaciones deberán notificarse por escrito a{" "}
              <a href="mailto:hola@scsecuritysummit.com.mx" className="text-blue-600 hover:underline">
                hola@scsecuritysummit.com.mx
              </a>{" "}
              con al menos <strong>15 días naturales de anticipación</strong> a la fecha del Evento para ser
              elegibles a un reembolso del 80% del monto pagado. Cancelaciones con menos de 15 días de
              anticipación no son elegibles para reembolso; sin embargo, el participante podrá designar a
              un sustituto previo aviso al organizador.
            </p>
            <p className="mt-3">
              Lanz Logistics se reserva el derecho de cancelar o reprogramar el Evento por causas de fuerza
              mayor, en cuyo caso se ofrecerá al participante reembolso total o transferencia a la edición
              siguiente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Acceso Estudiantil</h2>
            <p>
              El acceso con tarifa estudiantil está disponible exclusivamente para estudiantes activos de
              nivel licenciatura o posgrado. El participante deberá presentar <strong>credencial estudiantil
              vigente y en original</strong> el día del check-in. La falta de este documento impedirá el
              acceso al Evento sin derecho a reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Facturación (CFDI)</h2>
            <p>
              La factura CFDI se emitirá dentro de las <strong>72 horas hábiles</strong> posteriores a la
              confirmación del pago, con los datos fiscales proporcionados en el formulario de registro. No
              se emitirán facturas con datos distintos a los proporcionados al momento del registro.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Programa del Evento</h2>
            <p>
              El programa publicado es de carácter preliminar y puede estar sujeto a cambios en ponentes,
              horarios o contenido sin previo aviso. Dichos cambios no darán derecho a cancelación ni a
              reembolso por parte del participante.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Uso de Imagen</h2>
            <p>
              Al participar en el Evento, el asistente otorga su consentimiento para que Lanz Logistics y
              Thynk Unlimited puedan capturar fotografías y videos durante el Evento y utilizarlos en
              materiales promocionales, redes sociales y medios digitales. Quien no desee ser fotografiado
              deberá notificarlo al personal del Evento antes del inicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Responsabilidad</h2>
            <p>
              Lanz Logistics no será responsable por pérdidas, robos, accidentes o daños a personas o
              bienes que ocurran durante el Evento. Los participantes son responsables de sus pertenencias
              y de su seguridad personal durante su asistencia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Conducta</h2>
            <p>
              Se espera que todos los participantes, ponentes y expositores mantengan un comportamiento
              profesional y respetuoso durante el Evento. Lanz Logistics se reserva el derecho de retirar
              a cualquier persona cuya conducta sea inapropiada, sin derecho a reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Legislación Aplicable</h2>
            <p>
              Los presentes Términos y Condiciones se rigen por las leyes vigentes de los Estados Unidos
              Mexicanos. Cualquier controversia derivada de estos Términos se someterá a la jurisdicción de
              los tribunales competentes en Reynosa, Tamaulipas, renunciando las partes a cualquier otro
              fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">12. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos Términos, puede contactarnos en:{" "}
              <a href="mailto:hola@scsecuritysummit.com.mx" className="text-blue-600 hover:underline">
                hola@scsecuritysummit.com.mx
              </a>{" "}
              o al <a href="tel:+19565158070" className="text-blue-600 hover:underline">+1 (956) 515-8070</a>.
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
