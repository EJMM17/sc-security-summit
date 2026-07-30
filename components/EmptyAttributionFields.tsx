import { ATTRIBUTION_FIELD_KEYS } from "@/lib/attribution";
import { MARKETING_CONSENT_FORM_FIELD } from "@/lib/consent";

/**
 * Preserves the form contract in visual deployments without mounting any
 * attribution capture or reading browser storage.
 */
export default function EmptyAttributionFields() {
  return (
    <>
      <input
        type="hidden"
        name={MARKETING_CONSENT_FORM_FIELD}
        value="essential"
        readOnly
      />
      {ATTRIBUTION_FIELD_KEYS.map((name) => (
        <input key={name} type="hidden" name={name} value="" readOnly />
      ))}
    </>
  );
}
