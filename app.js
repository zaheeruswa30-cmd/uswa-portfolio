/* ============================================================
   app.js — interactions
   Uswa Zaheer · Cybersecurity Portfolio
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. THEME TOGGLE ---------- */
  const root = document.documentElement;
  const toggle = $('#themeToggle');
  const THEME_KEY = 'uswa-theme';

  /* Theme preference is remembered with a cookie (works in sandboxed frames,
     where storage APIs are blocked). Falls back to memory only if disabled. */
  function safeGet(key) {
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      document.cookie = key + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; samesite=lax';
    } catch (e) {
      /* preference kept in memory for this visit only */
    }
  }

  let theme =
    safeGet(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  function applyTheme(next) {
    theme = next;
    root.setAttribute('data-theme', next);
    if (toggle) toggle.setAttribute('aria-pressed', String(next === 'dark'));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#05080b' : '#f4f7f6');
    safeSet(THEME_KEY, next);
    /* Tell the other scripts (radar.js, fx.js) that colours changed so they can redraw. */
    document.dispatchEvent(new CustomEvent('uz:theme', { detail: { theme: next } }));
  }

  applyTheme(theme);

  /* ---------- 1b. TINY SHARED API ----------
     The new files (certs.js, github.js, radar.js, fx.js, terminal.js) are plain
     scripts, so they talk to app.js through this one small global object. */
  window.UZ = {
    reduceMotion: reduceMotion,
    getTheme: function () {
      return theme;
    },
    toggleTheme: function () {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
      return theme;
    },
    /* github.js stores its fetched data here so the terminal can print it. */
    githubData: null,
  };

  if (toggle) {
    toggle.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
  }

  /* ---------- 2. MOBILE MENU ---------- */
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileMenu.hidden = open;
    });
    $$('a', mobileMenu).forEach((a) =>
      a.addEventListener('click', () => {
        menuBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
      })
    );
  }

  /* ---------- 3. SCROLL: progress, sticky nav, to-top, active link ---------- */
  const nav = $('#nav');
  const bar = $('#progressBar');
  const toTop = $('#toTop');
  const sections = $$('main section[id]');
  const navLinks = $$('.nav__links a');

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-stuck', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);

    let current = '';
    sections.forEach((sec) => {
      if (sec.getBoundingClientRect().top <= 140) current = sec.id;
    });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + current));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    );
  }

  /* ---------- 4. REVEAL ON SCROLL ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            setTimeout(() => el.classList.add('is-visible'), i * 70);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 5. COUNTERS ---------- */
  const counters = $$('.stats b[data-count]');
  function runCounter(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCounter(e.target);
            co.unobserve(e.target);
          }
        }),
      { threshold: 0.5 }
    );
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- 6. SKILL BARS ---------- */
  const bars = $$('.bar');
  function fillBar(barEl) {
    const level = barEl.dataset.level || '0';
    const fill = $('.bar__track span', barEl);
    if (fill) fill.style.width = level + '%';
  }
  if ('IntersectionObserver' in window) {
    const bo = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fillBar(e.target);
            bo.unobserve(e.target);
          }
        }),
      { threshold: 0.4 }
    );
    bars.forEach((b) => bo.observe(b));
  } else {
    bars.forEach(fillBar);
  }

  /* ---------- 7. HERO TYPEWRITER ---------- */
  const typeOut = $('#typeOut');
  const phrases = [
    'network defence · traffic analysis · SOC workflows',
    'web application security · OWASP Top 10',
    'linux hardening · least privilege · logging',
    'python automation for security operations',
  ];
  if (typeOut) {
    if (reduceMotion) {
      typeOut.textContent = phrases[0];
    } else {
      let pi = 0;
      let ci = 0;
      let deleting = false;
      (function tick() {
        const text = phrases[pi];
        ci += deleting ? -1 : 1;
        typeOut.textContent = text.slice(0, ci);
        let delay = deleting ? 28 : 55;
        if (!deleting && ci === text.length) {
          deleting = true;
          delay = 1900;
        } else if (deleting && ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
          delay = 420;
        }
        setTimeout(tick, delay);
      })();
    }
  }

  /* ---------- 8. PROJECT FILTERS + POINTER GLOW ---------- */
  const filters = $$('.filter');
  const cards = $$('.pcard');

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        /* 'all' shows everything, 'demo' shows cards that have a live URL,
           anything else matches the card's data-cat value. */
        const show =
          f === 'all' || (f === 'demo' ? card.dataset.demo === '1' : card.dataset.cat === f);
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  /* ---------- 9. INTERACTIVE CONSOLE ----------
     Moved to terminal.js so this file stays easy to read.
     terminal.js uses window.UZ (above) for the theme command. */


  /* ---------- 10. CONTACT: copy email + mailto form ---------- */
  const EMAIL = 'zaheeruswa30@gmail.com';
  const copyBtn = $('#copyEmail');
  const copiedMsg = $('#copiedMsg');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(EMAIL);
        ok = true;
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = EMAIL;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          ok = document.execCommand('copy');
        } catch (e2) {
          ok = false;
        }
        document.body.removeChild(ta);
      }
      if (copiedMsg) {
        copiedMsg.textContent = ok ? 'Copied to clipboard' : EMAIL;
        copiedMsg.hidden = false;
        setTimeout(() => {
          copiedMsg.hidden = true;
        }, 2600);
      }
    });
  }

  const contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#cname');
      const email = $('#cemail');
      const msg = $('#cmsg');
      let valid = true;

      [name, email, msg].forEach((el) => {
        const field = el.closest('.field');
        const bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
        if (field) field.classList.toggle('has-error', bad);
        if (bad) valid = false;
      });

      if (!valid) return;

      const subject = encodeURIComponent('Portfolio enquiry from ' + name.value.trim());
      const body = encodeURIComponent(msg.value.trim() + '\n\n— ' + name.value.trim() + ' (' + email.value.trim() + ')');
      window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
    });
  }

  /* ---------- 11. AMBIENT GRID CANVAS ---------- */
  const canvas = $('#gridCanvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;
    const nodes = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 26000));
      nodes.length = 0;
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
        });
      }
    }

    function accent() {
      return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#2ee6a8';
    }

    function draw() {
      /* fx.js adds .has-gl once the WebGL backdrop is live — then this 2D
         fallback stops drawing (CSS fades it out) to save battery. */
      if (root.classList.contains('has-gl')) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      const color = accent();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.1, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j += 1) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 19000) {
            ctx.globalAlpha = 0.16 * (1 - d2 / 19000);
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  /* ---------- 12. FOOTER YEAR ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
