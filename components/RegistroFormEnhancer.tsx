"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { RegistroFlashState } from "@/lib/registro-form-state";

type Language = "es" | "en";

const FIELD_TO_INPUT_ID: Array<{ field: string; id: string }> = [
  { field: "nombre", id: "reg-nombre" },
  { field: "apellido", id: "reg-apellido" },
  { field: "email", id: "reg-email" },
  { field: "empresa", id: "reg-empresa" },
  { field: "cargo", id: "reg-cargo" },
  { field: "telefono", id: "reg-telefono" },
  { field: "tipo_acceso", id: "reg-tipo" },
  { field: "credencial_estudiantil", id: "reg-credencial" },
  { field: "rfc", id: "reg-rfc" },
  { field: "razon_social", id: "reg-razon" },
  { field: "codigo_postal_fiscal", id: "reg-cp" },
  { field: "acepta_terminos", id: "reg-terminos" },
];

const feedbackText = {
  es: {
    successToastTitle: "¡Operación Exitosa!",
    errorToastTitle: "Aviso",
  },
  en: {
    successToastTitle: "Success!",
    errorToastTitle: "Notice",
  },
} as const;

export default function RegistroFormEnhancer({
  state,
  language,
}: {
  state: RegistroFlashState | null;
  language: Language;
}) {
  const hasAnnouncedRef = useRef(false);

  useEffect(() => {
    if (!state?.message || hasAnnouncedRef.current) return;

    const text = feedbackText[language];

    if (state.success) {
      toast.success(text.successToastTitle, { description: state.message });
    } else {
      toast.error(text.errorToastTitle, { description: state.message });
    }

    hasAnnouncedRef.current = true;
  }, [language, state]);

  useEffect(() => {
    if (!state || state.success || !state.errors) return;

    const summary = document.getElementById("registro-error-summary");
    if (summary) {
      summary.focus({ preventScroll: false });
    }

    const firstErroredField = FIELD_TO_INPUT_ID.find(({ field }) => state.errors?.[field]?.length);
    if (!firstErroredField) return;

    const input = document.getElementById(firstErroredField.id);
    if (!input) return;

    setTimeout(() => {
      (input as HTMLInputElement).focus({ preventScroll: true });
    }, 100);
  }, [state]);

  return null;
}
