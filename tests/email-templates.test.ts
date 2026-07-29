import { describe, expect, it } from "vitest";
import { emailShell, escapeHtml } from "@/lib/email-templates";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("emailShell", () => {
  it("wraps the body in the branded chrome", () => {
    const html = emailShell("Nueva solicitud", "<p>contenido</p>");
    expect(html).toContain("<title>Nueva solicitud</title>");
    expect(html).toContain("SC Security Summit 2026");
    expect(html).toContain("<p>contenido</p>");
  });

  it("does not swallow escaping done by the caller", () => {
    const body = `<p>${escapeHtml('<img src=x onerror="alert(1)">')}</p>`;
    const html = emailShell("Solicitud", body);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });
});
