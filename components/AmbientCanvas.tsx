"use client";

import { useEffect, useRef } from "react";

const VERT_SRC = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

/* Domain-warped FBM fluid mesh — navy/blue/cyan brand palette.
   Alpha stays at 0.055 so on white sections the tint is ~5.5%,
   giving depth without compromising WCAG contrast on text layers. */
const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;

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
    for (int i = 0; i < 4; i++) {
      v += a * gnoise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t  = u_time * 0.0002;

    vec2 q = vec2(
      fbm(uv * 1.6 + vec2(t * 0.7, t * 0.5)),
      fbm(uv * 1.6 + vec2(t * 0.4, t * 0.8) + vec2(5.2, 1.3))
    );
    float f = fbm(uv * 1.3 + 2.5 * q + vec2(t * 0.35, t * 0.55));

    vec3 navy = vec3(0.059, 0.090, 0.165);
    vec3 blue  = vec3(0.118, 0.227, 0.541);
    vec3 cyan  = vec3(0.133, 0.827, 0.933);

    vec3 col = mix(navy, blue, clamp(f * 1.2 + 0.5, 0.0, 1.0));
    col = mix(col, cyan, clamp(length(q) * 0.28, 0.0, 0.14));

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

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_res");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    /* Render at 38% of logical resolution — imperceptible for smooth noise, major GPU saving */
    function resize() {
      const dpr   = Math.min(window.devicePixelRatio || 1, 1.5);
      const scale = 0.38;
      canvas!.width  = Math.round(window.innerWidth  * dpr * scale);
      canvas!.height = Math.round(window.innerHeight * dpr * scale);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    let raf = 0;
    const startTime = performance.now();

    function draw() {
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, performance.now() - startTime);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
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
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

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
