import ScrollReveal from "@/components/ScrollReveal";
import RegistroForm from "@/components/RegistroForm";

export default function RegistroSection() {
  return (
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
            <RegistroForm />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
