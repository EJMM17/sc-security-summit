"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, TicketPercent } from "lucide-react";
import { previewCodigoDescuento, type DescuentoPreview } from "@/app/actions/descuento";

type Language = "es" | "en";
type TipoAcceso = "estudiante" | "general" | "vip";

const text = {
  es: {
    label: "¿Tienes un código de descuento?",
    placeholder: "Ej. SUMMIT-2026",
    apply: "Aplicar",
    applying: "Validando...",
    invalid: "Código no válido o vencido.",
    rateLimited: "Demasiados intentos. Espera unos minutos.",
    notForTier: "Este código no aplica al tipo de acceso seleccionado.",
    applied: (final: string, descuento: string) =>
      `Código aplicado: pagarás ${final} MXN (ahorras ${descuento} MXN).`,
    appliedFree: "Código aplicado: tu acceso queda sin costo.",
    note: "El descuento se confirma al completar el registro.",
  },
  en: {
    label: "Have a discount code?",
    placeholder: "e.g., SUMMIT-2026",
    apply: "Apply",
    applying: "Checking...",
    invalid: "Invalid or expired code.",
    rateLimited: "Too many attempts. Please wait a few minutes.",
    notForTier: "This code does not apply to the selected pass type.",
    applied: (final: string, descuento: string) =>
      `Code applied: you'll pay ${final} MXN (you save ${descuento} MXN).`,
    appliedFree: "Code applied: your pass is now free.",
    note: "The discount is confirmed when you complete your registration.",
  },
} as const;

const formatMxn = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);

function selectedTier(): TipoAcceso {
  const value = (document.getElementById("reg-tipo") as HTMLSelectElement | null)?.value;
  return value === "vip" || value === "estudiante" ? value : "general";
}

export default function DescuentoField({
  language = "es",
  defaultValue = "",
}: {
  language?: Language;
  defaultValue?: string;
}) {
  const t = text[language];
  const [preview, setPreview] = useState<DescuentoPreview | null>(null);
  const [tier, setTier] = useState<TipoAcceso | null>(null);
  const [isPending, startTransition] = useTransition();

  const onApply = () => {
    const input = document.getElementById("reg-codigo") as HTMLInputElement | null;
    const codigo = input?.value?.trim() ?? "";
    if (!codigo) {
      setPreview(null);
      return;
    }
    const currentTier = selectedTier();
    startTransition(async () => {
      const result = await previewCodigoDescuento(codigo);
      setPreview(result);
      setTier(currentTier);
    });
  };

  let feedback: { tone: "ok" | "error"; message: string } | null = null;
  if (preview) {
    if (!preview.ok) {
      feedback = {
        tone: "error",
        message: preview.message === "rate_limited" ? t.rateLimited : t.invalid,
      };
    } else {
      const applied = tier ? preview.precios[tier] : undefined;
      if (!applied) {
        feedback = { tone: "error", message: t.notForTier };
      } else if (applied.montoFinal === 0) {
        feedback = { tone: "ok", message: t.appliedFree };
      } else {
        feedback = {
          tone: "ok",
          message: t.applied(formatMxn(applied.montoFinal), formatMxn(applied.descuento)),
        };
      }
    }
  }

  return (
    <div>
      <label
        htmlFor="reg-codigo"
        className="block text-sm font-semibold text-slate-700 mb-1.5"
      >
        <span className="inline-flex items-center gap-1.5">
          <TicketPercent className="w-4 h-4 text-slate-400" aria-hidden="true" />
          {t.label}
        </span>
      </label>
      <div className="flex gap-2">
        <input
          id="reg-codigo"
          name="codigo_descuento"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          placeholder={t.placeholder}
          defaultValue={defaultValue}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          aria-describedby="codigo-feedback"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={isPending}
          className="shrink-0 px-4 py-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              {t.applying}
            </span>
          ) : (
            t.apply
          )}
        </button>
      </div>
      <div id="codigo-feedback" aria-live="polite">
        {feedback && (
          <p
            className={`text-xs mt-1.5 flex items-center gap-1 ${
              feedback.tone === "ok" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {feedback.tone === "ok" && (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            {feedback.message}
          </p>
        )}
        {feedback?.tone === "ok" && (
          <p className="text-[11px] text-slate-400 mt-0.5">{t.note}</p>
        )}
      </div>
    </div>
  );
}
