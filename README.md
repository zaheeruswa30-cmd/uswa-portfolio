# Uswa Zaheer — Cybersecurity Portfolio

A single-page, production-ready personal portfolio built with plain HTML, CSS and JavaScript.
No build step, no npm, no framework — open the folder in VS Code and start editing.

## Run it

**Option A — just open it**
Double-click `index.html` (or right-click → Open with → your browser).
Note: the live GitHub section needs a server or an internet connection; opened as a
`file://` page it quietly falls back to the saved snapshot.

**Option B — live reload in VS Code (recommended)**
1. Install the **Live Server** extension.
2. Right-click `index.html` → **Open with Live Server**.

**Option C — any local server**
```bash
python3 -m http.server 5173
# then visit http://localhost:5173
```

## Files

```
uswa-portfolio/
├── index.html        # all page content (sections, text, links)
├── base.css          # reset + design tokens (colors, type scale, spacing)
├── style.css         # layout and component styles
├── advanced.css      # styles for everything added in the upgrade
├── app.js            # theme toggle, reveals, counters, filters, form, network canvas
├── certs.js          # CERTIFICATIONS data + cards + lightbox
├── github.js         # live GitHub API: profile, language mix, push heatmap, repos
├── radar.js          # hand-rolled animated canvas skills radar
├── fx.js             # WebGL hero shader, custom cursor, magnetic buttons, text scramble
├── terminal.js       # the interactive console (boot sequence, commands, easter eggs)
└── assets/
    ├── portrait.jpg / .webp   # hero photo        (add these yourself)
    ├── full.jpg / .webp       # about photo       (add these yourself)
    ├── favicon.svg            # browser tab icon
    └── certs/<slug>.jpg       # certificate scans (add these yourself)
```

Each JS file is self-contained, wrapped in an IIFE, and heavily commented. Load order in
`index.html` is `app.js → certs.js → github.js → radar.js → fx.js → terminal.js`.

## What you must edit yourself

1. **Certificate details** — open `certs.js` and edit the `CERTIFICATIONS` array at the top.
   Every card, the terminal `certs` command and the lightbox are generated from it.
   ```js
   {
     slug: 'codealpha-cybersecurity-internship', // also the image filename
     title: 'Cyber Security Internship',
     issuer: 'CodeAlpha',
     issued: '2025',                 // replace every "Add your date"
     credentialId: 'CODEALPHA-...',  // replace every "Add your credential ID"
     url: 'https://…',               // verification link ('' for none)
     status: 'verified',             // 'verified' | 'placeholder' | 'in-progress'
     skills: ['Python', 'Scapy'],
   }
   ```
2. **Certificate images** — drop a scan or screenshot at `assets/certs/<slug>.jpg`
   (same `slug` as in the array). The page probes for the file on load; if it exists the
   generated badge is replaced automatically, if not the badge stays. Nothing breaks either way.
3. **Photos** — add `assets/portrait.jpg` and `assets/full.jpg` (optionally `.webp` versions).
   Until then a mint monogram placeholder is shown, which is intentional, not an error.
4. **GitHub username** — `github.js` → `const USERNAME = 'zaheeruswa30-cmd';`
   If you rename the account, also update `FALLBACK_REPOS` / `FALLBACK_USER` in the same file.

## How to customise

| What | Where |
|---|---|
| Name, headline, bio | `index.html` — hero and About sections |
| Email / LinkedIn / GitHub | `index.html` — search for `zaheeruswa30@gmail.com`; also `EMAIL` in `app.js` |
| Colors (dark + light) | `base.css` → `[data-theme='dark']` and `[data-theme='light']` blocks |
| Fonts | `base.css` → `--font-display`, `--font-body`, `--font-mono` |
| Skill bars | `index.html` → `data-level="82"` on each `.bar` (update the `<b>` label too) |
| Radar chart axes | `radar.js` → the `AXES` array (`label`, `short`, `value`) |
| Projects | `index.html` → `.pcard` articles (`data-cat` = filter group, `data-repo` = repo name, `data-demo="1"` = shows in the *Live demo* filter) |
| Certifications | `certs.js` → `CERTIFICATIONS` |
| GitHub section copy | `index.html` → section `05 — Live from GitHub` |
| Stats counters | `index.html` → `data-count` on `.stats b` |
| Terminal commands | `terminal.js` → the `COMMANDS` object |
| Hero shader look | `fx.js` → the fragment shader string (`FRAG`) |

## Features

- Dark / light theme toggle (remembers your choice, follows system preference by default)
- WebGL fragment-shader hero backdrop, with automatic fallback to the animated
  network-graph canvas when WebGL is unavailable or motion is reduced
- Custom cursor, magnetic buttons, scrambling hero text, pointer tilt on the portrait
  and a spotlight that follows the pointer across card grids
- Animated, hand-drawn canvas **skills radar** with hover tooltips (no chart library)
- **Certifications & licenses** section generated from data, with procedurally generated
  holographic badges when no scan exists, plus a keyboard-navigable lightbox
  (← → to move, Esc to close, click the backdrop to dismiss)
- **Live GitHub section**: profile card, language mix bar, 26-week public-push heatmap and
  repository cards straight from `api.github.com`; project cards get live stars and
  "updated N days ago". Rate-limited or offline visitors see a saved snapshot instead
- Filterable project grid (All / Blue team / Offensive / Secure dev / Live demo)
- Interactive console with a boot sequence, typed output, command history, Tab completion,
  Ctrl+L, and commands: `help about skills projects certs github education contact whoami
  resume theme scan nmap neofetch banner sudo history matrix clear open <section>`
- Scroll-reveal animations, scroll progress bar, animated counters and skill bars
- Contact form that opens the visitor's mail app pre-filled — no backend needed
- Fully responsive, keyboard accessible, and every animation respects `prefers-reduced-motion`

## Deploy free

- **GitHub Pages** — push this folder to a repo, then Settings → Pages → Deploy from branch (`main`, `/root`).
- **Netlify / Vercel** — drag the folder into the dashboard. No build command, publish directory = project root.

© Uswa Zaheer
