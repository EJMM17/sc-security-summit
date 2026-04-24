"use client";

import { useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   AMBIENT CANVAS — Premium WebGL Background Layer
   ═══════════════════════════════════════════════════════════════
   Awwwards-level fluid mesh in a lighter blue/cyan/indigo palette.
   Sits behind everything as a fixed layer at ~14% opacity —
   visible as a living watercolor wash that connects the page
   visually to the hero's gradient mesh.

   Features:
   • Lighter aurora palette (blue-300 / cyan-200 / indigo-200)
   • 14% opacity — clearly visible behind white sections
   • Mouse-reactive warp (tracks cursor position)
   • 5-octave FBM for organic fluid detail
   • Throttled to 30fps for GPU efficiency
   • Smooth breathing animation
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
      p  = rot * p * 2.0 + vec2(1.7, 9.2);
      a *= 0.48;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t  = u_time * 0.00010;   /* Slower drift for premium feel */

    /* Mouse warp — more pronounced */
    vec2 toMouse = (u_mouse - uv) * 0.15;

    /* Domain-warped FBM — larger patterns for atmospheric feel */
    vec2 q = vec2(
      fbm(uv * 1.2 + vec2(t * 0.5, t * 0.4) + toMouse),
      fbm(uv * 1.2 + vec2(t * 0.3, t * 0.6) + vec2(5.2, 1.3) + toMouse * 0.7)
    );
    float f = fbm(uv * 1.0 + 2.5 * q + vec2(t * 0.25, t * 0.4));

    /* Lighter aurora palette — visible on white backgrounds */
    vec3 blue3   = vec3(0.576, 0.773, 0.992);   /* ~blue-300 */
    vec3 cyan2   = vec3(0.647, 0.929, 0.961);   /* ~cyan-200 */
    vec3 indigo2 = vec3(0.780, 0.796, 0.973);   /* ~indigo-200 */
    vec3 blue5   = vec3(0.231, 0.510, 0.965);   /* ~blue-500 accent */

    /* Layer colours — soft transitions */
    vec3 col = mix(blue3, indigo2, smoothstep(-0.3, 0.4, f));
    col = mix(col, cyan2, smoothstep(0.1, 0.7, f) * 0.6);
    col = mix(col, blue5, smoothstep(0.4, 1.0, length(q)) * 0.15);

    /* Breathing pulse — subtle global intensity shift */
    float breath = 0.92 + 0.08 * sin(u_time * 0.0008);

    /* Soft glow near mouse */
    float md = length(uv - u_mouse);
    col += cyan2 * 0.08 * smoothstep(0.5, 0.0, md);

    gl_FragColor = vec4(col * breath, 0.14);
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

    /* Render at 40% of logical resolution — smooth gradients, performant */
    function resize() {
      const dpr   = Math.min(window.devicePixelRatio || 1, 1.5);
      const scale = 0.40;
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
    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 30; /* 30fps throttle */

    function draw(now: number) {
      raf = requestAnimationFrame(draw);

      /* Throttle to ~30fps */
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      sm.x += (mouse.current.x - sm.x) * 0.04;
      sm.y += (mouse.current.y - sm.y) * 0.04;

      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, performance.now() - startTime);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, sm.x, sm.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    const onVisChange = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw(performance.now());
    };
    document.addEventListener("visibilitychange", onVisChange);

    draw(performance.now());

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
