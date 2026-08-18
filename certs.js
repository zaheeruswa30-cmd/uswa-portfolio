/* ============================================================
   certs.js — Certifications & Licenses
   ------------------------------------------------------------
   HOW TO EDIT THIS FILE (this is the only file you need to touch
   to change what the Certifications section shows):

   1. Every credential is one object in the CERTIFICATIONS array below.
   2. Replace the placeholder entries with your real LinkedIn credentials:
        title        → exactly as LinkedIn shows it
        issuer       → the organisation that issued it
        issued       → e.g. 'Mar 2025'
        credentialId → the ID string, or '' if there is none
        url          → the "Show credential" link, or '' to hide the link
        slug         → the file name used for the image (no extension)
        skills       → the skill chips shown on the card
        status       → 'verified' | 'placeholder' | 'in-progress'
   3. To show the real certificate image, save it as:
        assets/certs/<slug>.jpg
      That's it — the card and the lightbox pick it up automatically.
      If the file is missing, a generated badge is drawn instead
      (issuer initials + holographic guilloché pattern), so the page
      never shows a broken image.
   ============================================================ */
(function () {
  'use strict';

  const CERTIFICATIONS = [
    {
      title: 'Cyber Security Internship',
      issuer: 'CodeAlpha',
      issued: '2025',
      credentialId: 'CODEALPHA-CS-INTERN',
      url: 'https://github.com/zaheeruswa30-cmd/CodeAlpha_BasicNetworkSniffer',
      slug: 'codealpha-cyber-security-internship',
      skills: ['Python', 'Scapy', 'Packet analysis', 'Network security'],
      status: 'verified',
      note: 'Completed the internship tasks, including a live packet sniffer built with Python + Scapy.',
    },
    {
      title: 'Introduction to Cybersecurity',
      issuer: 'Cisco Networking Academy',
      issued: 'Add your date',
      credentialId: 'Add your credential ID',
      url: 'https://www.linkedin.com/in/uswa-zaheer-3106553a3',
      slug: 'cisco-intro-to-cybersecurity',
      skills: ['Threat landscape', 'Network defence', 'Security basics'],
      status: 'placeholder',
    },
    {
      title: 'Pre Security Learning Path',
      issuer: 'TryHackMe',
      issued: 'Add your date',
      credentialId: 'Add your certificate ID',
      url: 'https://www.linkedin.com/in/uswa-zaheer-3106553a3',
      slug: 'tryhackme-pre-security',
      skills: ['Linux', 'Networking', 'Web fundamentals', 'Hands-on labs'],
      status: 'placeholder',
    },
    {
      title: 'Foundations of Cybersecurity',
      issuer: 'Google / Coursera',
      issued: 'Add your date',
      credentialId: 'Add your credential ID',
      url: 'https://www.linkedin.com/in/uswa-zaheer-3106553a3',
      slug: 'google-foundations-of-cybersecurity',
      skills: ['Security frameworks', 'SIEM basics', 'Risk & controls'],
      status: 'placeholder',
    },
    {
      title: 'Networking Basics',
      issuer: 'Cisco Networking Academy',
      issued: 'Add your date',
      credentialId: 'Add your credential ID',
      url: 'https://www.linkedin.com/in/uswa-zaheer-3106553a3',
      slug: 'cisco-networking-basics',
      skills: ['TCP/IP', 'Switching & routing', 'Subnetting'],
      status: 'placeholder',
    },
    {
      title: 'CompTIA Security+ (SY0-701)',
      issuer: 'CompTIA',
      issued: 'Targeted',
      credentialId: '—',
      url: '',
      slug: 'comptia-security-plus',
      skills: ['Threats & attacks', 'Architecture', 'Operations', 'GRC'],
      status: 'in-progress',
    },
  ];

  const grid = document.getElementById('certGrid');
  if (!grid) return;

  const STATUS_LABEL = {
    verified: 'Verified',
    placeholder: 'Edit me',
    'in-progress': 'In progress',
  };

  /* ---------- 1. Procedurally generated fallback badge ----------
     Pure SVG built from maths: a holographic gradient, a guilloché
     rosette (the wavy engraving you see on banknotes), scanlines and
     the issuer's initials. No image file needed. */
  function initials(issuer) {
    const words = issuer
      .replace(/[^A-Za-z ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    /* Two words -> first letter of each ("Google Coursera" -> GC).
       One word  -> first two letters ("CodeAlpha" -> CA) so the badge
       never shows a lonely single character. */
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  function guillochePath(cx, cy, base, amp, lobes, phase) {
    let d = '';
    for (let i = 0; i <= 360; i += 2) {
      const a = (i * Math.PI) / 180;
      const r = base + amp * Math.sin(lobes * a + phase);
      const x = (cx + r * Math.cos(a)).toFixed(1);
      const y = (cy + r * Math.sin(a)).toFixed(1);
      d += (i === 0 ? 'M' : 'L') + x + ' ' + y;
    }
    return d + 'Z';
  }

  function badgeSVG(cert, big) {
    const seed = cert.slug.length + cert.issuer.length;
    /* Unique gradient ids per badge, otherwise several inline SVGs would
       share one id and browsers would only honour the first. */
    const u = cert.slug.replace(/[^a-z0-9]/gi, '') + (big ? 'lb' : '');
    const rings = [];
    for (let k = 0; k < 4; k += 1) {
      rings.push(
        '<path d="' +
          guillochePath(200, 130, 58 + k * 13, 7 + (k % 3) * 3, 6 + ((seed + k) % 5), k * 0.7) +
          '" fill="none" stroke="url(#g2-' + u + ')" stroke-width="0.7" opacity="' +
          (0.5 - k * 0.08).toFixed(2) +
          '"/>'
      );
    }
    return (
      '<svg class="badge" viewBox="0 0 400 260" role="img" aria-label="Generated badge for ' +
      esc(cert.issuer) +
      '" preserveAspectRatio="xMidYMid slice">' +
      '<defs>' +
      '<linearGradient id="g1-' + u + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#0b1219"/><stop offset="55%" stop-color="#10242a"/>' +
      '<stop offset="100%" stop-color="#0a1a24"/></linearGradient>' +
      '<linearGradient id="g2-' + u + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#2ee6a8"/><stop offset="50%" stop-color="#4cc9f0"/>' +
      '<stop offset="100%" stop-color="#2ee6a8"/></linearGradient>' +
      '<pattern id="scan-' + u + '" width="4" height="4" patternUnits="userSpaceOnUse">' +
      '<rect width="4" height="1" fill="#ffffff" opacity="0.05"/></pattern>' +
      '</defs>' +
      '<rect width="400" height="260" fill="url(#g1-' + u + ')"/>' +
      rings.join('') +
      '<circle cx="200" cy="130" r="44" fill="none" stroke="url(#g2-' + u + ')" stroke-width="1.4"/>' +
      '<text x="200" y="142" text-anchor="middle" font-family="JetBrains Mono, monospace" ' +
      'font-size="34" font-weight="700" fill="url(#g2-' + u + ')">' +
      esc(initials(cert.issuer)) +
      '</text>' +
      '<text x="200" y="212" text-anchor="middle" font-family="JetBrains Mono, monospace" ' +
      'font-size="11" letter-spacing="3" fill="#8fa3ad">' +
      esc(cert.issuer.toUpperCase().slice(0, 30)) +
      '</text>' +
      (big
        ? '<text x="200" y="236" text-anchor="middle" font-family="JetBrains Mono, monospace" ' +
          'font-size="9" letter-spacing="1.5" fill="#5d707b">GENERATED PLACEHOLDER</text>'
        : '') +
      '<rect width="400" height="260" fill="url(#scan-' + u + ')"/>' +
      '</svg>'
    );
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function imgPath(cert) {
    return './assets/certs/' + cert.slug + '.jpg';
  }

  /* ---------- 2. Cards ---------- */
  function cardHTML(cert, i) {
    const chips = cert.skills.map((s) => '<li>' + esc(s) + '</li>').join('');
    const link = cert.url
      ? '<a class="cert-card__link" href="' + esc(cert.url) + '" target="_blank" rel="noopener noreferrer">Show credential &#8599;</a>'
      : '<span class="cert-card__link is-off">No public credential link</span>';
    return (
      '<article class="cert-card reveal is-visible" data-i="' + i + '" data-status="' + cert.status + '">' +
      '<button type="button" class="cert-card__thumb" aria-label="View the ' + esc(cert.title) + ' certificate">' +
      badgeSVG(cert, false) +
      '</button>' +
      '<div class="cert-card__body">' +
      '<div class="cert-card__top">' +
      '<span class="cert-card__issuer">' + esc(cert.issuer) + '</span>' +
      '<span class="cert-card__status">' + STATUS_LABEL[cert.status] + '</span>' +
      '</div>' +
      '<h3 class="cert-card__title">' + esc(cert.title) + '</h3>' +
      '<p class="cert-card__meta">Issued ' + esc(cert.issued) + '</p>' +
      '<p class="cert-card__id">ID · ' + esc(cert.credentialId || '—') + '</p>' +
      '<ul class="chips cert-card__chips">' + chips + '</ul>' +
      link +
      '</div></article>'
    );
  }

  grid.innerHTML = CERTIFICATIONS.map(cardHTML).join('');

  /* Try the real image for each card; swap it in only if it actually loads. */
  CERTIFICATIONS.forEach((cert, i) => {
    const probe = new Image();
    probe.onload = function () {
      cert.hasImage = true;
      const thumb = grid.querySelector('.cert-card[data-i="' + i + '"] .cert-card__thumb');
      if (thumb) thumb.innerHTML = '<img src="' + imgPath(cert) + '" alt="' + esc(cert.title) + ' certificate" loading="lazy">';
    };
    probe.onerror = function () {
      cert.hasImage = false;
    };
    probe.src = imgPath(cert);
  });

  /* ---------- 3. Lightbox ---------- */
  const dlg = document.getElementById('certLightbox');
  const stage = document.getElementById('lbStage');
  const lbTitle = document.getElementById('lbTitle');
  const lbIssuer = document.getElementById('lbIssuer');
  const lbFoot = document.getElementById('lbFoot');
  let current = 0;

  function render(i) {
    current = (i + CERTIFICATIONS.length) % CERTIFICATIONS.length;
    const c = CERTIFICATIONS[current];
    lbTitle.textContent = c.title;
    lbIssuer.textContent = c.issuer + ' · ' + c.issued;
    stage.innerHTML = c.hasImage
      ? '<img src="' + imgPath(c) + '" alt="' + esc(c.title) + ' certificate">'
      : '<div class="lightbox__badge">' + badgeSVG(c, true) + '</div>';
    const hint = c.hasImage
      ? ''
      : '<p class="cert-card__hint">No image yet — add your scan at <code>assets/certs/' + esc(c.slug) + '.jpg</code> and it will show here.</p>';
    lbFoot.innerHTML =
      '<p class="lightbox__id">ID · ' + esc(c.credentialId || '—') + '</p>' +
      (c.url ? '<a href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">Show credential &#8599;</a>' : '') +
      hint;
  }

  function open(i) {
    if (!dlg) return;
    render(i);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  function close() {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  /* Clicking anywhere on a card opens the lightbox — except on the real
     "Show credential" link, which should still open the issuer's page. */
  grid.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const card = e.target.closest('.cert-card');
    if (!card) return;
    open(Number(card.dataset.i));
  });

  if (dlg) {
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', () => render(current - 1));
    document.getElementById('lbNext').addEventListener('click', () => render(current + 1));
    /* Arrow keys navigate; Esc is handled natively by <dialog>. */
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') render(current - 1);
      if (e.key === 'ArrowRight') render(current + 1);
    });
    /* Click on the backdrop (outside .lightbox__inner) closes. */
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) close();
    });
  }

  /* Exposed so terminal.js can print the list and open the lightbox. */
  window.UZCerts = {
    list: CERTIFICATIONS,
    open: open,
    lines: function () {
      return CERTIFICATIONS.map(
        (c, i) =>
          String(i + 1).padStart(2, '0') +
          '  ' +
          c.title +
          ' — ' +
          c.issuer +
          ' (' +
          c.issued +
          ')' +
          (c.status === 'verified' ? '' : '  [' + STATUS_LABEL[c.status] + ']')
      );
    },
  };
})();
