"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   HERO GRADIENT MESH — Diagonal Metallic Bands
   ═══════════════════════════════════════════════════════════════
   Renders rotated diagonal gradient bands behind the hero content.
   Each band carries a cylindrical highlight ("chrome-tube" shading)
   with per-band colour variation across the brand palette
   (navy → blue-900 → blue-700 → blue-600 → cyan-500 → blue-300).
   Edges are gently warped with low-frequency noise so the bands
   feel organic rather than mechanical. Runs at reduced resolution
   for performance.
   ─────────────────────────────────────────────────────────────── */

const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  uniform vec2  u_mouse;   // normalised 0..1

  /* ── Gradient noise primitives ── */
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i),             f),
          dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
          dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  /* Deterministic per-band randomness */
  float bandHash(float x) {
    return fract(sin(x * 12.9898) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float aspect = u_res.x / max(u_res.y, 1.0);

    /* Aspect-corrected coord, centred */
    vec2 p = uv - 0.5;
    p.x *= aspect;

    float t = u_time * 0.00018;

    /* Slight mouse-driven tilt */
    vec2 m = u_mouse - 0.5;
    float ang = -0.36 + m.x * 0.05;      /* ~ -20.6° base tilt */
    float cA = cos(ang), sA = sin(ang);
    vec2 rp = vec2(cA * p.x - sA * p.y,
                   sA * p.x + cA * p.y);

    /* ── Organic warp so band edges aren't mechanically straight ── */
    float w1 = fbm(rp * 1.3 + vec2(t * 1.6, -t * 1.1)) * 0.08;
    float w2 = fbm(rp * 2.8 + vec2(-t * 2.1, t * 1.7)) * 0.025;

    /* Cross-axis coordinate — this is where bands live */
    float crossAx = rp.y + w1 + w2;

    /* Variable band widths via low-frequency modulation along stripes */
    float phaseMod = fbm(vec2(rp.x * 0.30, t * 0.6)) * 0.22;
    float bandFreq = 2.55;
    float phase = crossAx * bandFreq + t * 1.25 + phaseMod;

    float bandIdx   = floor(phase);
    float bandLocal = fract(phase);            /* 0..1 inside a band */
    float bandRand  = bandHash(bandIdx);

    /* Cylindrical highlight per band — shifts slowly for life */
    float hiCenter = 0.42 + 0.22 * sin(bandIdx * 1.47 + t * 1.8);
    float d        = abs(bandLocal - hiCenter);
    float shade    = 1.0 - smoothstep(0.0, 0.55, d);

    /* Soft groove between bands (darker seam at 0 and 1) */
    float seam = smoothstep(0.0, 0.06, bandLocal) * smoothstep(1.0, 0.94, bandLocal);

    /* ── Brand palette ── */
    vec3 navy   = vec3(0.031, 0.047, 0.110);   /* deeper than #0F172A for drama */
    vec3 blue9  = vec3(0.118, 0.227, 0.541);   /* #1E3A8A */
    vec3 blue7  = vec3(0.114, 0.306, 0.847);   /* #1D4ED8 */
    vec3 blue6  = vec3(0.145, 0.388, 0.922);   /* #2563EB */
    vec3 cyan5  = vec3(0.024, 0.714, 0.831);   /* #06B6D4 */
    vec3 blue3  = vec3(0.576, 0.773, 0.992);   /* #93C5FD */

    /* Per-band colour variation — blends low/mid/high bases randomly */
    vec3 low  = mix(navy,  blue9, bandRand * 0.75);
    vec3 mid  = mix(blue7, blue6, bandRand);
    vec3 high = mix(blue6, cyan5, bandRand);
    vec3 peak = mix(cyan5, blue3, 0.6);

    /* Layered colour mix — dark edges up to bright highlight */
    vec3 col = low;
    col = mix(col, mid,  smoothstep(0.15, 0.55, shade));
    col = mix(col, high, smoothstep(0.50, 0.88, shade));
    col = mix(col, peak, smoothstep(0.86, 1.00, shade) * 0.85);

    /* Chrome-tube effect: darken band seams */
    col *= mix(0.74, 1.0, seam);

    /* Deep navy anchor in the top-left corner for dramatic contrast */
    float corner = smoothstep(0.55, -0.15, uv.x) * smoothstep(0.25, 1.05, uv.y);
    col = mix(col, navy * 0.65, corner * 0.55);

    /* Soft centre vignette — keeps hero copy legible without flattening bands */
    float cDist = length((uv - 0.5) * vec2(aspect * 0.6, 1.0));
    float vign  = 1.0 - smoothstep(0.18, 0.75, cDist);
    col *= mix(1.0, 0.85, vign * 0.55);

    /* Gentle cyan bloom near cursor */
    vec2  mDiff = vec2((u_mouse.x - uv.x) * aspect, u_mouse.y - uv.y);
    float md    = length(mDiff);
    col += cyan5 * 0.08 * smoothstep(0.38, 0.0, md);

    /* Subtle film grain — premium finish */
    float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
    col += grain;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function HeroGradientMesh() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  const onMove = useCallback((e: MouseEvent) => {
    mouse.current.x = e.clientX / window.innerWidth;
    mouse.current.y = 1 - e.clientY / window.innerHeight; // GL y-flip
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* Full-screen quad */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, "u_time");
    const uRes   = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    /* 48% of device resolution — crisp bands without a perf hit */
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const s = 0.48;
      canvas!.width  = Math.round(canvas!.clientWidth  * dpr * s);
      canvas!.height = Math.round(canvas!.clientHeight * dpr * s);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const t0 = performance.now();

    /* Smoothed mouse for silky tracking */
    const sm = { x: 0.5, y: 0.5 };

    function draw() {
      sm.x += (mouse.current.x - sm.x) * 0.04;
      sm.y += (mouse.current.y - sm.y) * 0.04;

      gl!.uniform1f(uTime, performance.now() - t0);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, sm.x, sm.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    };
    document.addEventListener("visibilitychange", onVis);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("mousemove", onMove);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [onMove]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
