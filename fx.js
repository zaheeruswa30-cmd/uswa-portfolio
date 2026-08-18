/* ============================================================
   fx.js — the "wow" layer
   ------------------------------------------------------------
   1. WebGL fragment-shader backdrop (raw WebGL, no libraries)
   2. Custom cursor (dot + lagging ring)
   3. Magnetic buttons
   4. Glitch / scramble hero text
   5. Pointer tilt on the portrait + parallax on section headers
   6. Spotlight that follows the pointer over card grids

   Everything here is decoration. If WebGL is missing, the visitor
   prefers reduced motion, or the device is touch-only, each piece
   quietly switches itself off and the site still works.
   ============================================================ */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const root = document.documentElement;

  /* Pointer position, normalised 0..1, shared by several effects. */
  const pointer = { x: 0.5, y: 0.5, rawX: 0, rawY: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.rawX = e.clientX;
      pointer.rawY = e.clientY;
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
    },
    { passive: true }
  );

  /* ============================================================
     1. WEBGL SHADER BACKDROP
     ============================================================ */
  (function webglField() {
    const canvas = document.getElementById('glCanvas');
    if (!canvas) return;
    if (reduce) {
      canvas.remove(); /* 2D network canvas in app.js stays as the fallback */
      return;
    }

    let gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: true, depth: false }) ||
        canvas.getContext('experimental-webgl');
    } catch (e) {
      gl = null;
    }
    if (!gl) {
      canvas.remove();
      return;
    }

    const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

    /* Flowing "encrypted data field": layered sine noise in mint + cyan. */
    const FRAG = [
      'precision mediump float;',
      'uniform vec2 u_res;',
      'uniform float u_time;',
      'uniform vec2 u_mouse;',
      'uniform float u_scroll;',
      'uniform float u_light;',
      'float hash(vec2 v){ return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }',
      'float wave(vec2 uv, float t){',
      '  float a = sin(uv.x * 3.4 + t * 0.55) * 0.5;',
      '  float b = sin(uv.y * 4.1 - t * 0.42) * 0.5;',
      '  float c = sin((uv.x + uv.y) * 2.6 + t * 0.31);',
      '  return (a + b + c) / 3.0;',
      '}',
      'void main(){',
      '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);',
      '  uv *= 2.2;',
      '  vec2 m = (u_mouse - 0.5) * 1.4;',
      '  uv += m * 0.35;',
      '  uv.y += u_scroll * 0.6;',
      '  float t = u_time;',
      '  float f = wave(uv, t) + wave(uv * 1.9 + 3.0, t * 1.3) * 0.5;',
      '  float lines = smoothstep(0.72, 1.0, abs(sin(f * 7.0 + t * 0.35)));',
      '  float glow = smoothstep(1.1, 0.0, length(uv - m));',
      '  vec3 mint = vec3(0.18, 0.90, 0.66);',
      '  vec3 cyan = vec3(0.30, 0.79, 0.94);',
      '  vec3 col = mix(mint, cyan, 0.5 + 0.5 * sin(f * 2.0 + t * 0.2));',
      '  float grain = hash(gl_FragCoord.xy + t) * 0.05;',
      '  float alpha = (lines * 0.30 + glow * 0.16 + grain) * (1.0 - u_light * 0.45);',
      '  gl_FragColor = vec4(col * (0.6 + glow * 0.7), alpha);',
      '}',
    ].join('\n');

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      canvas.remove();
      return;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.remove();
      return;
    }
    gl.useProgram(prog);

    /* One full-screen triangle strip (two triangles). */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uScroll = gl.getUniformLocation(prog, 'u_scroll');
    const uLight = gl.getUniformLocation(prog, 'u_light');

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    size();
    window.addEventListener('resize', size);

    /* WebGL is live: mark the document so app.js can idle its 2D canvas. */
    root.classList.add('has-gl');

    let smoothX = 0.5;
    let smoothY = 0.5;
    const t0 = performance.now();
    (function frame(now) {
      smoothX += (pointer.x - smoothX) * 0.05;
      smoothY += (pointer.y - smoothY) * 0.05;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uMouse, smoothX, 1 - smoothY);
      gl.uniform1f(uScroll, max > 0 ? window.scrollY / max : 0);
      gl.uniform1f(uLight, root.getAttribute('data-theme') === 'light' ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    })(performance.now());
  })();

  /* ============================================================
     2. CUSTOM CURSOR  (dot + lagging ring)
     ============================================================ */
  (function customCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;
    if (reduce || coarse) {
      dot.remove();
      ring.remove();
      return;
    }
    root.classList.add('has-cursor');
    /* Stay invisible until the pointer actually moves, so the dot never
       sits parked in the top-left corner on load. */
    root.classList.add('cursor-out');
    window.addEventListener('pointermove', () => root.classList.remove('cursor-out'), { once: true, passive: true });

    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;

    (function loop() {
      /* The dot snaps to the pointer, the ring eases toward it. */
      dot.style.transform = 'translate3d(' + pointer.rawX + 'px,' + pointer.rawY + 'px,0)';
      rx += (pointer.rawX - rx) * 0.16;
      ry += (pointer.rawY - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();

    const HOT = 'a, button, input, textarea, .pcard, .cert-card, .ghrepo, summary, [role="tab"]';
    document.addEventListener('pointerover', (e) => {
      const hot = e.target.closest && e.target.closest(HOT);
      ring.classList.toggle('is-hot', !!hot);
    });
    document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    /* Hide while off-window so it never floats over other tabs' chrome. */
    document.addEventListener('mouseleave', () => root.classList.add('cursor-out'));
    document.addEventListener('mouseenter', () => root.classList.remove('cursor-out'));
  })();

  /* ============================================================
     3. MAGNETIC BUTTONS
     ============================================================ */
  (function magnetic() {
    if (reduce || coarse) return;
    document.querySelectorAll('.btn--primary').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = 'translate(' + (dx * 7).toFixed(2) + 'px,' + (dy * 5 - 2).toFixed(2) + 'px)';
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  })();

  /* ============================================================
     4. GLITCH / SCRAMBLE TEXT
     ============================================================ */
  (function scramble() {
    const targets = Array.from(document.querySelectorAll('.scramble'));
    if (!targets.length || reduce) return;
    const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFabcdef';

    function run(el, duration) {
      const text = el.dataset.text || el.textContent;
      const start = performance.now();
      const len = text.length;
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        let out = '';
        for (let i = 0; i < len; i += 1) {
          const reveal = p * len * 1.25 - i;
          if (text[i] === ' ') out += ' ';
          else if (reveal > 1) out += text[i];
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = text;
      }
      requestAnimationFrame(step);
    }

    targets.forEach((el, i) => setTimeout(() => run(el, 900), 220 + i * 160));
    const hot = document.querySelector('.hero__title .grad');
    if (hot) hot.addEventListener('mouseenter', () => run(hot, 600));
  })();

  /* ============================================================
     5. TILT + HEADER PARALLAX
     ============================================================ */
  (function tiltAndParallax() {
    if (reduce) return;

    const frame = document.querySelector('.portrait__frame');
    const portrait = document.querySelector('.portrait');
    if (frame && portrait && !coarse) {
      portrait.addEventListener('pointermove', (e) => {
        const r = portrait.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform =
          'perspective(900px) rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (-py * 8).toFixed(2) + 'deg)';
      });
      portrait.addEventListener('pointerleave', () => {
        frame.style.transform = '';
      });
    }

    const heads = Array.from(document.querySelectorAll('.section__head'));
    if (!heads.length) return;
    let queued = false;
    window.addEventListener(
      'scroll',
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          const vh = window.innerHeight;
          heads.forEach((head) => {
            const r = head.getBoundingClientRect();
            if (r.bottom < -100 || r.top > vh + 100) return;
            const t = (r.top - vh * 0.5) / vh; /* -1 … 1 */
            head.style.setProperty('--par', (t * -14).toFixed(2) + 'px');
          });
        });
      },
      { passive: true }
    );
  })();

  /* ============================================================
     6. SPOTLIGHT over card grids
     ============================================================ */
  (function spotlight() {
    if (reduce || coarse) return;
    const grids = document.querySelectorAll('#projectGrid, #certGrid, .gh__repos, .skills__cards');
    grids.forEach((grid) => {
      grid.classList.add('has-spot');
      grid.addEventListener(
        'pointermove',
        (e) => {
          const r = grid.getBoundingClientRect();
          grid.style.setProperty('--sx', e.clientX - r.left + 'px');
          grid.style.setProperty('--sy', e.clientY - r.top + 'px');
          grid.style.setProperty('--so', '1');
        },
        { passive: true }
      );
      grid.addEventListener('pointerleave', () => grid.style.setProperty('--so', '0'));
    });
  })();
})();
