"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   HERO GRADIENT MESH — Stripe Sessions–Inspired WebGL Background
   ═══════════════════════════════════════════════════════════════
   Renders an animated gradient mesh behind the hero content.
   Uses domain-warped FBM noise with the brand palette
   (navy → blue-900 → blue-600 → cyan-500) and reacts subtly
   to mouse movement. Runs at reduced resolution for performance.
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

  /* ── Gradient noise ── */
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i),             f),
          dot(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash(i + vec2(0,1)), f - vec2(0,1)),
          dot(hash(i + vec2(1,1)), f - vec2(1,1)), u.x),
      u.y
    );
  }

  /* ── FBM with 5 octaves for richer detail ── */
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);   // rotation between octaves
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time * 0.00012;    // very slow drift

    /* Mouse influence — subtle warp toward cursor */
    vec2 m = u_mouse;
    vec2 toMouse = (m - uv) * 0.15;

    /* Domain-warped FBM for fluid look */
    vec2 q = vec2(
      fbm(uv * 2.0 + vec2(t * 0.8, t * 0.6) + toMouse),
      fbm(uv * 2.0 + vec2(t * 0.5, t * 0.9) + vec2(5.2, 1.3) + toMouse * 0.7)
    );
    float f = fbm(uv * 1.8 + 3.0 * q + vec2(t * 0.4, t * 0.6));

    /* Brand palette — navy / blue-900 / blue-600 / cyan-500 */
    vec3 navy   = vec3(0.059, 0.090, 0.165);   // #0F172A
    vec3 blue9  = vec3(0.118, 0.227, 0.541);   // #1E3A8A
    vec3 blue6  = vec3(0.145, 0.388, 0.922);   // #2563EB
    vec3 cyan5  = vec3(0.024, 0.714, 0.831);   // #06B6D4

    /* Layered colour mix */
    vec3 c = mix(navy, blue9, smoothstep(-0.4, 0.3, f));
    c = mix(c, blue6, smoothstep(0.1, 0.8, f) * 0.55);
    c = mix(c, cyan5, smoothstep(0.35, 1.0, length(q)) * 0.22);

    /* Subtle vignette — darken edges */
    float vig = 1.0 - smoothstep(0.35, 1.1, length(uv - 0.5) * 1.3);
    c *= mix(0.7, 1.0, vig);

    /* Gentle pulsing brightness near mouse */
    float mouseDist = length(uv - m);
    c += cyan5 * 0.06 * smoothstep(0.5, 0.0, mouseDist);

    gl_FragColor = vec4(c, 1.0);
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

    /* 42% of device resolution — enough for smooth gradients */
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const s = 0.42;
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
