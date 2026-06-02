"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { RegistroFlashState } from "@/lib/registro-form-state";
import { stashUserData } from "@/lib/enhanced-conversions";

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

const FORM_ID = "registro-form";

function pushEvent(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
}

function fieldValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | null)?.value ?? "";
}

function fieldChecked(id: string): boolean {
  return (document.getElementById(id) as HTMLInputElement | null)?.checked ?? false;
}

export default function RegistroFormEnhancer({
  state,
  language,
}: {
  state: RegistroFlashState | null;
  language: Language;
}) {
  const hasAnnouncedRef = useRef(false);

  // ── Toast feedback ─────────────────────────────────────────────────
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

  // ── Focus management + form_error event on validation failure ──────
  useEffect(() => {
    if (!state || state.success || !state.errors) return;

    const erroredFields = Object.keys(state.errors).filter(
      (key) => key !== "_form" && state.errors?.[key]?.length,
    );

    pushEvent("form_error", {
      cta_location: "registro",
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
      language,
      error_fields: erroredFields.join(","),
      error_count: erroredFields.length,
    });

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
  }, [state, language]);

  // ── form_start (first interaction) ─────────────────────────────────
  useEffect(() => {
    const form = document.getElementById(FORM_ID);
    if (!form) return;

    let fired = false;
    const onFirstInteraction = () => {
      if (fired) return;
      fired = true;
      pushEvent("form_start", {
        cta_location: "registro",
        page_path: window.location.pathname,
        language,
      });
    };

    form.addEventListener("focusin", onFirstInteraction);
    form.addEventListener("change", onFirstInteraction);
    return () => {
      form.removeEventListener("focusin", onFirstInteraction);
      form.removeEventListener("change", onFirstInteraction);
    };
  }, [language]);

  // ── Stash Enhanced Conversions user data on submit ─────────────────
  useEffect(() => {
    const form = document.getElementById(FORM_ID);
    if (!form) return;

    const onSubmit = (event: SubmitEvent) => {
      if (form.dataset.submitting === "true") {
        event.preventDefault();
        return;
      }
      form.dataset.submitting = "true";

      stashUserData({
        email: fieldValue("reg-email"),
        phone_number: fieldValue("reg-telefono"),
        first_name: fieldValue("reg-nombre"),
        last_name: fieldValue("reg-apellido"),
      });

      pushEvent("form_submit", {
        cta_location: "registro",
        page_path: window.location.pathname,
        language,
        tipo_acceso: fieldValue("reg-tipo") || "general",
        cfdi_required: fieldChecked("reg-cfdi-toggle"),
      });
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [language]);

  return null;
}
