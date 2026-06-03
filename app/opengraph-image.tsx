import { ImageResponse } from "next/og";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";
export const alt = "SC Security Summit 2026 - Reynosa, Tamaulipas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const jpegBuffer = await sharp(
    path.join(process.cwd(), "public/images/gallery-keynote.webp")
  )
    .jpeg({ quality: 85 })
    .toBuffer();
  const base64 = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={base64}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Dark gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background:
            "linear-gradient(105deg, rgba(10,16,35,0.92) 0%, rgba(10,16,35,0.82) 55%, rgba(10,16,35,0.55) 100%)",
          display: "flex",
        }}
      />

      {/* Accent bar left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 6,
          background: "linear-gradient(to bottom, #22d3ee, #0e7490)",
          display: "flex",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 72px",
          gap: 0,
          width: "100%",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 20,
            color: "#22d3ee",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 14,
            display: "flex",
          }}
        >
          1er Summit · Cadena de Suministros
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 74,
            color: "#ffffff",
            fontWeight: 800,
            lineHeight: 0.95,
            textTransform: "uppercase",
            marginBottom: 22,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Seguridad en la</span>
          <span style={{ color: "#22d3ee" }}>Cadena de</span>
          <span>Suministros</span>
        </div>

        {/* Date + Location */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 8,
          }}
        >
          <div
            style={{
              background: "#22d3ee",
              color: "#0a1023",
              fontSize: 22,
              fontWeight: 800,
              padding: "8px 20px",
              borderRadius: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
            }}
          >
            24 SEPT 2026
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              display: "flex",
            }}
          >
            Reynosa, Tamaulipas
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            marginTop: 28,
            fontSize: 16,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.08em",
            display: "flex",
          }}
        >
          scsecuritysummit.com
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
