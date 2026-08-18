/* ============================================================
   github.js — live data from the public GitHub API
   ------------------------------------------------------------
   Change USERNAME below to point the whole section at another
   account. No API key is used (and none should be committed):
   the unauthenticated API allows ~60 requests per hour per IP,
   so everything degrades to FALLBACK_REPOS when that runs out.
   ============================================================ */
(function () {
  'use strict';

  const USERNAME = 'zaheeruswa30-cmd';
  const API = 'https://api.github.com';

  /* Hard-coded snapshot used when the API is rate-limited or offline. */
  const FALLBACK_REPOS = [
    { name: 'SECUREWATCH-FIM', description: 'Real-time File Integrity Monitoring & incident detection (SHA-256 baselines, Flask dashboard, REST API).', language: 'Python', stargazers_count: 0, pushed_at: '2026-08-09T11:48:42Z', html_url: 'https://github.com/zaheeruswa30-cmd/SECUREWATCH-FIM' },
    { name: 'securewatch', description: 'Demo SOC / endpoint-security console for a fictional fleet — React 18 + Vite.', language: 'JavaScript', stargazers_count: 0, pushed_at: '2026-08-16T17:31:44Z', html_url: 'https://github.com/zaheeruswa30-cmd/securewatch' },
    { name: 'passforge-app', description: 'Zero-knowledge password generator + vault: all crypto happens in the browser.', language: 'TypeScript', stargazers_count: 0, pushed_at: '2026-08-13T20:55:30Z', html_url: 'https://github.com/zaheeruswa30-cmd/passforge-app' },
    { name: 'CodeAlpha_BasicNetworkSniffer', description: 'Live packet capture with Python + Scapy for the CodeAlpha Cyber Security Internship.', language: 'Python', stargazers_count: 0, pushed_at: '2026-07-02T20:14:17Z', html_url: 'https://github.com/zaheeruswa30-cmd/CodeAlpha_BasicNetworkSniffer' },
    { name: 'portfolio', description: 'Advanced Intrusion Detection System — Java Swing desktop IDS built in NetBeans.', language: 'Java', stargazers_count: 0, pushed_at: '2026-07-07T15:18:56Z', html_url: 'https://github.com/zaheeruswa30-cmd/portfolio' },
    { name: 'live-location-tracker', description: 'Real-time location tracking with Node, Express, Socket.io and Leaflet.js.', language: 'JavaScript', stargazers_count: 0, pushed_at: '2026-07-16T17:26:16Z', html_url: 'https://github.com/zaheeruswa30-cmd/live-location-tracker' },
    { name: 'uswa-portfolio', description: 'This portfolio — hand-written HTML, CSS and JavaScript with no build step.', language: 'CSS', stargazers_count: 0, pushed_at: '2026-08-16T17:46:04Z', html_url: 'https://github.com/zaheeruswa30-cmd/uswa-portfolio' },
  ];

  const FALLBACK_USER = {
    login: USERNAME,
    name: 'Uswa Zaheer',
    bio: 'Game Developer at Astrocade',
    avatar_url: '',
    public_repos: FALLBACK_REPOS.length,
    followers: 0,
    following: 0,
    created_at: '2026-05-06T07:42:53Z',
    html_url: 'https://github.com/' + USERNAME,
  };

  /* Language dot colours (same idea as GitHub's linguist colours). */
  const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', Java: '#b07219',
    HTML: '#e34c26', CSS: '#563d7c', 'C++': '#f34b7d', C: '#555555', Shell: '#89e051',
    Dockerfile: '#384d54', PHP: '#4F5D95', Ruby: '#701516', Go: '#00ADD8', Other: '#8fa3ad',
  };

  const $ = (s) => document.querySelector(s);
  const profileEl = $('#ghProfile');
  const langsEl = $('#ghLangs');
  const heatEl = $('#ghHeat');
  const reposEl = $('#ghRepos');
  const noteEl = $('#ghNote');
  if (!profileEl || !reposEl) return;

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- tiny in-memory cache ----------
     Keeps us from calling the same endpoint twice on one page view. It is
     deliberately memory-only (no browser storage), so the page also works
     inside sandboxed iframes where storage APIs are blocked. */
  const mem = {};
  function cacheGet(key) {
    return mem[key] || null;
  }
  function cacheSet(key, value) {
    mem[key] = value;
  }

  async function getJSON(path) {
    const key = 'uz-gh:' + path;
    const hit = cacheGet(key);
    if (hit) return hit;
    const res = await fetch(API + path, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('github ' + res.status);
    const data = await res.json();
    cacheSet(key, data);
    return data;
  }

  /* ---------- formatting helpers ---------- */
  function relTime(iso) {
    const then = new Date(iso).getTime();
    if (!then) return '';
    const days = Math.floor((Date.now() - then) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    const months = Math.round(days / 30);
    if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
    const years = Math.round(days / 365);
    return years + (years === 1 ? ' year ago' : ' years ago');
  }
  const dot = (lang) =>
    '<span class="lang-dot" style="background:' + (LANG_COLORS[lang] || LANG_COLORS.Other) + '"></span>';

  /* ---------- renderers ---------- */
  function renderProfile(u, live) {
    const avatar = u.avatar_url
      ? '<img class="gh__avatar" src="' + esc(u.avatar_url) + '" alt="' + esc(u.login) + ' avatar" width="72" height="72" loading="lazy" onerror="this.style.display=\'none\'">'
      : '<div class="gh__avatar gh__avatar--gen">UZ</div>';
    profileEl.innerHTML =
      avatar +
      '<a class="gh__login" href="' + esc(u.html_url) + '" target="_blank" rel="noopener noreferrer">@' + esc(u.login) + '</a>' +
      '<p class="gh__bio">' + esc(u.bio || 'Cybersecurity undergraduate · builder of small security tools') + '</p>' +
      '<dl class="gh__stats">' +
      '<div><dt>Repos</dt><dd>' + u.public_repos + '</dd></div>' +
      '<div><dt>Followers</dt><dd>' + u.followers + '</dd></div>' +
      '<div><dt>On GitHub since</dt><dd>' + new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) + '</dd></div>' +
      '</dl>' +
      '<span class="gh__badge">' + (live ? 'live from api.github.com' : 'saved snapshot') + '</span>';
  }

  function renderLangs(repos) {
    const counts = {};
    repos.forEach((r) => {
      const l = r.language || 'Other';
      counts[l] = (counts[l] || 0) + 1;
    });
    const pairs = Object.keys(counts).map((k) => [k, counts[k]]).sort((a, b) => b[1] - a[1]);
    const total = pairs.reduce((n, p) => n + p[1], 0) || 1;
    const segs = pairs
      .map((p) => '<span style="width:' + ((p[1] / total) * 100).toFixed(1) + '%;background:' + (LANG_COLORS[p[0]] || LANG_COLORS.Other) + '" title="' + esc(p[0]) + '"></span>')
      .join('');
    const legend = pairs
      .map((p) => '<li>' + dot(p[0]) + esc(p[0]) + ' <b>' + Math.round((p[1] / total) * 100) + '%</b></li>')
      .join('');
    langsEl.innerHTML = '<div class="langbar">' + segs + '</div><ul class="langlegend">' + legend + '</ul>';
  }

  function renderHeat(events) {
    /* Count PushEvents per calendar day, then draw 26 weeks of 7 day cells. */
    const perDay = {};
    (events || []).forEach((ev) => {
      if (ev.type !== 'PushEvent') return;
      const d = new Date(ev.created_at);
      const key = d.toISOString().slice(0, 10);
      perDay[key] = (perDay[key] || 0) + (ev.payload && ev.payload.size ? ev.payload.size : 1);
    });
    const weeks = 26;
    const today = new Date();
    const cells = [];
    const start = new Date(today);
    start.setDate(start.getDate() - (weeks * 7 - 1));
    for (let i = 0; i < weeks * 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const n = perDay[key] || 0;
      const level = n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 8 ? 3 : 4;
      cells.push('<span class="heat__cell" data-level="' + level + '" title="' + key + ' · ' + n + ' push' + (n === 1 ? '' : 'es') + '"></span>');
    }
    const totalPushes = Object.keys(perDay).reduce((n, k) => n + perDay[k], 0);
    heatEl.innerHTML =
      '<div class="heat">' + cells.join('') + '</div>' +
      '<p class="heat__meta"><b>' + totalPushes + '</b> pushes across <b>' + Object.keys(perDay).length + '</b> active days in the visible window' +
      (totalPushes === 0 ? ' — GitHub only keeps ~90 days of public events, so a quiet window is normal.' : '.') +
      '</p>';
  }

  /* Repo descriptions on GitHub can be a whole paragraph. Keep them short
     so the cards line up; the CSS also clamps to three lines. */
  function shorten(text) {
    if (!text) return 'No description yet.';
    const clean = String(text).replace(/\s+/g, ' ').trim();
    return clean.length > 150 ? clean.slice(0, 147).trimEnd() + '\u2026' : clean;
  }

  function renderRepos(repos, live) {
    reposEl.innerHTML = repos
      .slice(0, 12)
      .map(
        (r) =>
          '<a class="ghrepo" href="' + esc(r.html_url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="ghrepo__name">' + esc(r.name) + '</span>' +
          '<span class="ghrepo__desc">' + esc(shorten(r.description)) + '</span>' +
          '<span class="ghrepo__foot">' +
          (r.language ? '<span>' + dot(r.language) + esc(r.language) + '</span>' : '<span>—</span>') +
          '<span>&#9733; ' + (r.stargazers_count || 0) + '</span>' +
          '<span>' + esc(relTime(r.pushed_at || r.updated_at)) + '</span>' +
          '</span></a>'
      )
      .join('');
    if (noteEl) {
      noteEl.textContent = live
        ? 'Fetched live from the public GitHub API a moment ago.'
        : 'GitHub API unavailable or rate-limited right now — showing a saved snapshot of the same repositories.';
    }
  }

  /* Enrich the hand-written project cards with live stars + last push. */
  function enrichProjectCards(repos) {
    repos.forEach((r) => {
      const slot = document.querySelector('.pcard__live[data-live-for="' + r.name + '"]');
      if (!slot) return;
      const stars = r.stargazers_count || 0;
      slot.innerHTML =
        (r.language ? dot(r.language) + esc(r.language) + ' · ' : '') +
        '&#9733; ' + stars + ' · updated ' + esc(relTime(r.pushed_at || r.updated_at));
      slot.classList.add('is-live');
    });
  }

  /* ---------- boot ---------- */
  async function init() {
    let user = FALLBACK_USER;
    let repos = FALLBACK_REPOS;
    let events = [];
    let live = false;

    try {
      const results = await Promise.all([
        getJSON('/users/' + USERNAME),
        getJSON('/users/' + USERNAME + '/repos?per_page=100&sort=updated'),
        getJSON('/users/' + USERNAME + '/events/public?per_page=100').catch(() => []),
      ]);
      user = results[0];
      repos = Array.isArray(results[1]) && results[1].length ? results[1] : FALLBACK_REPOS;
      events = Array.isArray(results[2]) ? results[2] : [];
      live = true;
    } catch (err) {
      /* Rate-limited (403), offline, or DNS blocked — the fallbacks above stay. */
      live = false;
    }

    repos = repos.slice().sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));

    renderProfile(user, live);
    renderLangs(repos);
    renderHeat(events);
    renderRepos(repos, live);
    enrichProjectCards(repos);

    if (window.UZ) window.UZ.githubData = { user: user, repos: repos, live: live };
    window.UZGitHub = { user: user, repos: repos, live: live, relTime: relTime };
  }

  init();
})();
