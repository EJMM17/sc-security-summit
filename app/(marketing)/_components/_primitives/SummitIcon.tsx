import type { ReactNode, SVGProps } from "react";

/* ═══════════════════════════════════════════════════════════════
   SUMMIT ICON SET — bespoke, animated
   ───────────────────────────────────────────────────────────────
   A drawn-for-this-event replacement for the generic icon library.
   Every glyph lives on the same 24×24 grid, uses one stroke weight
   and round terminals, and is composed of ordered layers:

     data-si="draw"    structure — drawn on when the section reveals
     data-si="pop"     detail marks — scaled in after the structure
     data-si="live"    the element that answers a hover
     data-si="static"  present from the start, hover-only motion

   `pathLength="1"` normalises every shape, so one keyframe draws a
   9-unit circle and a 2-unit tick at exactly the same rate — that
   uniformity is what keeps the set from feeling hand-assembled.
   Rounded frames are written as paths rather than <rect> because
   pathLength is only dependable on <path> and <circle>.

   Muted layers use stroke-opacity, never opacity: the opacity
   channel belongs to the entrance animation.

   Motion lives in globals.css (§ SUMMIT ICON SET) so the markup
   stays declarative and one reduced-motion rule disarms all of it.
   ═══════════════════════════════════════════════════════════════ */

export type SummitIconName =
  // content set (mirrors lib/content.ts IconKey)
  | "shield-check"
  | "network"
  | "handshake"
  | "building-2"
  | "truck"
  | "globe"
  | "shopping-cart"
  | "monitor"
  | "eye"
  | "satellite"
  | "scan-line"
  | "book-open"
  | "mic-2"
  | "target"
  | "crown"
  | "trophy"
  | "medal"
  | "gem"
  | "ruler"
  | "layout-grid"
  | "users"
  // section set
  | "gauge"
  | "lock-keyhole"
  | "cycle"
  | "focus"
  | "route"
  | "deliver"
  | "map-pin"
  | "calendar"
  | "phone";

const D = "draw";
const P = "pop";
const L = "live";
const S = "static";

const GLYPHS: Record<SummitIconName, ReactNode> = {
  /* Plate lands, then the check is struck through it. */
  "shield-check": (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M12 2.6 20 5.5v6.1c0 4.5-3.3 7.6-8 9.8-4.7-2.2-8-5.3-8-9.8V5.5Z"
      />
      <path data-si={L} pathLength="1" d="M8.3 12.1 10.9 14.7 15.8 9.2" />
      <circle data-si={P} cx="12" cy="6.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),

  /* Hub and spokes: links reach outward, nodes land, a ping rides out. */
  network: (
    <>
      <path data-si={D} pathLength="1" d="M12 9.6 6 6.4M12 9.6 18 6.4M12 14.6v3.2" />
      <circle data-si={D} pathLength="1" cx="12" cy="12" r="2.6" />
      <circle data-si={P} cx="5" cy="5.4" r="2.2" />
      <circle data-si={P} cx="19" cy="5.4" r="2.2" />
      <circle data-si={P} cx="12" cy="20" r="2.2" />
      <circle data-si={S} cx="12" cy="12" r="5.4" strokeOpacity="0" />
    </>
  ),

  /* Alliance drawn as a chain link rather than a handshake: the
     partnership metaphor and the supply-chain metaphor are the same
     shape here, and two clasped hands never survive a 20px box. */
  handshake: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M10.3 14.4a3.4 3.4 0 0 1 0-4.8l2.6-2.6a3.4 3.4 0 0 1 4.8 4.8l-1.3 1.3"
      />
      <path
        data-si={D}
        pathLength="1"
        d="M13.7 9.6a3.4 3.4 0 0 1 0 4.8l-2.6 2.6a3.4 3.4 0 0 1-4.8-4.8l1.3-1.3"
      />
      <path data-si={L} pathLength="1" d="M9.8 14.2 14.2 9.8" strokeOpacity="0.55" />
    </>
  ),

  /* Plant silhouette: two low bays, a tower, then the windows. */
  "building-2": (
    <>
      <path data-si={D} pathLength="1" d="M3 20.4V10.1l6-3.4v3.6l6-3.4v13.5" />
      <path data-si={D} pathLength="1" d="M15 20.4V6.1h4.6v14.3" />
      <path data-si={D} pathLength="1" d="M1.8 20.4h20.4" />
      <circle data-si={P} cx="6.2" cy="13.4" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={P} cx="6.2" cy="16.9" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={P} cx="11.4" cy="13.4" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={P} cx="17.3" cy="10.2" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={L} cx="17.3" cy="15.4" r="0.85" fill="currentColor" stroke="none" />
    </>
  ),

  /* Container rig: box, cab, ribs, wheels — the road runs under it. */
  truck: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M3.8 5.4h8.6a1.4 1.4 0 0 1 1.4 1.4v8a1.4 1.4 0 0 1-1.4 1.4H3.8a1.4 1.4 0 0 1-1.4-1.4v-8a1.4 1.4 0 0 1 1.4-1.4Z"
      />
      <path data-si={D} pathLength="1" d="M13.8 9.2h3.7l3.6 3.6v3.4h-7.3" />
      <path data-si={D} pathLength="1" d="M6.4 7.6v6.4M10.2 7.6v6.4" strokeOpacity="0.6" />
      <circle data-si={P} cx="7.2" cy="18.2" r="1.8" />
      <circle data-si={P} cx="17.4" cy="18.2" r="1.8" />
      <path data-si={S} d="M1 21.2h22" strokeDasharray="2.6 3.4" strokeOpacity="0.32" />
    </>
  ),

  /* Sphere, equator, meridian — then a mark on the map. */
  globe: (
    <>
      <circle data-si={D} pathLength="1" cx="12" cy="12" r="9" />
      <path data-si={D} pathLength="1" d="M3.2 12h17.6" />
      <path data-si={L} pathLength="1" d="M12 3a13.6 13.6 0 0 1 0 18 13.6 13.6 0 0 1 0-18Z" />
      <circle data-si={P} cx="14.6" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),

  /* Procurement cart with a crate-ribbed basket. */
  "shopping-cart": (
    <>
      <path data-si={D} pathLength="1" d="M2.6 4.6h2.5l2.7 10.1h9.6l2.4-7.4H7.6" />
      <path data-si={D} pathLength="1" d="M11.8 7.3v7.4M16 7.3l-1 7.4" strokeOpacity="0.6" />
      <circle data-si={P} cx="9.4" cy="19.4" r="1.6" />
      <circle data-si={L} cx="16.8" cy="19.4" r="1.6" />
    </>
  ),

  /* Screen whose trend line redraws under the pointer. */
  monitor: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M4.4 3.8h15.2a2 2 0 0 1 2 2v8.6a2 2 0 0 1-2 2H4.4a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z"
      />
      <path data-si={D} pathLength="1" d="M12 16.4v3.8M8.6 20.2h6.8" />
      <path data-si={L} pathLength="1" d="M6.6 12.6 9.8 9.2l2.6 2.4 4.9-5.2" />
      <circle data-si={P} cx="17.3" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),

  /* Visibility: the lid draws, the iris opens, the pupil contracts. */
  eye: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M2.4 12s3.9-6.4 9.6-6.4S21.6 12 21.6 12s-3.9 6.4-9.6 6.4S2.4 12 2.4 12Z"
      />
      <circle data-si={D} pathLength="1" cx="12" cy="12" r="3.2" />
      <circle data-si={L} cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),

  /* Orbital asset: body, panels, and a signal that keeps pinging. */
  satellite: (
    <>
      <path data-si={D} pathLength="1" d="M11.6 10.1 14.1 12.6 11.6 15.1 9.1 12.6Z" />
      <path data-si={D} pathLength="1" d="M7.6 10.6 4.6 7.6 7.2 5l3 3" />
      <path data-si={D} pathLength="1" d="M15.6 14.6l3 3-2.6 2.6-3-3" />
      <path data-si={D} pathLength="1" d="M8.4 11.4l.9.9M14.8 13.8l.9.9" strokeOpacity="0.6" />
      <path data-si={L} pathLength="1" d="M15.6 6.6A7.3 7.3 0 0 1 18.4 9.4" />
      <path data-si={L} pathLength="1" d="M17.2 4.6A9.9 9.9 0 0 1 20.4 7.8" strokeOpacity="0.7" />
    </>
  ),

  /* Inspection frame with a beam that sweeps the aperture. */
  "scan-line": (
    <>
      <path data-si={D} pathLength="1" d="M3.4 8.6V5.8a2.4 2.4 0 0 1 2.4-2.4h2.8" />
      <path data-si={D} pathLength="1" d="M20.6 8.6V5.8a2.4 2.4 0 0 0-2.4-2.4h-2.8" />
      <path data-si={D} pathLength="1" d="M3.4 15.4v2.8a2.4 2.4 0 0 0 2.4 2.4h2.8" />
      <path data-si={D} pathLength="1" d="M20.6 15.4v2.8a2.4 2.4 0 0 1-2.4 2.4h-2.8" />
      <path data-si={L} pathLength="1" d="M5.6 12h12.8" />
    </>
  ),

  /* Open manual: covers, then the ruled lines. */
  "book-open": (
    <>
      <path data-si={D} pathLength="1" d="M12 6.6C10 5 7.4 4.6 4 4.8V18c3.4-.2 6 .2 8 1.8" />
      <path data-si={D} pathLength="1" d="M12 6.6C14 5 16.6 4.6 20 4.8V18c-3.4-.2-6 .2-8 1.8" />
      <path data-si={P} pathLength="1" d="M6.6 9.4h3M6.6 12.4h2.2" strokeOpacity="0.6" />
      <path data-si={L} pathLength="1" d="M14.4 9.4h3M14.4 12.4h2.2" strokeOpacity="0.6" />
    </>
  ),

  /* Stage mic with side arcs that behave like a level meter. */
  "mic-2": (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M12 3.2a2.6 2.6 0 0 1 2.6 2.6v5.4a2.6 2.6 0 0 1-5.2 0V5.8A2.6 2.6 0 0 1 12 3.2Z"
      />
      <path data-si={D} pathLength="1" d="M6.6 11.1a5.4 5.4 0 0 0 10.8 0" />
      <path data-si={D} pathLength="1" d="M12 16.5v3.9M8.8 20.4h6.4" />
      <path data-si={L} pathLength="1" d="M4 9.6v2.8" strokeOpacity="0.65" />
      <path data-si={L} pathLength="1" d="M20 9.6v2.8" strokeOpacity="0.65" />
    </>
  ),

  /* Rings settle from the outside in; the bullseye locks last. */
  target: (
    <>
      <circle data-si={D} pathLength="1" cx="12" cy="12" r="9" />
      <circle data-si={D} pathLength="1" cx="12" cy="12" r="5.2" />
      <path
        data-si={P}
        pathLength="1"
        d="M12 1.6v2.6M12 19.8v2.6M1.6 12h2.6M19.8 12h2.6"
        strokeOpacity="0.7"
      />
      <circle data-si={L} cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),

  crown: (
    <>
      <path data-si={D} pathLength="1" d="M3.2 18.4 4.8 7.1l4.5 3.7L12 4.1l2.7 6.7 4.5-3.7 1.6 11.3Z" />
      <path data-si={D} pathLength="1" d="M4.6 21h14.8" />
      <circle data-si={L} cx="12" cy="4.1" r="1.3" />
    </>
  ),

  trophy: (
    <>
      <path data-si={D} pathLength="1" d="M8 4.2h8v4.7a4 4 0 0 1-8 0Z" />
      <path data-si={D} pathLength="1" d="M8 5.6H5.3a2.7 2.7 0 0 0 2.9 4.1" />
      <path data-si={D} pathLength="1" d="M16 5.6h2.7a2.7 2.7 0 0 1-2.9 4.1" />
      <path
        data-si={D}
        pathLength="1"
        d="M12 12.9v4.3M8.4 20.6h7.2a3.6 3.6 0 0 0-3.6-3.4 3.6 3.6 0 0 0-3.6 3.4Z"
      />
      <path
        data-si={L}
        pathLength="1"
        d="m12 5.9.8 1.6 1.8.3-1.3 1.3.3 1.7-1.6-.8-1.6.8.3-1.7-1.3-1.3 1.8-.3Z"
      />
    </>
  ),

  medal: (
    <>
      <path data-si={D} pathLength="1" d="M8.4 2.8 12 9M15.6 2.8 12 9" />
      <circle data-si={D} pathLength="1" cx="12" cy="15.4" r="5.4" />
      <path data-si={L} pathLength="1" d="M9.7 15.5 11.4 17.2 14.6 13.7" />
      <circle data-si={S} cx="12" cy="15.4" r="7.6" strokeOpacity="0" />
    </>
  ),

  gem: (
    <>
      <path data-si={D} pathLength="1" d="M5 8.4 8.2 3.8h7.6L19 8.4 12 20.6Z" />
      <path data-si={D} pathLength="1" d="M5 8.4h14" />
      <path data-si={D} pathLength="1" d="M9.4 8.4 12 20.6 14.6 8.4" strokeOpacity="0.7" />
      <path data-si={L} pathLength="1" d="M8.2 3.8 9.4 8.4M15.8 3.8 14.6 8.4" strokeOpacity="0.7" />
    </>
  ),

  /* Standards and measurement: the bar, then its graduations. */
  ruler: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M4.6 14.5 14.5 4.6a1.7 1.7 0 0 1 2.4 0l2.5 2.5a1.7 1.7 0 0 1 0 2.4L9.5 19.4a1.7 1.7 0 0 1-2.4 0l-2.5-2.5a1.7 1.7 0 0 1 0-2.4Z"
      />
      <path data-si={P} pathLength="1" d="M8.6 10.5 10.4 12.3" />
      <path data-si={P} pathLength="1" d="M11.4 7.7 13.2 9.5" />
      <path data-si={L} pathLength="1" d="M14.2 4.9 16 6.7" />
    </>
  ),

  /* Four bays landing in a diagonal cadence. */
  "layout-grid": (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M5 3.2h4a1.8 1.8 0 0 1 1.8 1.8v4A1.8 1.8 0 0 1 9 10.8H5A1.8 1.8 0 0 1 3.2 9V5A1.8 1.8 0 0 1 5 3.2Z"
      />
      <path
        data-si={D}
        pathLength="1"
        d="M15 3.2h4A1.8 1.8 0 0 1 20.8 5v4a1.8 1.8 0 0 1-1.8 1.8h-4A1.8 1.8 0 0 1 13.2 9V5a1.8 1.8 0 0 1 1.8-1.8Z"
      />
      <path
        data-si={D}
        pathLength="1"
        d="M5 13.2h4a1.8 1.8 0 0 1 1.8 1.8v4A1.8 1.8 0 0 1 9 20.8H5A1.8 1.8 0 0 1 3.2 19v-4A1.8 1.8 0 0 1 5 13.2Z"
      />
      <path
        data-si={L}
        pathLength="1"
        d="M15 13.2h4a1.8 1.8 0 0 1 1.8 1.8v4a1.8 1.8 0 0 1-1.8 1.8h-4a1.8 1.8 0 0 1-1.8-1.8v-4a1.8 1.8 0 0 1 1.8-1.8Z"
      />
    </>
  ),

  users: (
    <>
      <circle data-si={D} pathLength="1" cx="9.2" cy="8" r="3.4" />
      <path data-si={D} pathLength="1" d="M3 20.4a6.2 6.2 0 0 1 12.4 0" />
      <circle data-si={D} pathLength="1" cx="17.2" cy="7.6" r="2.4" strokeOpacity="0.7" />
      <path data-si={L} pathLength="1" d="M16.8 13.4a5.4 5.4 0 0 1 4.4 7" strokeOpacity="0.7" />
    </>
  ),

  /* Maturity dial — the needle sweeps up and settles. */
  gauge: (
    <>
      <path data-si={D} pathLength="1" d="M3.6 18.4a9.6 9.6 0 1 1 16.8 0" />
      <path
        data-si={P}
        pathLength="1"
        d="M4.4 10.6l1.9.9M12 6.2v2.1M19.6 10.6l-1.9.9"
        strokeOpacity="0.6"
      />
      <path data-si={L} pathLength="1" d="M12 18.4 16.4 12.4" />
      <circle data-si={P} cx="12" cy="18.4" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),

  /* Access control — the shackle lifts and seats itself. */
  "lock-keyhole": (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M6.8 10.2h10.4a2.4 2.4 0 0 1 2.4 2.4v5.6a2.4 2.4 0 0 1-2.4 2.4H6.8a2.4 2.4 0 0 1-2.4-2.4v-5.6a2.4 2.4 0 0 1 2.4-2.4Z"
      />
      <path data-si={L} pathLength="1" d="M8 10.2V7.4a4 4 0 0 1 8 0v2.8" />
      <circle data-si={D} pathLength="1" cx="12" cy="14.4" r="1.6" />
      <path data-si={P} pathLength="1" d="M12 16v2.2" />
    </>
  ),

  /* Continuous improvement — the loop turns. */
  cycle: (
    <>
      <path data-si={L} pathLength="1" d="M20.4 12A8.4 8.4 0 0 1 6.5 18.3" />
      <path data-si={L} pathLength="1" d="M3.6 12A8.4 8.4 0 0 1 17.5 5.7" />
      <path data-si={D} pathLength="1" d="M20.4 7.6V12h-4.4" />
      <path data-si={D} pathLength="1" d="M3.6 16.4V12H8" />
    </>
  ),

  /* Brackets closing on a subject. */
  focus: (
    <>
      <path data-si={D} pathLength="1" d="M3.4 8.8V5.6a2.2 2.2 0 0 1 2.2-2.2h3.2" />
      <path data-si={D} pathLength="1" d="M20.6 8.8V5.6a2.2 2.2 0 0 0-2.2-2.2h-3.2" />
      <path data-si={D} pathLength="1" d="M3.4 15.2v3.2a2.2 2.2 0 0 0 2.2 2.2h3.2" />
      <path data-si={D} pathLength="1" d="M20.6 15.2v3.2a2.2 2.2 0 0 1-2.2 2.2h-3.2" />
      <circle data-si={L} cx="12" cy="12" r="3.4" />
      <circle data-si={P} cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),

  /* A lane that branches into a delivery node. */
  route: (
    <>
      <path data-si={D} pathLength="1" d="M6 7.8v8.4" />
      <path data-si={D} pathLength="1" d="M6 14.6c0-3.6 2.3-5.4 5.8-5.4h3.6" />
      <circle data-si={P} cx="6" cy="5.4" r="2.3" />
      <circle data-si={P} cx="6" cy="18.6" r="2.3" />
      <circle data-si={L} cx="17.7" cy="9.2" r="2.3" />
    </>
  ),

  /* Take-away: the arrow drops to the baseline. */
  deliver: (
    <>
      <path data-si={D} pathLength="1" d="M5.2 20h13.6" />
      <path data-si={L} pathLength="1" d="M12 3.6v10.8" />
      <path data-si={L} pathLength="1" d="M7.6 10.2 12 14.6l4.4-4.4" />
      <circle data-si={P} cx="12" cy="3.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),

  "map-pin": (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M12 21.4s7.2-5.9 7.2-11.4a7.2 7.2 0 1 0-14.4 0c0 5.5 7.2 11.4 7.2 11.4Z"
      />
      <circle data-si={D} pathLength="1" cx="12" cy="9.8" r="2.6" />
      <circle data-si={S} cx="12" cy="9.8" r="5.4" strokeOpacity="0" />
    </>
  ),

  calendar: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M5.4 5.2h13.2A2.4 2.4 0 0 1 21 7.6v10.6a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 18.2V7.6a2.4 2.4 0 0 1 2.4-2.4Z"
      />
      <path data-si={D} pathLength="1" d="M8 3.2v4M16 3.2v4" />
      <path data-si={D} pathLength="1" d="M3 9.8h18" />
      <circle data-si={P} cx="7.6" cy="13.6" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={P} cx="16.4" cy="13.6" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={P} cx="7.6" cy="17.4" r="0.85" fill="currentColor" stroke="none" />
      <circle data-si={L} cx="12" cy="15.5" r="2.5" />
    </>
  ),

  phone: (
    <>
      <path
        data-si={D}
        pathLength="1"
        d="M6.2 3.6h3.2l1.6 4-2 1.4a11.2 11.2 0 0 0 5 5l1.4-2 4 1.6v3.2a2 2 0 0 1-2.2 2C10.4 19.3 4.7 13.6 4.2 5.8a2 2 0 0 1 2-2.2Z"
      />
      <path data-si={L} pathLength="1" d="M15.2 4.4a5.4 5.4 0 0 1 4.4 4.4" strokeOpacity="0.75" />
      <path data-si={L} pathLength="1" d="M14.8 8a2.6 2.6 0 0 1 1.6 1.6" strokeOpacity="0.75" />
    </>
  ),
};

export interface SummitIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: SummitIconName;
  /** Accessible label. Omit for decorative icons — the common case. */
  title?: string;
}

export default function SummitIcon({
  name,
  title,
  className = "",
  strokeWidth = 1.6,
  ...rest
}: SummitIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={`summit-icon ${className}`.trim()}
      data-icon={name}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {GLYPHS[name]}
    </svg>
  );
}
