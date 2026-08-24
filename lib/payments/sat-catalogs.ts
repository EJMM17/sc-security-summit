/**
 * Curated subsets of the SAT catalogs needed to request a CFDI 4.0 for a
 * conference ticket. These are stable published SAT codes; the labels are the
 * official Spanish descriptions with an English gloss for the EN site.
 *
 * The subsets are intentionally narrow. Offering the complete catalogs would
 * invite combinations the invoicing team cannot stamp for this concept.
 */

export type TaxPersonType = "fisica" | "moral";

export type SatCatalogEntry = {
  code: string;
  label: { es: string; en: string };
  personTypes: readonly TaxPersonType[];
};

/** c_RegimenFiscal — regimes that can legitimately deduct an event ticket. */
export const TAX_REGIMES: readonly SatCatalogEntry[] = [
  {
    code: "601",
    label: {
      es: "General de Ley Personas Morales",
      en: "General corporate regime",
    },
    personTypes: ["moral"],
  },
  {
    code: "603",
    label: {
      es: "Personas Morales con Fines no Lucrativos",
      en: "Non-profit legal entities",
    },
    personTypes: ["moral"],
  },
  {
    code: "605",
    label: {
      es: "Sueldos y Salarios e Ingresos Asimilados a Salarios",
      en: "Salaries and salary-equivalent income",
    },
    personTypes: ["fisica"],
  },
  {
    code: "606",
    label: { es: "Arrendamiento", en: "Leasing" },
    personTypes: ["fisica"],
  },
  {
    code: "608",
    label: { es: "Demás ingresos", en: "Other income" },
    personTypes: ["fisica"],
  },
  {
    code: "610",
    label: {
      es: "Residentes en el Extranjero sin Establecimiento Permanente en México",
      en: "Foreign residents without a permanent establishment in Mexico",
    },
    personTypes: ["fisica", "moral"],
  },
  {
    code: "612",
    label: {
      es: "Personas Físicas con Actividades Empresariales y Profesionales",
      en: "Individuals with business and professional activities",
    },
    personTypes: ["fisica"],
  },
  {
    code: "616",
    label: { es: "Sin obligaciones fiscales", en: "No tax obligations" },
    personTypes: ["fisica"],
  },
  {
    code: "620",
    label: {
      es: "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
      en: "Production cooperatives deferring income",
    },
    personTypes: ["moral"],
  },
  {
    code: "622",
    label: {
      es: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
      en: "Agriculture, livestock, forestry and fishing",
    },
    personTypes: ["moral"],
  },
  {
    code: "623",
    label: {
      es: "Opcional para Grupos de Sociedades",
      en: "Optional regime for corporate groups",
    },
    personTypes: ["moral"],
  },
  {
    code: "624",
    label: { es: "Coordinados", en: "Coordinated entities" },
    personTypes: ["moral"],
  },
  {
    code: "625",
    label: {
      es: "Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
      en: "Business activities through digital platforms",
    },
    personTypes: ["fisica"],
  },
  {
    code: "626",
    label: {
      es: "Régimen Simplificado de Confianza",
      en: "Simplified trust regime (RESICO)",
    },
    personTypes: ["fisica", "moral"],
  },
] as const;

/** c_UsoCFDI — uses that apply to a professional training/event expense. */
export const CFDI_USES: readonly SatCatalogEntry[] = [
  {
    code: "G03",
    label: { es: "Gastos en general", en: "General expenses" },
    personTypes: ["fisica", "moral"],
  },
  {
    code: "G01",
    label: { es: "Adquisición de mercancías", en: "Acquisition of goods" },
    personTypes: ["fisica", "moral"],
  },
  {
    code: "D10",
    label: {
      es: "Pagos por servicios educativos (colegiaturas)",
      en: "Educational services payments",
    },
    personTypes: ["fisica"],
  },
  {
    code: "CP01",
    label: { es: "Pagos", en: "Payments" },
    personTypes: ["fisica", "moral"],
  },
  {
    code: "S01",
    label: {
      es: "Sin efectos fiscales",
      en: "Without tax effects",
    },
    personTypes: ["fisica", "moral"],
  },
] as const;

export const TAX_REGIME_CODES: readonly string[] = TAX_REGIMES.map(
  (entry) => entry.code,
);

export const CFDI_USE_CODES: readonly string[] = CFDI_USES.map(
  (entry) => entry.code,
);

export function isTaxRegimeCode(value: unknown): value is string {
  return typeof value === "string" && TAX_REGIME_CODES.includes(value);
}

export function isCfdiUseCode(value: unknown): value is string {
  return typeof value === "string" && CFDI_USE_CODES.includes(value);
}

function findEntry(
  catalog: readonly SatCatalogEntry[],
  code: string,
): SatCatalogEntry | undefined {
  return catalog.find((entry) => entry.code === code);
}

/**
 * A regime declared for the wrong person type is the most common reason a PAC
 * rejects a stamping request, so it is validated before the order is stored
 * rather than discovered days later by the invoicing team.
 */
export function isRegimeValidForPersonType(
  code: string,
  personType: TaxPersonType,
): boolean {
  return findEntry(TAX_REGIMES, code)?.personTypes.includes(personType) ?? false;
}

export function isCfdiUseValidForPersonType(
  code: string,
  personType: TaxPersonType,
): boolean {
  return findEntry(CFDI_USES, code)?.personTypes.includes(personType) ?? false;
}

export function regimesForPersonType(
  personType: TaxPersonType,
): readonly SatCatalogEntry[] {
  return TAX_REGIMES.filter((entry) => entry.personTypes.includes(personType));
}

export function cfdiUsesForPersonType(
  personType: TaxPersonType,
): readonly SatCatalogEntry[] {
  return CFDI_USES.filter((entry) => entry.personTypes.includes(personType));
}
