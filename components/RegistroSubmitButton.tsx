"use client";

import { Loader2, Send } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function RegistroSubmitButton({
  pendingLabel,
  idleLabel,
}: {
  pendingLabel: string;
  idleLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-4 text-base mt-2">
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {idleLabel}
          <Send className="w-4 h-4 ml-1" />
        </>
      )}
    </button>
  );
}
