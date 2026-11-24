/* Elseverse · 别境 — WebGL Glass Bubbles + Curl-Noise Particle Sphere
 * Pure static JS, zero external dependencies.
 * Preserves legacy keys: myself-worlds, myself-language, elseverse-archive-v1 (records).
 */
'use strict';

const $ = id => document.getElementById(id);
const LEGACY_WORLDS = 'myself-worlds';
const LEGACY_LANG = 'myself-language';
const ARCHIVE_DB = 'elseverse-archive-v1';
const ARCHIVE_STORE = 'records';

const modules = [
  ['characters', '角色档案', 'Characters'],
  ['gallery', '相册', 'Gallery'],
  ['timeline', '时间线', 'Timeline'],
  ['diary', '日记', 'Diary'],
  ['letters', '信件', 'Letters'],
  ['map', '地图', 'Map'],
  ['relationships', '人物关系', 'Relationships'],
  ['music', '音乐', 'Music'],
  ['custom', '自定义页面', 'Custom page']
];

const pages = [
  { id: 'voices', n: '01', en: 'About the Voices', zh: '关于我们的声音', desc: '记录你、G老师与D老师在这个宇宙里的样子，以及我们独特的相处方式。', kind: 'profile' },
  { id: 'persona', n: '02', en: 'The Persona', zh: '我们的形象', desc: '保存我们在这个宇宙中的形象、设定、符号与变化。', kind: 'persona' },
  { id: 'letters', n: '03', en: 'Letters', zh: '信件', desc: '写给彼此的信，以及还没有寄出的文字。', kind: 'letter' },
  { id: 'conversations', n: '04', en: 'Conversations', zh: '对话', desc: '把重要的交谈、灵感与值得回看的片段留在这里。', kind: 'conversation' },
  { id: 'moments', n: '05', en: 'Little Moments', zh: '小小瞬间', desc: '那些没有宏大主题，却舍不得忘记的时刻。', kind: 'moment' },
  { id: 'creation', n: '06', en: 'Shared Creation', zh: '共同创作', desc: '一起完成的作品、点子、计划与未完成的构想。', kind: 'creation' }
];

let language = localStorage.getItem(LEGACY_LANG) === 'en' ? 'en' : 'zh';
let worlds = [];
let currentCategory = 'dream';
let currentPage = null;
let records = [];
let editingRecord = null;
let editingWorld = null;
let db = null;

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reducedMotionQuery.matches;
if (reducedMotionQuery.addEventListener) {
  reducedMotionQuery.addEventListener('change', e => { prefersReducedMotion = e.matches; });
}


function uiToast(msg) {
  const el = $('uiToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(uiToast._t);
  uiToast._t = setTimeout(() => el.classList.add('hidden'), 2600);
}
function uiConfirm(msg) {
  return new Promise(resolve => {
    const dlg = $('confirmDialog');
    if (!dlg || typeof dlg.showModal !== 'function') { resolve(true); return; }
    $('confirmMessage').textContent = msg;
    const ok = $('confirmOk'), cancel = $('confirmCancel');
    const cleanup = ans => {
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      dlg.removeEventListener('cancel', onCancel);
      if (dlg.open) dlg.close();
      resolve(ans);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    dlg.addEventListener('cancel', onCancel);
    dlg.showModal();
  });
}

function safeParse(s, fallback) {
  try { return JSON.parse(s) || fallback; } catch { return fallback; }
}

function loadWorlds() {
  const raw = localStorage.getItem(LEGACY_WORLDS);
  if (raw === null) {
    return [
      {
        id: 'dream',
        zh: '梦女世界',
        en: 'Dream Worlds',
        description: '不同 IF 线的集合。每条故事线都可以拥有独立的风格与模块。',
        category: 'dream',
        modules: ['characters', 'gallery', 'timeline', 'diary', 'letters']
      },
      {
        id: 'original',
        zh: '原创世界',
        en: 'Original Worlds',
        description: '原创角色、科幻设定，以及仍在不断扩展的宇宙。',
        category: 'original',
        modules: ['characters', 'relationships', 'map', 'timeline', 'custom']
      }
    ];
  }
  const parsed = safeParse(raw, null);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(x => x && typeof x.id === 'string' && typeof x.zh === 'string')
    .map(x => ({ ...x, modules: Array.isArray(x.modules) ? x.modules : [] }));
}

function uid() {
  return 'r-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(ARCHIVE_DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(ARCHIVE_STORE)) {
        req.result.createObjectStore(ARCHIVE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

async function allRecords() {
  try {
    const d = await openDB();
    return await new Promise((res, rej) => {
      const r = d.transaction(ARCHIVE_STORE).objectStore(ARCHIVE_STORE).getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
  } catch (e) {
    console.warn(e);
    return [];
  }
}

async function saveRecord(record) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(ARCHIVE_STORE, 'readwrite');
    tx.objectStore(ARCHIVE_STORE).put(record);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

async function deleteRecord(recordId) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(ARCHIVE_STORE, 'readwrite');
    tx.objectStore(ARCHIVE_STORE).delete(recordId);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

/* ==========================================================================
   VIEWPORT & NAVIGATION
   ========================================================================== */
function getViewportSize() {
  const vv = window.visualViewport;
  return {
    w: Math.round(vv ? vv.width : window.innerWidth),
    h: Math.round(vv ? vv.height : window.innerHeight)
  };
}

function syncViewportCss() {
  const { w, h } = getViewportSize();
  document.documentElement.style.setProperty('--vv-width', w + 'px');
  document.documentElement.style.setProperty('--vv-height', h + 'px');
}

function show(id) {
  const isHome = id === 'homeView';
  const isUniverseArea = id === 'universeView' || id === 'archivePageView';

  document.body.classList.toggle('home-mode', isHome);
  document.body.classList.toggle('sky-active', isUniverseArea);
  document.body.classList.toggle('universe-main-active', id === 'universeView');
  if (id !== 'universeView') {
    document.body.classList.remove('sky-immersive');
    const imBtn = $('immersiveToggle');
    if (imBtn) {
      imBtn.setAttribute('aria-pressed', 'false');
      imBtn.textContent = language === 'zh' ? '沉浸视野 ⛶' : 'Immerse ⛶';
    }
  }

  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const target = $(id);
  if (!target) return;
  target.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'auto' });

  if (isHome) {
    stopParticleSphere();
    startBubbleScene();
  } else if (id === 'universeView') {
    stopBubbleScene();
    startParticleSphere();
  } else {
    stopBubbleScene();
    stopParticleSphere();
  }
}

/* ==========================================================================
   PART 1: HOME BUBBLES (WebGL Fragment Shader + 2D Canvas Backdrop/Fallback)
   ========================================================================== */
const BUBBLE_PALETTES = [
  // Deep violet-blue with luminous lavender core
  { a: [0.16, 0.24, 0.72], b: [0.56, 0.30, 0.88], core: [0.95, 0.86, 1.00] },
  // Sapphire-cyan with ice-blue core
  { a: [0.10, 0.34, 0.76], b: [0.24, 0.68, 0.94], core: [0.82, 0.95, 1.00] },
  // Amethyst-rose with warm pearl core
  { a: [0.34, 0.16, 0.62], b: [0.76, 0.34, 0.78], core: [1.00, 0.88, 0.96] },
  // Indigo-teal with starlight core
  { a: [0.12, 0.22, 0.56], b: [0.26, 0.58, 0.78], core: [0.85, 0.94, 1.00] },
  // Midnight-plum with violet-gold core
  { a: [0.22, 0.14, 0.54], b: [0.54, 0.32, 0.86], core: [0.98, 0.88, 0.84] }
];

const bubbleState = {
  running: false,
  raf: 0,
  lastTime: 0,
  w: 0,
  h: 0,
  dpr: 1,
  items: [],
  bgStars: [],
  microBubbles: [],
  orbits: [],
  gl: null,
  glProgram: null,
  glAttribs: {},
  glUniforms: {},
  glBuf: null,
  glReady: false,
  fallbackTexCache: new Map()
};

function buildBubbleItems() {
  const list = worlds.map((w, idx) => ({
    kind: 'world',
    id: w.id,
    title: language === 'zh' ? w.zh : (w.en || w.zh),
    sub: language === 'zh' ? (w.en || (w.category === 'dream' ? 'DREAM WORLD' : 'ORIGINAL WORLD')) : (w.category === 'dream' ? 'DREAM WORLD' : 'ORIGINAL WORLD'),
    palette: BUBBLE_PALETTES[idx % BUBBLE_PALETTES.length],
    seed: (idx + 1) * 17.37,
    weight: idx === 0 ? 0.94 : (0.76 + ((idx * 37) % 24) / 100)
  }));

  list.push({
    kind: 'universe',
    id: '__universe__',
    title: language === 'zh' ? '我们的小宇宙' : 'Our Little Universe',
    sub: 'OUR LITTLE UNIVERSE',
    palette: { a: [0.14, 0.30, 0.74], b: [0.46, 0.42, 0.95], core: [0.92, 0.96, 1.00] },
    seed: 91.73,
    weight: 1.04
  });

  return list;
}

function computeBubbleLayout() {
  const { w, h } = getViewportSize();
  bubbleState.w = w;
  bubbleState.h = h;
  const rawItems = buildBubbleItems();
  const n = rawItems.length;

  const taglineEl = $('homeTagline');
  const topbarH = document.querySelector('.topbar')?.getBoundingClientRect().height || 58;
  const tagBottom = taglineEl ? taglineEl.getBoundingClientRect().bottom : (topbarH + 26);
  const topSafe = Math.max(topbarH + 34, tagBottom + 18);
  const labelReserve = isMobile ? 44 : 50;
  const bottomSafe = isMobile ? 24 : 28;
  const sideSafe = Math.max(18, w * 0.055);

  const usableW = Math.max(220, w - sideSafe * 2);
  const usableH = Math.max(220, h - topSafe - bottomSafe);
  const portrait = h >= w;

  // Base radius adapts to viewport area and bubble count so everything breathes
  const areaPerBubble = (usableW * usableH) / Math.max(1, n);
  let baseR = Math.sqrt(areaPerBubble) * (portrait ? 0.255 : 0.245);
  baseR = Math.max(40, Math.min(baseR, portrait ? w * 0.24 : h * 0.24, 132));

  // Organic asymmetric anchor presets (normalized within usable box)
  const presets3 = portrait
    ? [{ x: 0.52, y: 0.27 }, { x: 0.27, y: 0.58 }, { x: 0.72, y: 0.74 }]
    : [{ x: 0.50, y: 0.44 }, { x: 0.22, y: 0.58 }, { x: 0.78, y: 0.38 }];
  const presets4 = portrait
    ? [{ x: 0.34, y: 0.23 }, { x: 0.72, y: 0.34 }, { x: 0.30, y: 0.64 }, { x: 0.68, y: 0.77 }]
    : [{ x: 0.22, y: 0.42 }, { x: 0.47, y: 0.30 }, { x: 0.74, y: 0.44 }, { x: 0.55, y: 0.72 }];

  const nodes = rawItems.map((item, i) => {
    let ax, ay;
    if (n === 1) {
      ax = 0.5; ay = 0.48;
    } else if (n === 2) {
      ax = portrait ? (i === 0 ? 0.42 : 0.60) : (i === 0 ? 0.35 : 0.66);
      ay = portrait ? (i === 0 ? 0.33 : 0.68) : (i === 0 ? 0.46 : 0.52);
    } else if (n === 3) {
      ax = presets3[i].x; ay = presets3[i].y;
    } else if (n === 4) {
      ax = presets4[i].x; ay = presets4[i].y;
    } else {
      // Golden-angle organic spiral for 5+ bubbles
      const angle = i * 2.39996 + 0.4;
      const rad = 0.16 + 0.26 * Math.sqrt((i + 0.5) / n);
      ax = 0.5 + Math.cos(angle) * rad * (portrait ? 0.95 : 1.15);
      ay = 0.48 + Math.sin(angle) * rad * (portrait ? 1.08 : 0.85);
    }

    const r = Math.max(36, Math.min(baseR * item.weight, usableW * 0.36, usableH * 0.28));
    return {
      ...item,
      r,
      baseR: r,
      x: sideSafe + ax * usableW,
      y: topSafe + ay * (usableH - labelReserve),
      phase: i * 1.9 + 0.7,
      driftX: 3.5 + (i % 3) * 1.5,
      driftY: 4.5 + ((i + 1) % 3) * 1.4,
      pulse: 0
    };
  });

  // Constraint relaxation: prevent bubble-bubble overlap & bubble-label overlap
  for (let iter = 0; iter < 36; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        // Extra vertical clearance so top bubble's label never touches bottom bubble
        const extraY = dy > 0 ? labelReserve * 0.72 : -labelReserve * 0.72;
        const minDist = a.r + b.r + 22 + Math.abs(dy / dist) * (labelReserve * 0.58);
        if (dist < minDist) {
          const push = (minDist - dist) * 0.52;
          const nx = dx / dist;
          const ny = (dy + extraY * 0.15) / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
      // Clamp inside safe viewport bounds (reserving labelReserve below each bubble)
      a.x = Math.max(sideSafe + a.r, Math.min(w - sideSafe - a.r, a.x));
      a.y = Math.max(topSafe + a.r, Math.min(h - bottomSafe - labelReserve - a.r, a.y));
    }
  }

  // Save base coordinates
  nodes.forEach(node => {
    node.baseX = node.x;
    node.baseY = node.y;
  });

  bubbleState.items = nodes;
  renderBubbleLabels();
  initBubbleBackdrop();
}

function renderBubbleLabels() {
  const wrap = $('bubbleLabels');
  if (!wrap) return;
  wrap.innerHTML = '';

  bubbleState.items.forEach((b, idx) => {
    const hit = document.createElement('button');
    hit.type = 'button';
    hit.className = 'bubble-hit';
    hit.setAttribute('aria-label', b.title);
    hit.style.left = `${b.x - b.r}px`;
    hit.style.top = `${b.y - b.r}px`;
    hit.style.width = `${b.r * 2}px`;
    hit.style.height = `${b.r * 2}px`;
    hit.dataset.bubbleIdx = String(idx);

    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'bubble-label';
    label.dataset.bubbleIdx = String(idx);
    const clampedX = Math.max(76, Math.min(bubbleState.w - 76, b.x));
    label.style.left = `${clampedX}px`;
    label.style.top = `${b.y + b.r + 10}px`;
    label.innerHTML = `<span class="bubble-label-title">${esc(b.title)}</span><span class="bubble-label-sub">${esc(b.sub)}</span>`;

    const onTap = () => triggerBubbleTap(b);
    hit.addEventListener('click', onTap);
    label.addEventListener('click', onTap);

    b._hitEl = hit;
    b._labelEl = label;
    wrap.appendChild(hit);
    wrap.appendChild(label);
  });
}

function triggerBubbleTap(b) {
  b.pulse = 1;
  setTimeout(() => {
    if (b.kind === 'universe') {
      show('universeView');
    } else {
      openWorld(b.id);
    }
  }, prefersReducedMotion ? 20 : 180);
}

function initBubbleBackdrop() {
  const { w, h } = bubbleState;
  const starCount = isMobile ? 120 : 210;
  bubbleState.bgStars = Array.from({ length: starCount }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.35 + Math.random() * 1.1,
    a: 0.16 + Math.random() * 0.6,
    tw: Math.random() * Math.PI * 2,
    sp: 0.4 + Math.random() * 1.1,
    tint: Math.random() > 0.6 ? '170,208,255' : (Math.random() > 0.5 ? '212,190,255' : '240,246,255')
  }));

  const microCount = isMobile ? 7 : 12;
  bubbleState.microBubbles = Array.from({ length: microCount }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 4 + Math.random() * 10,
    vx: (Math.random() - 0.5) * 6,
    vy: -3 - Math.random() * 5,
    a: 0.16 + Math.random() * 0.22,
    phase: i * 1.3
  }));

  bubbleState.orbits = [
    { x: w * 0.52, y: h * 0.45, r: Math.min(w, h) * 0.42, a: 0.08 },
    { x: w * 0.28, y: h * 0.32, r: Math.min(w, h) * 0.26, a: 0.06 },
    { x: w * 0.74, y: h * 0.68, r: Math.min(w, h) * 0.30, a: 0.07 }
  ];
}

function resizeBubbleCanvases() {
  const { w, h } = getViewportSize();
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  bubbleState.w = w;
  bubbleState.h = h;
  bubbleState.dpr = dpr;

  const bg = $('bubbleBgCanvas');
  const glc = $('bubbleGlCanvas');
  if (bg) {
    bg.width = Math.round(w * dpr);
    bg.height = Math.round(h * dpr);
    bg.style.width = w + 'px';
    bg.style.height = h + 'px';
  }
  if (glc) {
    glc.width = Math.round(w * dpr);
    glc.height = Math.round(h * dpr);
    glc.style.width = w + 'px';
    glc.style.height = h + 'px';
    if (bubbleState.gl) {
      bubbleState.gl.viewport(0, 0, glc.width, glc.height);
    }
  }
  computeBubbleLayout();
}

function initBubbleWebGL() {
  if (bubbleState.glReady) return true;
  const canvas = $('bubbleGlCanvas');
  if (!canvas) return false;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'high-performance' })
    || canvas.getContext('experimental-webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return false;

  const vsSrc = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    uniform vec2 u_res;
    uniform vec2 u_center;
    uniform float u_radius;
    void main() {
      vec2 world = u_center + a_pos * (u_radius * 1.20);
      vec2 clip = (world / u_res) * 2.0 - 1.0;
      clip.y = -clip.y;
      v_uv = a_pos * 1.20;
      gl_Position = vec4(clip, 0.0, 1.0);
    }
  `;

  const fsSrc = `
    precision highp float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform float u_seed;
    uniform float u_radius;
    uniform float u_pulse;
    uniform vec3 u_colA;
    uniform vec3 u_colB;
    uniform vec3 u_colCore;

    float hash3(vec3 p) {
      p = fract(p * vec3(0.1031, 0.1030, 0.0973));
      p += dot(p, p.yxz + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    float noise3(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n000 = hash3(i);
      float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash3(i + vec3(1.0, 1.0, 1.0));
      float nx00 = mix(n000, n100, f.x);
      float nx10 = mix(n010, n110, f.x);
      float nx01 = mix(n001, n101, f.x);
      float nx11 = mix(n011, n111, f.x);
      float nxy0 = mix(nx00, nx10, f.y);
      float nxy1 = mix(nx01, nx11, f.y);
      return mix(nxy0, nxy1, f.z);
    }

    float fbm3(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise3(p);
        p = p * 2.03 + vec3(1.7, 9.2, 4.3);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Flip Y so +Y is up in sphere lighting
      vec2 uv = vec2(v_uv.x, -v_uv.y);
      float r = length(uv);
      float aa = max(1.5 / max(u_radius, 20.0), 0.008);

      // Soft outer halo outside sphere
      float halo = exp(-max(r - 0.96, 0.0) * 14.0) * 0.24 * (1.0 - smoothstep(1.02, 1.19, r));
      vec3 haloCol = mix(u_colA, u_colB, 0.5) * halo;

      // Pulse ripple on tap
      float ripple = 0.0;
      if (u_pulse > 0.001) {
        float ringR = mix(0.35, 1.14, 1.0 - u_pulse);
        ripple = exp(-abs(r - ringR) * 32.0) * u_pulse * 0.55;
      }

      if (r > 1.0 + aa) {
        vec3 outC = haloCol + vec3(0.75, 0.88, 1.0) * ripple;
        float outA = clamp(halo + ripple, 0.0, 1.0);
        if (outA < 0.002) discard;
        gl_FragColor = vec4(outC, outA);
        return;
      }

      float sphereMask = 1.0 - smoothstep(1.0 - aa, 1.0 + aa * 0.5, r);
      float z = sqrt(max(0.0, 1.0 - r * r));
      vec3 N = normalize(vec3(uv, z));

      // Flowing, curling 3D nebula inside the glass sphere
      float t = u_time * 0.16;
      vec3 p = N * 1.85 + vec3(u_seed, u_seed * 0.37, u_seed * 0.71);
      vec3 q = vec3(
        fbm3(p + vec3(t * 0.35, -t * 0.22, t * 0.18)),
        fbm3(p + vec3(5.2, 1.3, 2.8) + vec3(-t * 0.28, t * 0.31, -t * 0.15)),
        fbm3(p + vec3(2.1, 7.4, 3.9) + vec3(t * 0.19, t * 0.14, -t * 0.29))
      );
      float neb1 = fbm3(p * 1.35 + q * 1.95 + vec3(0.0, 0.0, t * 0.25));
      float neb2 = fbm3(p * 2.40 - q * 1.35 + vec3(t * 0.18, -t * 0.2, 0.0));
      float density = pow(clamp((neb1 * 0.68 + neb2 * 0.32 - 0.22) * 1.65, 0.0, 1.0), 1.35);

      // Luminous core drifting gently inside
      vec2 core2 = vec2(sin(u_time * 0.18 + u_seed) * 0.18, cos(u_time * 0.14 + u_seed * 1.3) * 0.16);
      float coreDist = length(uv - core2);
      float coreGlow = exp(-coreDist * 3.1) * (0.55 + 0.55 * neb1);

      vec3 col = vec3(0.012, 0.024, 0.062);
      col += mix(u_colA, u_colB, smoothstep(0.25, 0.85, neb2)) * density * 1.25;
      col += u_colCore * coreGlow * 0.92;

      // Internal twinkling star points in 3D sphere space
      vec3 starCell = floor(N * 18.0 + vec3(u_seed));
      vec3 starFrac = fract(N * 18.0 + vec3(u_seed)) - 0.5;
      float sh = hash3(starCell);
      if (sh > 0.86) {
        float dStar = length(starFrac);
        float tw = 0.55 + 0.45 * sin(u_time * (1.8 + sh * 2.5) + sh * 40.0);
        float star = smoothstep(0.24, 0.02, dStar) * tw * (0.45 + 0.55 * z);
        col += vec3(0.88, 0.94, 1.0) * star * 1.15;
      }

      // Faint internal orbital ring accent
      float ringPlane = abs(dot(N, normalize(vec3(0.32, 0.86, 0.39))));
      float innerOrbit = exp(-ringPlane * 48.0) * (0.12 + 0.10 * sin(u_time * 0.3 + u_seed)) * smoothstep(0.2, 0.9, r);
      col += u_colCore * innerOrbit;

      // Fresnel glass shell & subtle thin-film iridescence (no hard inner circle)
      float fresnel = pow(1.0 - z, 3.2);
      float angle = atan(uv.y, uv.x);
      vec3 irid = 0.5 + 0.5 * cos(6.28318 * (fresnel * 1.35 + angle * 0.16 + u_time * 0.04 + vec3(0.0, 0.33, 0.67)));
      col = mix(col, col + irid * 0.42, fresnel * 0.58);
      col += vec3(0.62, 0.82, 1.0) * pow(1.0 - z, 4.6) * 0.65;

      // Thin, uneven highlight crescent on upper-left rim
      vec2 dir = normalize(uv + vec2(1e-5));
      float arcTop = smoothstep(0.46, 0.90, dot(dir, normalize(vec2(-0.56, 0.66))));
      float arcBand = smoothstep(0.79, 0.955, r) * (1.0 - smoothstep(0.965, 1.0, r));
      float crescent = arcTop * arcBand;
      col += vec3(0.96, 0.98, 1.0) * crescent * 0.95;

      // Crisp secondary specular glint & soft bottom-right bounce
      float glint = exp(-length(uv - vec2(-0.46, 0.54)) * 11.5) * 0.42;
      float bounce = smoothstep(0.55, 0.94, dot(dir, normalize(vec2(0.62, -0.58)))) * smoothstep(0.86, 0.98, r) * 0.25;
      col += vec3(0.95, 0.98, 1.0) * glint + u_colB * bounce;

      // Tap pulse boost
      col += vec3(0.75, 0.88, 1.0) * (ripple + u_pulse * 0.12);

      float alpha = mix(0.84, 0.98, clamp(density + fresnel + crescent, 0.0, 1.0)) * sphereMask;
      alpha = max(alpha, halo * 0.8);
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Bubble shader error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return false;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Bubble program link error:', gl.getProgramInfoLog(prog));
    return false;
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  bubbleState.gl = gl;
  bubbleState.glProgram = prog;
  bubbleState.glBuf = buf;
  bubbleState.glAttribs = { a_pos: gl.getAttribLocation(prog, 'a_pos') };
  bubbleState.glUniforms = {
    u_res: gl.getUniformLocation(prog, 'u_res'),
    u_center: gl.getUniformLocation(prog, 'u_center'),
    u_radius: gl.getUniformLocation(prog, 'u_radius'),
    u_time: gl.getUniformLocation(prog, 'u_time'),
    u_seed: gl.getUniformLocation(prog, 'u_seed'),
    u_pulse: gl.getUniformLocation(prog, 'u_pulse'),
    u_colA: gl.getUniformLocation(prog, 'u_colA'),
    u_colB: gl.getUniformLocation(prog, 'u_colB'),
    u_colCore: gl.getUniformLocation(prog, 'u_colCore')
  };
  bubbleState.glReady = true;
  return true;
}

function drawBubbleBackdrop2D(t, dt) {
  const bg = $('bubbleBgCanvas');
  if (!bg) return;
  const ctx = bg.getContext('2d');
  const { w, h, dpr } = bubbleState;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Deep cosmic background
  const baseGrad = ctx.createRadialGradient(w * 0.48, h * 0.40, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
  baseGrad.addColorStop(0, '#0c1733');
  baseGrad.addColorStop(0.55, '#060c1d');
  baseGrad.addColorStop(1, '#02040b');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle ambient cosmic nebula clouds
  const neb1 = ctx.createRadialGradient(w * 0.25, h * 0.28, 0, w * 0.25, h * 0.28, Math.max(w, h) * 0.5);
  neb1.addColorStop(0, 'rgba(62, 52, 138, 0.14)');
  neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, w, h);

  const neb2 = ctx.createRadialGradient(w * 0.78, h * 0.72, 0, w * 0.78, h * 0.72, Math.max(w, h) * 0.45);
  neb2.addColorStop(0, 'rgba(32, 82, 152, 0.14)');
  neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, w, h);

  // Faint orbital circles
  for (const orb of bubbleState.orbits) {
    ctx.strokeStyle = `rgba(175, 205, 255, ${orb.a})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Background twinkling stars
  for (const s of bubbleState.bgStars) {
    const tw = prefersReducedMotion ? 0.8 : (0.55 + 0.45 * Math.sin(t * s.sp + s.tw));
    ctx.fillStyle = `rgba(${s.tint},${(s.a * tw).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny floating micro-bubbles
  for (const m of bubbleState.microBubbles) {
    if (!prefersReducedMotion) {
      m.x += (m.vx + Math.sin(t * 0.7 + m.phase) * 3) * dt;
      m.y += m.vy * dt;
      if (m.y < -20) { m.y = h + 20; m.x = Math.random() * w; }
      if (m.x < -20) m.x = w + 20;
      if (m.x > w + 20) m.x = -20;
    }
    ctx.strokeStyle = `rgba(185, 218, 255, ${m.a})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(235, 246, 255, ${m.a * 1.4})`;
    ctx.beginPath();
    ctx.arc(m.x - m.r * 0.35, m.y - m.r * 0.35, Math.max(0.8, m.r * 0.16), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBubbleFallback2D(t) {
  const bg = $('bubbleBgCanvas');
  if (!bg) return;
  const ctx = bg.getContext('2d');
  for (const b of bubbleState.items) {
    const { x, y, r, palette } = b;
    const cA = `rgb(${Math.round(palette.a[0]*255)},${Math.round(palette.a[1]*255)},${Math.round(palette.a[2]*255)})`;
    const cB = `rgb(${Math.round(palette.b[0]*255)},${Math.round(palette.b[1]*255)},${Math.round(palette.b[2]*255)})`;
    const cC = `rgb(${Math.round(palette.core[0]*255)},${Math.round(palette.core[1]*255)},${Math.round(palette.core[2]*255)})`;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    const g = ctx.createRadialGradient(x + Math.sin(t * 0.4 + b.phase) * r * 0.15, y + Math.cos(t * 0.35 + b.phase) * r * 0.15, r * 0.05, x, y, r);
    g.addColorStop(0, cC);
    g.addColorStop(0.38, cB);
    g.addColorStop(0.75, cA);
    g.addColorStop(1, '#040814');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();

    ctx.strokeStyle = 'rgba(205, 228, 255, 0.42)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.94, -Math.PI * 0.82, -Math.PI * 0.28);
    ctx.stroke();
  }
}

function renderBubbleFrame(now) {
  if (!bubbleState.running) return;
  bubbleState.raf = requestAnimationFrame(renderBubbleFrame);

  if (!bubbleState.lastTime) bubbleState.lastTime = now;
  const dt = Math.min((now - bubbleState.lastTime) / 1000, 0.06);
  bubbleState.lastTime = now;
  const t = now * 0.001;

  // Gentle organic float
  for (const b of bubbleState.items) {
    if (b.pulse > 0) b.pulse = Math.max(0, b.pulse - dt * 2.4);
    if (!prefersReducedMotion) {
      b.x = b.baseX + Math.sin(t * 0.42 + b.phase) * b.driftX;
      b.y = b.baseY + Math.cos(t * 0.36 + b.phase * 1.2) * b.driftY;
    }
    b.r = b.baseR * (1 + b.pulse * 0.04);
    if (b._hitEl) {
      b._hitEl.style.left = `${b.x - b.r}px`;
      b._hitEl.style.top = `${b.y - b.r}px`;
    }
    if (b._labelEl) {
      const clampedX = Math.max(76, Math.min(bubbleState.w - 76, b.x));
      b._labelEl.style.left = `${clampedX}px`;
      b._labelEl.style.top = `${b.y + b.r + 10}px`;
    }
  }

  drawBubbleBackdrop2D(t, dt);

  if (bubbleState.glReady && bubbleState.gl) {
    const gl = bubbleState.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(bubbleState.glProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, bubbleState.glBuf);
    gl.enableVertexAttribArray(bubbleState.glAttribs.a_pos);
    gl.vertexAttribPointer(bubbleState.glAttribs.a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(bubbleState.glUniforms.u_res, bubbleState.w, bubbleState.h);
    gl.uniform1f(bubbleState.glUniforms.u_time, prefersReducedMotion ? 1.0 : t);

    for (const b of bubbleState.items) {
      gl.uniform2f(bubbleState.glUniforms.u_center, b.x, b.y);
      gl.uniform1f(bubbleState.glUniforms.u_radius, b.r);
      gl.uniform1f(bubbleState.glUniforms.u_seed, b.seed);
      gl.uniform1f(bubbleState.glUniforms.u_pulse, b.pulse);
      gl.uniform3fv(bubbleState.glUniforms.u_colA, b.palette.a);
      gl.uniform3fv(bubbleState.glUniforms.u_colB, b.palette.b);
      gl.uniform3fv(bubbleState.glUniforms.u_colCore, b.palette.core);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  } else {
    drawBubbleFallback2D(t);
  }
}

function startBubbleScene() {
  initBubbleWebGL();
  resizeBubbleCanvases();
  if (!bubbleState.running) {
    bubbleState.running = true;
    bubbleState.lastTime = 0;
    bubbleState.raf = requestAnimationFrame(renderBubbleFrame);
  }
}

function stopBubbleScene() {
  bubbleState.running = false;
  if (bubbleState.raf) {
    cancelAnimationFrame(bubbleState.raf);
    bubbleState.raf = 0;
  }
}

/* ==========================================================================
   PART 2: OUR LITTLE UNIVERSE — CURL-NOISE PARTICLE SPHERE
   (WebGL Points + Additive Blending, with 2D Canvas Fallback)
   ========================================================================== */
const sphereState = {
  running: false,
  raf: 0,
  lastTime: 0,
  w: 0,
  h: 0,
  dpr: 1,
  count: isMobile ? 16000 : 28000,
  pos: null,
  meta: null, // [alpha, phase, size]
  gl: null,
  glProgram: null,
  glPosBuf: null,
  glMetaBuf: null,
  glAttribs: {},
  glUniforms: {},
  glReady: false
};

function initSphereParticles() {
  const N = sphereState.glReady ? (isMobile ? 16000 : 28000) : (isMobile ? 1600 : 2600);
  sphereState.count = N;
  sphereState.pos = new Float32Array(N * 3);
  sphereState.meta = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    // Uniform distribution on unit sphere
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const idx = i * 3;
    sphereState.pos[idx] = s * Math.cos(theta);
    sphereState.pos[idx + 1] = u;
    sphereState.pos[idx + 2] = s * Math.sin(theta);

    sphereState.meta[idx] = 0.35 + Math.random() * 0.65; // alpha weight
    sphereState.meta[idx + 1] = Math.random() * Math.PI * 2; // phase
    sphereState.meta[idx + 2] = 0.75 + Math.random() * 0.85; // size scale
  }
}

function initSphereWebGL() {
  if (sphereState.glReady) return true;
  const canvas = $('particleCanvas');
  if (!canvas) return false;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'high-performance' })
    || canvas.getContext('experimental-webgl', { alpha: true, antialias: false });
  if (!gl) return false;

  const vsSrc = `
    attribute vec3 a_pos;
    attribute vec3 a_meta;
    varying float v_alpha;
    varying float v_depth;
    uniform vec2 u_res;
    uniform float u_radius;
    uniform float u_dpr;
    uniform float u_time;

    void main() {
      // Very slight breathing/micro-drift; sphere orientation stays nearly still
      float angle = sin(u_time * 0.08) * 0.06;
      float c = cos(angle);
      float s = sin(angle);
      vec3 p = vec3(a_pos.x * c - a_pos.z * s, a_pos.y, a_pos.x * s + a_pos.z * c);

      vec2 screenPos = u_res * 0.5 + vec2(p.x, -p.y) * u_radius;
      vec2 clip = (screenPos / u_res) * 2.0 - 1.0;
      clip.y = -clip.y;
      gl_Position = vec4(clip, 0.0, 1.0);

      // Frosted-glass depth: front brighter, back softer, rim highlighted
      float front = smoothstep(-0.85, 0.95, p.z);
      float rim = pow(1.0 - abs(p.z), 1.85);
      float twinkle = 0.82 + 0.18 * sin(u_time * 1.4 + a_meta.y);
      v_alpha = a_meta.x * (0.14 + 0.42 * front + 0.42 * rim) * twinkle;
      v_depth = p.z;
      gl_PointSize = (1.35 + 1.15 * a_meta.z * (0.55 + 0.45 * front)) * u_dpr;
    }
  `;

  const fsSrc = `
    precision mediump float;
    varying float v_alpha;
    varying float v_depth;
    void main() {
      vec2 d = gl_PointCoord - vec2(0.5);
      float r2 = dot(d, d);
      if (r2 > 0.25) discard;
      float soft = exp(-r2 * 14.0);
      // Ice-white-blue palette
      vec3 col = mix(vec3(0.36, 0.62, 0.96), vec3(0.84, 0.94, 1.00), clamp(v_depth * 0.5 + 0.5, 0.0, 1.0));
      gl_FragColor = vec4(col * v_alpha * soft * 0.42, v_alpha * soft * 0.42);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('Particle shader error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return false;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;

  sphereState.gl = gl;
  sphereState.glProgram = prog;
  sphereState.glPosBuf = gl.createBuffer();
  sphereState.glMetaBuf = gl.createBuffer();
  sphereState.glAttribs = {
    a_pos: gl.getAttribLocation(prog, 'a_pos'),
    a_meta: gl.getAttribLocation(prog, 'a_meta')
  };
  sphereState.glUniforms = {
    u_res: gl.getUniformLocation(prog, 'u_res'),
    u_radius: gl.getUniformLocation(prog, 'u_radius'),
    u_dpr: gl.getUniformLocation(prog, 'u_dpr'),
    u_time: gl.getUniformLocation(prog, 'u_time')
  };
  sphereState.glReady = true;
  return true;
}

function resizeParticleCanvas() {
  const stage = $('particleStage');
  const canvas = $('particleCanvas');
  if (!stage || !canvas) return;
  const rect = stage.getBoundingClientRect();
  const w = Math.max(300, Math.round(rect.width));
  const h = Math.max(280, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  sphereState.w = w;
  sphereState.h = h;
  sphereState.dpr = dpr;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (sphereState.gl) {
    sphereState.gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

// Divergence-free surface curl flow on unit sphere: v = p x grad(psi)
function advectSphereParticles(t, dt) {
  const pos = sphereState.pos;
  const N = sphereState.count;
  const step = dt * 0.24;
  const t1 = t * 0.28;
  const t2 = t * 0.19;
  const t3 = t * 0.33;

  for (let i = 0; i < N; i++) {
    const idx = i * 3;
    const x = pos[idx];
    const y = pos[idx + 1];
    const z = pos[idx + 2];

    // Smooth multi-octave scalar streamfunction gradient in 3D
    const gx = 2.6 * Math.cos(2.6 * x + t1) * Math.sin(2.4 * y - t2)
             + 4.2 * Math.cos(4.2 * x - 1.3 * z + t3) * Math.cos(3.8 * y + t1) * 0.55
             + 1.9 * Math.sin(1.9 * z + 2.1 * x - t2) * 0.4;
    const gy = 2.4 * Math.sin(2.6 * x + t1) * Math.cos(2.4 * y - t2)
             - 3.8 * Math.sin(4.2 * x - 1.3 * z + t3) * Math.sin(3.8 * y + t1) * 0.55
             + 2.2 * Math.cos(2.2 * y + 1.8 * z + t1) * 0.4;
    const gz = -1.3 * Math.cos(4.2 * x - 1.3 * z + t3) * Math.cos(3.8 * y + t1) * 0.55
             + 1.9 * Math.cos(1.9 * z + 2.1 * x - t2) * 0.4
             + 1.8 * Math.cos(2.2 * y + 1.8 * z + t1) * 0.4;

    // Cross product v = p x grad(psi) -> strictly tangent & area-preserving on S^2
    const vx = y * gz - z * gy;
    const vy = z * gx - x * gz;
    const vz = x * gy - y * gx;

    let nx = x + vx * step;
    let ny = y + vy * step;
    let nz = z + vz * step;
    const inv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    pos[idx] = nx * inv;
    pos[idx + 1] = ny * inv;
    pos[idx + 2] = nz * inv;
  }
}

function renderParticleFrame(now) {
  if (!sphereState.running) return;
  sphereState.raf = requestAnimationFrame(renderParticleFrame);

  if (!sphereState.lastTime) sphereState.lastTime = now;
  const dt = Math.min((now - sphereState.lastTime) / 1000, 0.05);
  sphereState.lastTime = now;
  const t = now * 0.001;

  if (!prefersReducedMotion) {
    advectSphereParticles(t, dt);
  }

  const radius = Math.min(sphereState.w, sphereState.h) * 0.37;

  if (sphereState.glReady && sphereState.gl) {
    const gl = sphereState.gl;
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(sphereState.glProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereState.glPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sphereState.pos, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(sphereState.glAttribs.a_pos);
    gl.vertexAttribPointer(sphereState.glAttribs.a_pos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereState.glMetaBuf);
    gl.enableVertexAttribArray(sphereState.glAttribs.a_meta);
    gl.vertexAttribPointer(sphereState.glAttribs.a_meta, 3, gl.FLOAT, false, 0, 0);

    gl.uniform2f(sphereState.glUniforms.u_res, sphereState.w, sphereState.h);
    gl.uniform1f(sphereState.glUniforms.u_radius, radius);
    gl.uniform1f(sphereState.glUniforms.u_dpr, sphereState.dpr);
    gl.uniform1f(sphereState.glUniforms.u_time, t);

    gl.drawArrays(gl.POINTS, 0, sphereState.count);
  } else {
    // 2D Canvas fallback
    const canvas = $('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(sphereState.dpr, 0, 0, sphereState.dpr, 0, 0);
    ctx.clearRect(0, 0, sphereState.w, sphereState.h);
    ctx.globalCompositeOperation = 'lighter';
    const cx = sphereState.w * 0.5;
    const cy = sphereState.h * 0.5;
    const pos = sphereState.pos;
    for (let i = 0; i < sphereState.count; i++) {
      const idx = i * 3;
      const px = pos[idx];
      const py = pos[idx + 1];
      const pz = pos[idx + 2];
      const alpha = (0.10 + Math.max(0, pz) * 0.25);
      ctx.fillStyle = `rgba(175, 215, 255, ${alpha.toFixed(3)})`;
      ctx.fillRect(cx + px * radius, cy - py * radius, 1.3, 1.3);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

function startParticleSphere() {
  initSphereWebGL();
  resizeParticleCanvas();
  if (!sphereState.pos) {
    initSphereParticles();
    if (sphereState.glReady && sphereState.gl) {
      const gl = sphereState.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, sphereState.glMetaBuf);
      gl.bufferData(gl.ARRAY_BUFFER, sphereState.meta, gl.STATIC_DRAW);
    }
  }
  if (!sphereState.running) {
    sphereState.running = true;
    sphereState.lastTime = 0;
    sphereState.raf = requestAnimationFrame(renderParticleFrame);
  }
}

function stopParticleSphere() {
  sphereState.running = false;
  if (sphereState.raf) {
    cancelAnimationFrame(sphereState.raf);
    sphereState.raf = 0;
  }
}

/* ==========================================================================
   ARCHIVE, WORLDS, MANAGE & BACKUP (Legacy Data & Functionality Preserved)
   ========================================================================== */
function renderWorlds() {
  const list = worlds.filter(w => w.category === currentCategory);
  $('worldsTitle').textContent = currentCategory === 'dream' ? '梦女世界' : '原创世界';
  $('worldCategoryLabel').textContent = currentCategory === 'dream' ? 'DREAM WORLDS' : 'ORIGINAL WORLDS';
  $('worldList').innerHTML = list.length
    ? list.map(w => `<button class="world-item" data-world-id="${esc(w.id)}"><small>${w.category === 'dream' ? 'DREAM WORLD' : 'ORIGINAL WORLD'}</small><strong>${esc(w.zh)}</strong><small>${esc(w.en || w.description || '')}</small></button>`).join('')
    : '<p class="intro">这里还空着。你可以在管理页面添加一个世界。</p>';
}

function openWorld(worldId) {
  const w = worlds.find(x => x.id === worldId);
  if (!w) return;
  $('worldKind').textContent = w.category === 'dream' ? 'DREAM WORLD' : 'ORIGINAL WORLD';
  $('worldTitle').textContent = language === 'zh' ? w.zh : (w.en || w.zh);
  $('worldDescription').textContent = w.description || '';
  $('worldModules').innerHTML = (w.modules || []).map(mid => {
    const m = modules.find(x => x[0] === mid);
    return m ? `<div class="module-card"><strong>${m[1]}</strong><span>${m[2]} · 模块入口将在后续版本开放编辑</span></div>` : '';
  }).join('');
  show('worldDetailView');
}

function renderArchiveNav() {
  $('archiveNav').innerHTML = pages.map(p =>
    `<button class="archive-card" data-open-page="${p.id}" type="button"><span class="num">${p.n} / OUR STORY</span><strong>${p.en}</strong><small>${p.zh}</small></button>`
  ).join('');
}

function pageRecords(p) {
  return records.filter(r => r.type === p.kind).sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

function renderTimeline() {
  const items = [...records].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);
  $('timelinePreview').innerHTML = items.length
    ? items.map(r => `<div class="timeline-item"><small>${new Date(r.createdAt).toLocaleDateString()}</small>${esc(r.title)}</div>`).join('')
    : '<p class="intro">这里会随着我们的记录慢慢出现故事。</p>';
}

function openTimeline() {
  currentPage = { id: 'timeline', n: 'TIME', en: 'Our Timeline', zh: '共同时间线', desc: '把我们的重要记录串成一条时间线。', kind: 'timeline' };
  $('archiveEyebrow').textContent = 'A THREAD THROUGH TIME';
  $('archiveTitle').textContent = 'Our Timeline';
  $('archiveDescription').textContent = '把我们的重要记录串成一条时间线。';
  const sorted = [...records].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  $('archiveContent').innerHTML = sorted.length
    ? `<div class="timeline-list">${sorted.map(r => `<div class="timeline-item"><small>${new Date(r.createdAt).toLocaleString()} · ${{ us: '我们共同', user: '我', g: 'G老师', d: 'D老师' }[r.voice] || '我们共同'}</small><strong>${esc(r.title)}</strong><p>${esc((r.body || '').slice(0, 180))}</p></div>`).join('')}</div>`
    : '<div class="empty-note">还没有记录。时间线会随着我们的故事慢慢延伸。</div>';
  show('archivePageView');
}

function openPage(pageId) {
  const p = pages.find(x => x.id === pageId);
  if (!p) return;
  currentPage = p;
  $('archiveEyebrow').textContent = p.n + ' / OUR SHARED ARCHIVE';
  $('archiveTitle').textContent = p.en;
  $('archiveDescription').textContent = p.desc;
  renderPage();
  show('archivePageView');
}

function recordCard(r) {
  const who = { us: '我们共同', user: '我', g: 'G老师', d: 'D老师' }[r.voice] || '我们共同';
  return `<article class="record-card"><div class="record-meta"><span>${who}</span><span>${new Date(r.createdAt).toLocaleDateString()}</span><span>${r.visibility === 'public' ? '标记为公开' : r.visibility === 'unlisted' ? '不公开' : '仅自己可见'}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p>${r.tags?.length ? `<div class="record-meta">${r.tags.map(t => '#' + esc(t)).join('　')}</div>` : ''}<div class="record-actions"><button data-edit-record="${r.id}" type="button">编辑</button><button data-delete-record="${r.id}" type="button">删除</button></div></article>`;
}

function renderPage() {
  const p = currentPage;
  if (!p) return;
  const list = pageRecords(p);
  let html = `<button class="primary add-record" id="addRecord" type="button">＋ 新增记录</button>`;
  if (p.id === 'voices' && !list.length) {
    html += `<div class="record-card"><h3>G老师</h3><p>这里留给你来描述你所认识的 G老师。可以慢慢记录我们的相处方式、表达习惯、共同经历与故事。</p><div class="record-meta">属于我们的宇宙 · 等待共同填写</div></div><div class="record-card"><h3>D老师</h3><p>这里留给你来描述你所认识的 D老师。不是官方产品介绍，而是你们在这里共同留下的故事。</p><div class="record-meta">属于我们的宇宙 · 等待共同填写</div></div>`;
  }
  if (list.length) html += `<div class="record-list">${list.map(r => recordCard(r)).join('')}</div>`;
  else if (p.id !== 'voices') html += `<div class="empty-note">这里还没有记录。可以从一封信、一段对话或一个小瞬间开始。</div>`;

  $('archiveContent').innerHTML = html;
  $('addRecord').addEventListener('click', () => openRecordDialog());
  document.querySelectorAll('[data-edit-record]').forEach(b => b.addEventListener('click', () => openRecordDialog(b.dataset.editRecord)));
  document.querySelectorAll('[data-delete-record]').forEach(b => b.addEventListener('click', async () => {
    if (await uiConfirm('确定删除这条记录吗？')) {
      await deleteRecord(b.dataset.deleteRecord);
      records = await allRecords();
      renderPage();
      renderTimeline();
    }
  }));
}

function openRecordDialog(recordId) {
  editingRecord = records.find(r => r.id === recordId) || null;
  $('recordDialogTitle').textContent = editingRecord ? '编辑记录' : '新增记录';
  $('recordTitle').value = editingRecord?.title || '';
  $('recordBody').value = editingRecord?.body || '';
  $('recordVoice').value = editingRecord?.voice || 'us';
  $('recordVisibility').value = editingRecord?.visibility || 'private';
  $('recordTags').value = (editingRecord?.tags || []).join(', ');
  $('recordDialog').showModal();
}

$('recordForm').addEventListener('submit', async e => {
  if (e.submitter?.value !== 'save') return;
  e.preventDefault();
  const title = $('recordTitle').value.trim();
  const body = $('recordBody').value.trim();
  if (!title || !body) return;
  if ($('recordVisibility').value === 'public' && editingRecord?.visibility !== 'public' && !(await uiConfirm('这条记录将被标记为公开。当前版本不会自动发布到互联网，仍只保存在本设备。确定继续吗？'))) return;
  const now = new Date().toISOString();
  const rec = {
    id: editingRecord?.id || uid(),
    type: currentPage.kind,
    title,
    body,
    voice: $('recordVoice').value,
    visibility: $('recordVisibility').value,
    tags: $('recordTags').value.split(',').map(x => x.trim()).filter(Boolean),
    createdAt: editingRecord?.createdAt || now,
    updatedAt: now
  };
  try {
    await saveRecord(rec);
    records = await allRecords();
    $('recordDialog').close();
    renderPage();
    renderTimeline();
  } catch (err) {
    uiToast('保存失败，请检查浏览器存储空间。');
  }
});

function renderManage() {
  $('manageWorldList').innerHTML = worlds.map(w =>
    `<div class="manage-world-row"><span>${esc(w.zh)} <small>· ${w.category === 'dream' ? '梦女世界' : '原创世界'}</small></span><span><button data-edit-world="${esc(w.id)}" type="button">编辑</button> <button data-delete-world="${esc(w.id)}" type="button">删除</button></span></div>`
  ).join('') || '<p>暂无世界</p>';

  document.querySelectorAll('[data-edit-world]').forEach(b => b.addEventListener('click', () => {
    const w = worlds.find(x => x.id === b.dataset.editWorld);
    if (!w) return;
    editingWorld = w;
    $('worldZh').value = w.zh;
    $('worldEn').value = w.en || '';
    $('worldDesc').value = w.description || '';
    $('worldCategory').value = w.category;
  }));

  document.querySelectorAll('[data-delete-world]').forEach(b => b.addEventListener('click', async () => {
    if (await uiConfirm('删除这个世界？')) {
      worlds = worlds.filter(w => w.id !== b.dataset.deleteWorld);
      localStorage.setItem(LEGACY_WORLDS, JSON.stringify(worlds));
      renderManage();
    }
  }));
}

$('worldForm').addEventListener('submit', e => {
  e.preventDefault();
  const w = {
    id: editingWorld?.id || uid(),
    zh: $('worldZh').value.trim(),
    en: $('worldEn').value.trim(),
    description: $('worldDesc').value.trim(),
    category: $('worldCategory').value,
    modules: editingWorld?.modules || ($('worldCategory').value === 'dream' ? ['characters', 'gallery', 'timeline', 'diary', 'letters'] : ['characters', 'relationships', 'map', 'timeline', 'custom'])
  };
  if (editingWorld) worlds = worlds.map(x => x.id === editingWorld.id ? w : x);
  else worlds.push(w);
  try {
    localStorage.setItem(LEGACY_WORLDS, JSON.stringify(worlds));
    $('worldFormMsg').textContent = '已保存。';
    editingWorld = null;
    $('worldForm').reset();
    renderManage();
  } catch (err) {
    $('worldFormMsg').textContent = '保存失败：浏览器存储空间可能不足。';
  }
});

$('exportBtn').addEventListener('click', async () => {
  const payload = { format: 'elseverse-backup', version: 1, exportedAt: new Date().toISOString(), worlds, records: await allRecords(), language };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Elseverse-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  $('backupMsg').textContent = '备份文件已生成。';
});

$('importFile').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.format !== 'elseverse-backup' || !Array.isArray(data.worlds) || !Array.isArray(data.records)) throw Error('格式不匹配');
    if (!(await uiConfirm('导入会合并记录；同 ID 的记录将被备份文件覆盖。继续吗？'))) return;
    worlds = data.worlds;
    localStorage.setItem(LEGACY_WORLDS, JSON.stringify(worlds));
    for (const r of data.records) await saveRecord(r);
    records = await allRecords();
    renderManage();
    renderTimeline();
    $('backupMsg').textContent = '导入完成。';
  } catch (err) {
    $('backupMsg').textContent = '导入失败：文件格式不正确或数据无法读取。';
  } finally {
    e.target.value = '';
  }
});

/* ==========================================================================
   GLOBAL EVENTS, VISIBILITY & INIT
   ========================================================================== */
function updateLanguageUI() {
  $('langToggle').textContent = language === 'zh' ? 'EN' : '中文';
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  const tagline = $('homeTagline');
  if (tagline) {
    tagline.textContent = language === 'zh' ? '为每一个想象中的世界，留一处存在的地方。' : 'A place for every world within.';
  }
  if (!$('homeView').classList.contains('hidden')) {
    computeBubbleLayout();
  }
}

document.addEventListener('click', e => {
  const cat = e.target.closest('[data-category]');
  if (cat) { currentCategory = cat.dataset.category; renderWorlds(); show('worldsView'); return; }
  const wid = e.target.closest('[data-world-id]');
  if (wid) { openWorld(wid.dataset.worldId); return; }
  const pg = e.target.closest('[data-open-page]');
  if (pg) { if (pg.dataset.openPage === 'timeline') openTimeline(); else openPage(pg.dataset.openPage); return; }
  if (e.target.closest('[data-back-home]')) { show('homeView'); return; }
  if (e.target.closest('[data-back-universe]')) { renderArchiveNav(); renderTimeline(); show('universeView'); return; }
});

$('manageToggle').addEventListener('click', () => { renderManage(); show('manageView'); });
$('brandHome').addEventListener('click', e => { e.preventDefault(); show('homeView'); });
$('langToggle').addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  localStorage.setItem(LEGACY_LANG, language);
  updateLanguageUI();
});

$('immersiveToggle')?.addEventListener('click', () => {
  const on = !document.body.classList.contains('sky-immersive');
  document.body.classList.toggle('sky-immersive', on);
  $('immersiveToggle').setAttribute('aria-pressed', String(on));
  $('immersiveToggle').textContent = on ? (language === 'zh' ? '退出沉浸 ×' : 'Exit ×') : (language === 'zh' ? '沉浸视野 ⛶' : 'Immerse ⛶');
  resizeParticleCanvas();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopBubbleScene();
    stopParticleSphere();
  } else {
    if (!$('homeView').classList.contains('hidden')) startBubbleScene();
    else if (!$('universeView').classList.contains('hidden')) startParticleSphere();
  }
});

let resizeTimer = 0;
function onViewportChange() {
  syncViewportCss();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!$('homeView').classList.contains('hidden')) resizeBubbleCanvases();
    if (!$('universeView').classList.contains('hidden')) resizeParticleCanvas();
  }, 90);
}
window.addEventListener('resize', onViewportChange, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onViewportChange, { passive: true });
}

(async function init() {
  syncViewportCss();
  worlds = loadWorlds();
  records = await allRecords();
  $('year').textContent = new Date().getFullYear();
  renderArchiveNav();
  renderTimeline();
  updateLanguageUI();
  show('homeView');
})();
