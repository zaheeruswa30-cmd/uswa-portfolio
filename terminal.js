/* ============================================================
   terminal.js — the interactive console
   ------------------------------------------------------------
   Add a command by adding one entry to COMMANDS: the key is what
   the visitor types, the value is a function that returns a string
   (or an array of lines). Return null to print nothing.
   Everything is simulated — nothing here touches a real system.
   ============================================================ */
(function () {
  'use strict';

  const screen = document.getElementById('consoleScreen');
  const form = document.getElementById('consoleForm');
  const input = document.getElementById('consoleInput');
  if (!screen || !form || !input) return;

  const reduce = (window.UZ && window.UZ.reduceMotion) || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const history = [];
  let historyIndex = -1;
  let queue = Promise.resolve();
  /* Bumped whenever the screen is cleared so half-typed output gives up. */
  let generation = 0;

  /* ---------- output helpers ---------- */
  function newLine(cls) {
    const el = document.createElement('div');
    el.className = cls || 'cout';
    screen.appendChild(el);
    return el;
  }

  function scroll() {
    screen.scrollTop = screen.scrollHeight;
  }

  /* Types one line character-by-character (instant when reduced motion). */
  function typeLine(text, cls, speed) {
    return new Promise((resolve) => {
      const el = newLine(cls);
      if (reduce || text.length > 400) {
        el.textContent = text;
        scroll();
        resolve();
        return;
      }
      let i = 0;
      const step = () => {
        el.textContent = text.slice(0, (i += 2));
        scroll();
        if (i < text.length) setTimeout(step, speed || 6);
        else resolve();
      };
      step();
    });
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  }

  /* Types a block of lines right now (no queueing). */
  async function typeLines(lines, cls, gap) {
    const arr = Array.isArray(lines) ? lines : String(lines).split('\n');
    const myGen = generation;
    for (let i = 0; i < arr.length; i += 1) {
      if (myGen !== generation) return; /* screen was cleared — stop typing */
      await typeLine(arr[i], cls);
      if (gap) await wait(gap);
    }
  }

  /* Queue keeps output in order even when several commands are fired fast. */
  function emit(lines, cls, gap) {
    queue = queue.then(() => typeLines(lines, cls, gap));
    return queue;
  }

  /* Clearing the screen also abandons any output still waiting to type. */
  function clearScreen() {
    generation += 1;
    queue = Promise.resolve();
    screen.innerHTML = '';
  }

  function printPrompt(cmd) {
    const line = newLine('cin');
    const b = document.createElement('b');
    b.textContent = 'uswa@portfolio:~$ ';
    line.appendChild(b);
    line.appendChild(document.createTextNode(cmd));
    scroll();
  }

  /* ---------- commands ---------- */
  const SECTIONS = ['about', 'skills', 'projects', 'certifications', 'github', 'journey', 'lab', 'contact'];

  const COMMANDS = {
    help: () => [
      'Available commands:',
      '  about        → who I am',
      '  skills       → technical skill summary',
      '  projects     → my real public repositories',
      '  certs        → certifications & licenses',
      '  github       → live GitHub repo list',
      '  education    → degree & university',
      '  contact      → email, LinkedIn, GitHub',
      '  resume       → one-screen résumé',
      '  open <name>  → scroll to a section (' + SECTIONS.join(', ') + ')',
      '  theme        → switch light / dark mode',
      '  scan         → simulated posture check',
      '  nmap         → simulated port scan',
      '  neofetch     → system-style facts',
      '  matrix       → easter egg (any key stops it)',
      '  banner       → big ASCII banner',
      '  history      → commands you have run',
      '  whoami       → quick identity',
      '  sudo         → try it',
      '  clear        → clear the screen (or press Ctrl+L)',
      '',
      'Tip: press Tab to complete a command, ArrowUp/Down for history.',
    ],
    about: () =>
      'Uswa Zaheer — BS Cybersecurity undergraduate at Dawood University of\nEngineering & Technology, Karachi. Focused on blue-team defence,\nnetwork security and secure development.',
    skills: () =>
      'Network security 82% · Linux hardening 78% · Web app security 74%\nPython automation 70% · Cryptography 66% · DFIR 60%',
    projects: () =>
      [
        '01 SecureWatch-FIM ................ file integrity monitoring (Python/Flask)',
        '02 SecureWatch Console ........... demo SOC console (React 18 + Vite)',
        '03 PassForge Vault ............... zero-knowledge password vault (TS/React)',
        '04 Basic Network Sniffer ......... Python + Scapy (CodeAlpha internship)',
        '05 Advanced IDS .................. Java Swing desktop IDS',
        '06 Live Location Tracker ......... Node + Socket.io + Leaflet',
        '07 This portfolio ................ plain HTML/CSS/JS, no build step',
      ],
    certs: () => {
      if (!window.UZCerts) return 'certifications module not loaded';
      return ['Certifications & licenses:'].concat(window.UZCerts.lines()).concat([
        '',
        "Run 'open certifications' to see the cards, or click one for the full credential.",
      ]);
    },
    github: () => {
      const data = window.UZGitHub;
      if (!data) return 'still fetching github data — try again in a second';
      const head = data.live
        ? 'live from api.github.com · @' + data.user.login
        : 'saved snapshot (api rate-limited or offline) · @' + data.user.login;
      return [head, ''].concat(
        data.repos.slice(0, 10).map((r) => {
          const name = (r.name + ' ').padEnd(32, '.');
          return '  ' + name + ' ' + (r.language || '—') + ' · ★' + (r.stargazers_count || 0) + ' · ' + data.relTime(r.pushed_at || r.updated_at);
        })
      );
    },
    education: () =>
      'Dawood University of Engineering & Technology, Karachi\nBS Cybersecurity (undergraduate) — in progress',
    contact: () =>
      'email    zaheeruswa30@gmail.com\nlinkedin linkedin.com/in/uswa-zaheer-3106553a3\ngithub   github.com/zaheeruswa30-cmd',
    whoami: () => 'uswa_zaheer :: cybersecurity undergraduate :: karachi, pk',
    resume: () => [
      '┌─ USWA ZAHEER ─────────────────────────────────────────────┐',
      '│ BS Cybersecurity (undergrad) · DUET Karachi, Pakistan     │',
      '│ zaheeruswa30@gmail.com · github.com/zaheeruswa30-cmd      │',
      '└───────────────────────────────────────────────────────────┘',
      'FOCUS      blue team · network & web security · secure development',
      'STRENGTHS  traffic analysis, Linux hardening, Python automation',
      'PROJECTS   SecureWatch-FIM · SecureWatch Console · PassForge Vault',
      '           Basic Network Sniffer · Advanced IDS · Location Tracker',
      'CREDENTIAL CodeAlpha Cyber Security Internship (+ see: certs)',
      'SEEKING    SOC / security-research / GRC internship',
      '',
      'No PDF here on purpose — email me and I will send the latest one.',
    ],
    theme: () => {
      const next = window.UZ ? window.UZ.toggleTheme() : null;
      return next ? 'theme switched → ' + next + ' mode' : 'theme module unavailable';
    },
    scan: () =>
      '[+] enumerating surface ....... done\n[+] tls configuration ......... strong\n[+] headers (CSP, HSTS) ....... present\n[!] note: this is a friendly simulation, not a real scan\n[+] verdict ................... hire this analyst',
    nmap: () => [
      'Starting Nmap 7.94 ( simulated ) at ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
      'Nmap scan report for portfolio.uswa (127.0.0.1)',
      'Host is up (0.00021s latency).',
      '',
      'PORT     STATE  SERVICE     VERSION',
      '22/tcp   open   ssh         OpenSSH 9.6 (keys only, no passwords)',
      '80/tcp   open   http        redirects → 443',
      '443/tcp  open   https       TLS 1.3, HSTS enabled',
      '8080/tcp closed http-alt',
      '9200/tcp filtered elasticsearch  (behind the lab firewall)',
      '',
      'Service Info: OS: hardened Linux; CPE: cpe:/o:linux:linux_kernel',
      'Nmap done: 1 host up, scanned in 2.31s — and nothing real was touched.',
    ],
    neofetch: () => [
      '        ///////            uswa@portfolio',
      '     ///////////           ---------------',
      '    /////   /////          OS:        Hardened Linux (lab)',
      '   ////  ⌁  ////           Host:      DUET Karachi, PK',
      '   ////  ✓  ////           Kernel:    curiosity 6.9-blue-team',
      '    /////   /////          Uptime:    since first packet capture',
      '     ///////////           Shell:     zsh + tmux + vim',
      '        ///////            Editor:    VS Code (Live Server)',
      '          ///              Stack:     Python · Bash · JS · Java',
      '                           Tools:     Wireshark, Nmap, Burp, Splunk',
      '                           Focus:     detection engineering, DFIR',
      '                           Theme:     mint on near-black',
    ],
    banner: () => [
      ' _   _ ______        ___    ',
      '| | | / ___\\ \\      / / \\   ',
      '| | | \\___ \\\\ \\ /\\ / / _ \\  ',
      '| |_| |___) |\\ V  V / ___ \\ ',
      ' \\___/|____/  \\_/\\_/_/   \\_\\',
      '   z a h e e r  ·  s e c u r i t y',
    ],
    sudo: () => [
      '[sudo] password for visitor: ****',
      'Sorry, visitor is not in the sudoers file. This incident has been logged.',
      '(and by logged I mean I smiled at it — this console is a toy)',
    ],
    history: () => (history.length ? history.map((h, i) => String(i + 1).padStart(3, ' ') + '  ' + h) : 'no history yet'),
    clear: () => {
      clearScreen();
      return null;
    },
    matrix: () => {
      startMatrix();
      return 'wake up… (press any key to stop)';
    },
    open: (arg) => {
      const name = (arg || '').trim().toLowerCase();
      if (!name) return 'usage: open <' + SECTIONS.join('|') + '>';
      const match = SECTIONS.find((s) => s === name || s.startsWith(name));
      if (!match) return 'unknown section: ' + name;
      const el = document.getElementById(match);
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return 'scrolling to #' + match;
    },
  };

  /* ---------- matrix easter egg ---------- */
  function startMatrix() {
    if (screen.querySelector('.matrix')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix';
    screen.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = screen.clientWidth * dpr;
    canvas.height = screen.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = Math.floor(screen.clientWidth / 12);
    const drops = new Array(cols).fill(0).map(() => Math.random() * 40);
    const glyphs = 'アイウエオカキクケコ0123456789ABCDEF#$%&';
    let raf = 0;
    let stopped = false;

    function stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      canvas.remove();
      window.removeEventListener('keydown', stop, true);
      screen.removeEventListener('click', stop);
    }

    function frame() {
      ctx.fillStyle = 'rgba(5,8,11,0.14)';
      ctx.fillRect(0, 0, screen.clientWidth, screen.clientHeight);
      ctx.font = '12px "JetBrains Mono", monospace';
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2ee6a8';
      for (let i = 0; i < cols; i += 1) {
        ctx.fillStyle = Math.random() > 0.96 ? '#e8f1f3' : primary;
        ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 12, drops[i] * 14);
        drops[i] = drops[i] * 14 > screen.clientHeight && Math.random() > 0.975 ? 0 : drops[i] + 1;
      }
      raf = requestAnimationFrame(frame);
    }
    if (reduce) {
      /* No animation for reduced motion — show one static frame briefly. */
      frame();
      cancelAnimationFrame(raf);
      setTimeout(stop, 1200);
    } else {
      frame();
      setTimeout(stop, 7000);
    }
    window.addEventListener('keydown', stop, true);
    screen.addEventListener('click', stop);
  }

  /* ---------- run a command ---------- */
  function runCommand(raw) {
    const text = String(raw || '').trim();
    if (!text) return;
    history.push(text);
    historyIndex = history.length;

    const parts = text.split(/\s+/);
    const name = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    /* Everything for one command (echo, running it, typing the output) happens
       as a single queued step, so firing commands quickly never interleaves. */
    queue = queue.then(async () => {
      printPrompt(text);
      if (!COMMANDS[name]) {
        await typeLines("command not found: " + name + " — type 'help' for options", 'cerr');
        return;
      }
      const out = COMMANDS[name](arg);
      if (out !== null && out !== undefined) await typeLines(out, 'cout', name === 'nmap' ? 90 : 0);
    });
  }

  /* ---------- boot sequence (first time the console scrolls into view) ---------- */
  const BOOT = [
    'uswa-portfolio console v2.0 — sandboxed, read-only, entirely simulated',
    '[ ok ] mounting /dev/curiosity',
    '[ ok ] loading skill matrix ................ 6 domains',
    '[ ok ] verifying credentials ............... see `certs`',
    '[ ok ] contacting api.github.com ........... see `github`',
    '',
    "Type 'help' to list commands. Tab completes, Ctrl+L clears.",
  ];

  function boot() {
    emit(BOOT, 'cout', 120);
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            boot();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(screen);
  } else {
    boot();
  }

  /* ---------- input handling ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runCommand(input.value);
    input.value = '';
  });

  const NAMES = Object.keys(COMMANDS).sort();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex -= 1;
        input.value = history[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        input.value = history[historyIndex] || '';
      } else {
        historyIndex = history.length;
        input.value = '';
      }
    } else if (e.key === 'Tab') {
      /* Tab completion: unique match completes, several matches are listed. */
      e.preventDefault();
      const frag = input.value.trim().toLowerCase();
      if (!frag) return;
      const hits = NAMES.filter((n) => n.indexOf(frag) === 0);
      if (hits.length === 1) input.value = hits[0] + (hits[0] === 'open' ? ' ' : '');
      else if (hits.length > 1) emit(hits.join('   '), 'cout');
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearScreen();
    }
  });

  document.querySelectorAll('.console__hints button').forEach((b) =>
    b.addEventListener('click', () => {
      runCommand(b.dataset.cmd);
      input.focus();
    })
  );
})();
