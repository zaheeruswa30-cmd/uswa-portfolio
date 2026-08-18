/* ============================================================
   radar.js — hand-rolled skills radar (spider chart)
   ------------------------------------------------------------
   No chart library: everything is drawn with the plain 2D canvas
   API. To change the chart, edit the AXES array below — the
   numbers should match the skill bars in index.html.
   ============================================================ */
(function () {
  'use strict';

  const AXES = [
    { label: 'Network Security', short: 'Network', value: 82 },
    { label: 'Linux Hardening', short: 'Linux', value: 78 },
    { label: 'Web App Security', short: 'Web app', value: 74 },
    { label: 'Python Automation', short: 'Python', value: 70 },
    { label: 'Cryptography', short: 'Crypto', value: 66 },
    { label: 'DFIR', short: 'DFIR', value: 60 },
  ];

  const canvas = document.getElementById('radarCanvas');
  const tip = document.getElementById('radarTip');
  const stage = canvas && canvas.parentElement;
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let radius = 0;
  let progress = reduce ? 1 : 0; /* 0 → 1 animation of the polygon */
  let hoverIndex = -1;
  let vertices = [];

  function css(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* Device-pixel-ratio aware sizing so the lines stay crisp. */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || 320;
    h = canvas.clientHeight || 320;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2 + 4;
    radius = Math.min(w, h) / 2 - (w < 340 ? 46 : 58);
    draw();
  }

  function pointAt(i, ratio) {
    /* Start at 12 o'clock and walk clockwise. */
    const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2;
    return { x: cx + Math.cos(a) * radius * ratio, y: cy + Math.sin(a) * radius * ratio, a: a };
  }

  function draw() {
    const primary = css('--color-primary', '#2ee6a8');
    const cyan = css('--color-cyan', '#4cc9f0');
    const grid = css('--color-border', '#1d2c37');
    const muted = css('--color-text-muted', '#8fa3ad');

    ctx.clearRect(0, 0, w, h);

    /* 1. grid rings */
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 5; ring += 1) {
      ctx.beginPath();
      for (let i = 0; i <= AXES.length; i += 1) {
        const p = pointAt(i % AXES.length, ring / 5);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.globalAlpha = ring === 5 ? 0.9 : 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* 2. spokes + labels */
    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
    AXES.forEach((axis, i) => {
      const edge = pointAt(i, 1);
      ctx.strokeStyle = grid;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(edge.x, edge.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const lp = pointAt(i, 1.16);
      ctx.fillStyle = i === hoverIndex ? primary : muted;
      const align = Math.abs(lp.x - cx) < 6 ? 'center' : lp.x > cx ? 'left' : 'right';
      ctx.textAlign = align;
      ctx.textBaseline = lp.y < cy - 4 ? 'bottom' : lp.y > cy + 4 ? 'top' : 'middle';
      /* Use the full label only when it actually fits inside the canvas,
         otherwise fall back to the short one. This keeps labels from being
         clipped on narrow layouts (mobile, or a half-width column). */
      const room = align === 'left' ? w - lp.x - 6 : align === 'right' ? lp.x - 6 : Math.min(lp.x, w - lp.x) * 2 - 6;
      const label = ctx.measureText(axis.label).width <= room ? axis.label : axis.short;
      ctx.fillText(label, lp.x, lp.y);
    });

    /* 3. animated polygon */
    const eased = 1 - Math.pow(1 - progress, 3);
    vertices = AXES.map((axis, i) => pointAt(i, (axis.value / 100) * eased));

    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, cyan);

    ctx.beginPath();
    vertices.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();

    /* 4. glowing vertices */
    vertices.forEach((p, i) => {
      const big = i === hoverIndex;
      ctx.shadowColor = primary;
      ctx.shadowBlur = big ? 18 : 10;
      ctx.fillStyle = big ? cyan : primary;
      ctx.beginPath();
      ctx.arc(p.x, p.y, big ? 5.5 : 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  /* ---------- animation: draw on scroll into view ---------- */
  function animateIn() {
    if (reduce) {
      progress = 1;
      draw();
      return;
    }
    const start = performance.now();
    const dur = 1300;
    function step(now) {
      progress = Math.min((now - start) / dur, 1);
      draw();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateIn();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(canvas);
  } else {
    animateIn();
  }

  /* ---------- hover tooltip ---------- */
  function onMove(e) {
    if (!vertices.length) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let found = -1;
    vertices.forEach((p, i) => {
      if (Math.hypot(p.x - mx, p.y - my) < 16) found = i;
    });
    if (found !== hoverIndex) {
      hoverIndex = found;
      draw();
    }
    if (tip) {
      if (found === -1) {
        tip.hidden = true;
      } else {
        tip.hidden = false;
        tip.textContent = AXES[found].label + ' — ' + AXES[found].value + '%';
        tip.style.left = vertices[found].x + 'px';
        tip.style.top = vertices[found].y - 14 + 'px';
      }
    }
  }

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', () => {
    hoverIndex = -1;
    if (tip) tip.hidden = true;
    draw();
  });

  /* ---------- redraw on theme change + resize ---------- */
  document.addEventListener('uz:theme', () => draw());
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });

  /* Fonts load after the script runs, so redraw once they are ready. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());

  resize();
  if (stage) stage.classList.add('is-ready');
})();
