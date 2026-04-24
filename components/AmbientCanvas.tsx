"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   AMBIENT CANVAS — Enhanced WebGL Background Layer
   ═══════════════════════════════════════════════════════════════
   Domain-warped FBM fluid mesh in the navy/blue/cyan palette.
   Sits behind everything as a fixed layer at ~5.5% opacity so
   it tints without competing with content.

   Upgraded with:
   • Mouse reactivity (subtle warp toward cursor)
   • 5-octave FBM for richer detail
   • Higher render scale (0.45) for more definition
   • Smoother colour transitions
   ─────────────────────────────────────────────────────────────── */

const VERT_SRC = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  uniform vec2  u_mouse;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float gnoise(vec2 p) {
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
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * gnoise(p);
      p  = rot * p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t  = u_time * 0.00015;

    /* Subtle mouse warp */
    vec2 toMouse = (u_mouse - uv) * 0.08;

    vec2 q = vec2(
      fbm(uv * 1.8 + vec2(t * 0.7, t * 0.5) + toMouse),
      fbm(uv * 1.8 + vec2(t * 0.4, t * 0.8) + vec2(5.2, 1.3) + toMouse * 0.6)
    );
    float f = fbm(uv * 1.5 + 2.8 * q + vec2(t * 0.35, t * 0.55));

    vec3 navy = vec3(0.059, 0.090, 0.165);
    vec3 blue  = vec3(0.118, 0.227, 0.541);
    vec3 cyan  = vec3(0.133, 0.827, 0.933);

    vec3 col = mix(navy, blue, clamp(f * 1.2 + 0.5, 0.0, 1.0));
    col = mix(col, cyan, clamp(length(q) * 0.28, 0.0, 0.14));

    /* Gentle glow near mouse */
    float md = length(uv - u_mouse);
    col += cyan * 0.04 * smoothstep(0.45, 0.0, md);

    gl_FragColor = vec4(col, 0.055);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  const onMove = useCallback((e: MouseEvent) => {
    mouse.current.x = e.clientX / window.innerWidth;
    mouse.current.y = 1 - e.clientY / window.innerHeight;
  }, []);

  useEffect(() => {
    /* Respect user motion preference — body::before static radials serve as fallback */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* Full-screen quad — two triangles via TRIANGLE_STRIP */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, "u_time");
    const uRes   = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    /* Render at 45% of logical resolution — sharper than before, still performant */
    function resize() {
      const dpr   = Math.min(window.devicePixelRatio || 1, 1.5);
      const scale = 0.45;
      canvas!.width  = Math.round(window.innerWidth  * dpr * scale);
      canvas!.height = Math.round(window.innerHeight * dpr * scale);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const startTime = performance.now();
    const sm = { x: 0.5, y: 0.5 };

    function draw() {
      sm.x += (mouse.current.x - sm.x) * 0.03;
      sm.y += (mouse.current.y - sm.y) * 0.03;

      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, performance.now() - startTime);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, sm.x, sm.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }

    const onVisChange = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    };
    document.addEventListener("visibilitychange", onVisChange);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("mousemove", onMove);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [onMove]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
