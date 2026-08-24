import { describe, expect, it } from "vitest";
import {
  isValidPostalCode,
  maskRfc,
  normalizeRfc,
  RFC_PUBLICO_EN_GENERAL,
  RFC_RESIDENTE_EXTRANJERO,
  validateRfc,
} from "@/lib/payments/rfc";
import {
  isCfdiUseValidForPersonType,
  isRegimeValidForPersonType,
  cfdiUsesForPersonType,
  regimesForPersonType,
} from "@/lib/payments/sat-catalogs";

/** Narrows the union so a test can assert on the rejection reason. */
function rejectionReason(value: string): string {
  const result = validateRfc(value);
  return result.valid ? "unexpectedly_valid" : result.reason;
}

describe("normalizeRfc", () => {
  it("uppercases and strips the separators people type", () => {
    expect(normalizeRfc(" gome 800101-ab1 ")).toBe("GOME800101AB1");
    expect(normalizeRfc("abc-800101-xy2")).toBe("ABC800101XY2");
  });

  it("preserves Ñ and & which are valid RFC characters", () => {
    expect(normalizeRfc("ñu&a800101ab1")).toBe("ÑU&A800101AB1");
  });
});

describe("validateRfc", () => {
  it("accepts a 13-character persona física RFC", () => {
    expect(validateRfc("GOME800101AB1")).toEqual({
      valid: true,
      rfc: "GOME800101AB1",
      personType: "fisica",
    });
  });

  it("accepts a 12-character persona moral RFC", () => {
    expect(validateRfc("ABC800101XY2")).toEqual({
      valid: true,
      rfc: "ABC800101XY2",
      personType: "moral",
    });
  });

  it("accepts the foreign resident RFC but not público en general", () => {
    expect(validateRfc(RFC_RESIDENTE_EXTRANJERO).valid).toBe(true);
    expect(validateRfc(RFC_PUBLICO_EN_GENERAL)).toEqual({
      valid: false,
      reason: "generic",
    });
  });

  it("rejects empty, short and long values", () => {
    expect(rejectionReason("")).toBe("empty");
    expect(rejectionReason("   ")).toBe("empty");
    expect(rejectionReason("ABC80010")).toBe("length");
    expect(rejectionReason("ABCDE800101AB12")).toBe("length");
  });

  it("rejects a malformed structure", () => {
    expect(rejectionReason("1BC800101XY2")).toBe("format");
    expect(rejectionReason("ABCD80A101AB1")).toBe("format");
  });

  it("rejects an impossible birth or incorporation date", () => {
    expect(rejectionReason("ABC801301XY2")).toBe("date");
    expect(rejectionReason("ABC800132XY2")).toBe("date");
    expect(rejectionReason("ABC800100XY2")).toBe("date");
    expect(rejectionReason("ABC800230XY2")).toBe("date");
  });

  it("accepts 29 February because the RFC century is ambiguous", () => {
    expect(validateRfc("ABC000229XY2").valid).toBe(true);
    expect(validateRfc("ABC010229XY2").valid).toBe(true);
  });
});

describe("isValidPostalCode", () => {
  it("requires five digits and rejects the unassigned 00000", () => {
    expect(isValidPostalCode("88680")).toBe(true);
    expect(isValidPostalCode(" 88680 ")).toBe(true);
    expect(isValidPostalCode("00000")).toBe(false);
    expect(isValidPostalCode("8868")).toBe(false);
    expect(isValidPostalCode("886801")).toBe(false);
    expect(isValidPostalCode("8868A")).toBe(false);
  });
});

describe("maskRfc", () => {
  it("keeps only the alphabetic prefix so logs carry no tax identifier", () => {
    expect(maskRfc("GOME800101AB1")).toBe("GOME*********");
    expect(maskRfc("ABC800101XY2")).toBe("ABC*********");
    expect(maskRfc("nope")).toBe("invalid");
  });
});

describe("SAT catalog person-type rules", () => {
  it("rejects a corporate regime declared by a persona física", () => {
    expect(isRegimeValidForPersonType("601", "moral")).toBe(true);
    expect(isRegimeValidForPersonType("601", "fisica")).toBe(false);
    expect(isRegimeValidForPersonType("605", "fisica")).toBe(true);
    expect(isRegimeValidForPersonType("605", "moral")).toBe(false);
  });

  it("allows RESICO for both taxpayer types", () => {
    expect(isRegimeValidForPersonType("626", "fisica")).toBe(true);
    expect(isRegimeValidForPersonType("626", "moral")).toBe(true);
  });

  it("rejects an unknown code", () => {
    expect(isRegimeValidForPersonType("999", "moral")).toBe(false);
    expect(isCfdiUseValidForPersonType("Z99", "moral")).toBe(false);
  });

  it("restricts the educational CFDI use to personas físicas", () => {
    expect(isCfdiUseValidForPersonType("D10", "fisica")).toBe(true);
    expect(isCfdiUseValidForPersonType("D10", "moral")).toBe(false);
  });

  it("offers a non-empty option list for both taxpayer types", () => {
    for (const personType of ["fisica", "moral"] as const) {
      expect(regimesForPersonType(personType).length).toBeGreaterThan(0);
      expect(cfdiUsesForPersonType(personType).length).toBeGreaterThan(0);
    }
  });
});
