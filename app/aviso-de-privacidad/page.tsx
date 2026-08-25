import type { Metadata } from "next";
import { Shield, ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";

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

      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Aviso de Privacidad" }]} />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-oswald)" }}>
          Aviso de Privacidad
        </h1>
        <p className="text-sm text-slate-400 mb-4">
          Versión vigente: {INQUIRY_CONSENT_VERSION}
        </p>

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
              <li><span className="font-semibold">Correo electrónico:</span> hola@scsecuritysummit.com</li>
              <li><span className="font-semibold">Teléfono:</span> +52 899 112 8755</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Datos Personales que se Recaban</h2>
            <p>
              A través de los formularios de este sitio —solicitud de pase corporativo y solicitud de
              patrocinio— el Responsable recaba los siguientes datos personales:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Nombre(s) y apellidos</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono móvil</li>
              <li>Empresa y cargo</li>
              <li>
                Cantidad de accesos solicitados, para pases corporativos
              </li>
              <li>
                El mensaje o interés que el titular incluya en una solicitud de
                patrocinio
              </li>
              <li>
                Idioma, versión del aviso aceptado y fecha y hora del
                consentimiento
              </li>
              <li>
                Datos de atribución de campaña, página de llegada, referencia y
                marcas de tiempo de primera y última interacción, únicamente
                cuando el titular haya aceptado las tecnologías de analítica y
                marketing
              </li>
              <li>
                Estado, responsable asignado, notas internas y fecha de
                seguimiento que se generen al atender la solicitud
              </li>
            </ul>
            <p className="mt-3">
              Para limitar abuso, la dirección IP puede procesarse de forma
              transitoria por el servicio de rate limiting. No se guarda la
              dirección IP ni el user-agent en el registro de la solicitud.
            </p>
            <p className="mt-3">
              Cuando el titular <strong>compra un acceso individual</strong> en
              este sitio, el Responsable recaba además su nombre, correo
              electrónico, teléfono, empresa (opcional), el tipo y la cantidad
              de accesos, el importe pagado —el precio publicado ya incluye el
              IVA, que se desglosa internamente para efectos fiscales— y el
              estado del pago.
            </p>
            <p className="mt-3">
              Cuando el titular solicita un <strong>pase corporativo</strong>,
              el Responsable recaba además el{" "}
              <strong>nombre completo de cada persona que asistirá</strong> con
              ese bloque de accesos, uno por acceso solicitado. Estos datos los
              proporciona quien hace la solicitud por cuenta de esas personas y
              se utilizan únicamente para emitir la constancia DC-3 a nombre de
              cada participante y para el control de acceso el día del evento.
              No se recaba ningún otro dato de los participantes. Quien realiza
              la solicitud es responsable de haber informado a esas personas del
              tratamiento descrito en este aviso.
            </p>
            <p className="mt-3">
              El Responsable <strong>no recaba ni almacena datos de tarjetas
              bancarias ni credenciales de pago</strong>. Esos datos se
              capturan directamente en el entorno de{" "}
              <strong>MercadoPago</strong>, que actúa como procesador de pagos
              bajo su propio aviso de privacidad. Este sitio sólo conserva el
              identificador del pago y su estado.
            </p>
            <p className="mt-3">
              Únicamente si el titular <strong>solicita factura (CFDI)</strong>{" "}
              se recaban sus datos fiscales: RFC, razón social, régimen fiscal,
              uso del CFDI, código postal y, opcionalmente, un correo de
              facturación. Si no solicita factura, ninguno de estos datos se
              recaba ni se almacena.
            </p>
            <p className="mt-3">
              El Responsable <strong>no recaba datos personales sensibles</strong> en el sentido del artículo 3, fracción VI de la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. Finalidades del Tratamiento</h2>
            <p><strong>Finalidades primarias</strong> (necesarias para la relación jurídica entre el Responsable y el titular):</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Atender las solicitudes de pase corporativo y de patrocinio recibidas a través del sitio.</li>
              <li>
                Procesar la compra de accesos individuales, cobrar el importe
                correspondiente a través de MercadoPago y emitir el
                comprobante de compra.
              </li>
              <li>
                Emitir el CFDI cuando el titular lo solicite, y cumplir las
                obligaciones fiscales y contables asociadas.
              </li>
              <li>Acreditar el acceso del titular al Evento el día de su celebración.</li>
              <li>Contactar al titular para dar seguimiento a su solicitud, compartir cotizaciones, disponibilidad y beneficios.</li>
              <li>Atender consultas relacionadas con el 1er Summit de Seguridad en la Cadena de Suministros 2026.</li>
              <li>
                Prevenir abuso, mantener la seguridad del servicio y conservar
                evidencia del consentimiento y del seguimiento operativo.
              </li>
            </ul>
            <p className="mt-4">
              Los datos de estos formularios no se utilizarán para campañas de
              eventos futuros sin recabar por separado el consentimiento que
              resulte aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              4. Personas Encargadas y Transferencias
            </h2>
            <p>
              Los encargados tecnológicos que intervienen en la operación son{" "}
              <strong>Vercel</strong> (hospedaje y ejecución de la aplicación),{" "}
              <strong>Supabase</strong> (base de datos de las solicitudes),{" "}
              <strong>Resend</strong> (entrega de notificaciones por correo) y{" "}
              <strong>Upstash</strong> (rate limiting y prevención de abuso).
              Estos proveedores tratan datos por cuenta del Responsable y
              pueden utilizar infraestructura fuera de México conforme a sus
              condiciones contractuales aplicables.
            </p>
            <p className="mt-3">
              De forma opcional y solo en Producción, <strong>Sentry</strong>{" "}
              procesa errores técnicos minimizados, sin contenido de
              formularios, encabezados, consultas, datos de usuario ni mensajes
              libres. Después del consentimiento de analítica y marketing,
              también pueden intervenir <strong>Google</strong> (Tag Manager,
              Analytics y Ads), <strong>Meta</strong> y{" "}
              <strong>LinkedIn</strong> para las finalidades descritas en la
              sección de cookies.
            </p>
            <p className="mt-3">
              El Responsable no comunica los datos de las solicitudes a
              terceros ajenos para finalidades propias, salvo que exista
              consentimiento o un supuesto permitido u obligatorio conforme a
              la legislación aplicable.
            </p>
            <p className="mt-3">
              Adicionalmente, <strong>MercadoPago</strong> procesa los pagos de
              los accesos individuales. El titular captura sus datos de pago
              directamente en el entorno de esa plataforma, la cual actúa como
              responsable independiente conforme a su propio aviso de
              privacidad. El Responsable recibe de MercadoPago únicamente el
              identificador y el estado del pago, no los datos bancarios.
            </p>
            <p className="mt-3">
              Los datos fiscales de quienes solicitan CFDI se comunican al{" "}
              <strong>proveedor autorizado de certificación (PAC)</strong> y a
              la <strong>autoridad fiscal</strong> en la medida necesaria para
              emitir el comprobante. Esta comunicación es una obligación legal
              y no requiere el consentimiento del titular.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Derechos ARCO</h2>
            <p>
              De conformidad con la LFPDPPP, el titular de los datos personales tiene derecho a <strong>Acceder</strong>,{" "}
              <strong>Rectificar</strong>, <strong>Cancelar</strong> u <strong>Oponerse</strong> (derechos ARCO) al
              tratamiento de sus datos personales. Para ejercer estos derechos, deberá enviar una solicitud al correo{" "}
              <a href="mailto:hola@scsecuritysummit.com" className="text-blue-600 hover:underline">hola@scsecuritysummit.com</a>{" "}
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
              El sitio web del Summit utiliza <strong>cookies técnicas estrictamente necesarias</strong> para su
              funcionamiento, que no requieren consentimiento.
            </p>
            <p className="mt-3">
              Adicionalmente, y <strong>únicamente previo consentimiento del titular</strong> otorgado en el
              banner de cookies, el sitio utiliza cookies y tecnologías de:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Analítica</strong>: Google Analytics 4, a través de Google Tag Manager, para medir el uso del sitio.</li>
              <li><strong>Marketing</strong>: Google Ads y, cuando estén configurados, Meta Pixel y LinkedIn Insight Tag, para medir el resultado de nuestras campañas y mostrar publicidad relevante.</li>
            </ul>
            <p className="mt-3">
              Mientras no se otorgue el consentimiento, dichas tecnologías no
              se cargan ni envían mediciones, incluidos pings sin cookies. El
              Consent Mode de Google se inicializa denegado y las etiquetas se
              montan solo después de elegir “Aceptar todas”. El titular puede
              otorgar, rechazar o cambiar su elección en cualquier momento
              desde el control permanente de configuración de cookies del
              sitio, o escribiendo a{" "}
              <a href="mailto:hola@scsecuritysummit.com" className="text-blue-600 hover:underline">hola@scsecuritysummit.com</a>.
            </p>
            <p className="mt-3">
              La atribución propia de campañas también permanece deshabilitada
              sin consentimiento. Al elegir solo cookies esenciales se borran
              del navegador los datos de atribución que hubiera generado una
              versión anterior del sitio y no se incorporan a la solicitud.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Medidas de Seguridad</h2>
            <p>
              El Responsable ha implementado medidas de seguridad técnicas, administrativas y físicas para proteger
              sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no
              autorizado.
            </p>
            <p className="mt-3">
              La información de los formularios se transmite mediante HTTPS y
              se almacena en Supabase antes de intentar la notificación por
              correo. El acceso de la aplicación utiliza credenciales
              exclusivas del servidor; el navegador no recibe claves de la
              base. Las tablas tienen controles de acceso a nivel de fila y se
              bloquea el acceso de los roles públicos.
            </p>
            <p className="mt-3">
              Los registros técnicos y de notificación se diseñaron para no
              incluir el contenido libre del formulario, correo, teléfono ni
              otros datos personales innecesarios. El acceso operativo debe
              realizarse mediante cuentas individuales con autenticación
              multifactor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              8. Conservación y Eliminación
            </h2>
            <p>
              Cada solicitud de pase corporativo o patrocinio se conserva
              durante <strong>18 meses</strong> desde su creación, salvo que
              exista una relación contractual, una solicitud ARCO en trámite o
              una obligación jurídica que justifique otro plazo.
            </p>
            <p className="mt-3">
              Las <strong>órdenes de compra de accesos</strong> y, en su caso,
              los datos fiscales asociados se conservan durante{" "}
              <strong>cinco años</strong>, porque son parte de la contabilidad
              y de los comprobantes fiscales cuya conservación exige el
              artículo 30 del Código Fiscal de la Federación. Este plazo no
              puede acortarse a petición del titular mientras la obligación
              fiscal subsista; una solicitud de cancelación se atiende
              bloqueando los datos hasta que el plazo venza.
            </p>
            <p className="mt-3">
              Al vencer el plazo que corresponda, una persona autorizada
              elimina los datos personales o los anonimiza de forma
              irreversible, documentando únicamente la fecha, el responsable,
              el número de registros y el resultado, sin duplicar datos
              personales en la evidencia operativa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Cambios al Aviso de Privacidad</h2>
            <p>
              El Responsable se reserva el derecho de modificar el presente Aviso de Privacidad. Cualquier modificación
              será publicada en el sitio web{" "}
              <a href="https://scsecuritysummit.com/aviso-de-privacidad" className="text-blue-600 hover:underline">
                scsecuritysummit.com/aviso-de-privacidad
              </a>.
              Se recomienda consultar esta página periódicamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Autoridad de Control</h2>
            <p>
              Si considera que el tratamiento de sus datos personales no está siendo realizado conforme a la LFPDPPP,
              puede acudir a la <strong>Secretaría Anticorrupción y Buen Gobierno</strong>, autoridad competente
              conforme a la legislación federal vigente, a través de su sitio web{" "}
              <a href="https://www.gob.mx/buengobierno" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.gob.mx/buengobierno
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
