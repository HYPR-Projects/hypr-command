import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* =============================================================================
 * HYPR Command — Gerador de Mockups (aba unificada)
 * Home em grade (1ª visão) → cada card abre a config do mockup na mesma aba.
 * Engines reais portados do max attention: Scratch, Carousel, Tap to Map.
 * ========================================================================== */

const T = { navy: "transparent", panel: "var(--bg-card)", line: "var(--bdr)", teal: "var(--teal)", yellow: "var(--yellow)", t1: "var(--t1)", t2: "var(--t2)", t3: "var(--t3)" };
const field = { width: "100%", background: "var(--bg-input)", border: `1px solid ${T.line}`, borderRadius: 8, padding: "8px 10px", color: T.t1, fontSize: 13, outline: "none", fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: T.t2, margin: "13px 0 5px", letterSpacing: ".02em" };
const SIZES = [
  { key: "300x250", w: 300, h: 250 }, { key: "336x280", w: 336, h: 280 },
  { key: "300x600", w: 300, h: 600 }, { key: "320x480", w: 320, h: 480 },
  { key: "320x50", w: 320, h: 50 }, { key: "970x250", w: 970, h: 250 },
];

function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setRm(mq.matches); on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return rm;
}

/* ===== Scratch engine (port de ScratchRender.tsx + scratch-fx) ===== */

/* =============================================================================
 * Tap to Scratch — port fiel do ScratchRender do max attention (o2o-platform).
 *
 * Mantém a mecânica original: canvas DPR-aware, raspagem com
 * globalCompositeOperation="destination-out", snapshot da cobertura intacta,
 * animação-convite (mão que cava um furo itinerante e cicatriza atrás),
 * amostragem 48×48 pra medir % raspado, reveal por threshold% OU segundos de
 * raspagem ativa, auto-complete com "burst" (anel smoothstep / evaporar) e o
 * sistema de partículas scratch-fx (shine / eraser / evaporate).
 *
 * Removido do original (camada de serving, irrelevante pro mockup): tracking,
 * DSP click-wrap, safeframe, cover-video, mecânica "wipe/cortina", reveal por
 * vídeo VAST / script-iframe, widgets e AdChoices. A camada revelada aqui é o
 * criativo enviado (imagem) + headline/body/CTA compostos.
 * ========================================================================== */

/* ── scratch-fx (portado verbatim do render/scratch/scratch-fx.ts) ────────── */
const MAX_PARTICLES = 220;
const rand = (a, b) => a + Math.random() * (b - a);

function parseColor(hex) {
  const s = String(hex).trim().replace(/^#/, "");
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16), g = parseInt(s[1] + s[1], 16), b = parseInt(s[2] + s[2], 16);
    if (![r, g, b].some(Number.isNaN)) return { r, g, b };
  }
  if (s.length === 6) {
    const r = parseInt(s.slice(0, 2), 16), g = parseInt(s.slice(2, 4), 16), b = parseInt(s.slice(4, 6), 16);
    if (![r, g, b].some(Number.isNaN)) return { r, g, b };
  }
  return { r: 150, g: 150, b: 150 };
}

function sampleRect(snap, dpr, xCss, yCss, tileCss) {
  if (!snap || snap.width <= 0 || snap.height <= 0) return null;
  const W = snap.width, H = snap.height;
  const sw = Math.max(2, Math.min(Math.round(tileCss * dpr), W));
  const sh = Math.max(2, Math.min(Math.round(tileCss * dpr), H));
  let sx = Math.round(xCss * dpr - sw / 2);
  let sy = Math.round(yCss * dpr - sh / 2);
  sx = Math.max(0, Math.min(sx, W - sw));
  sy = Math.max(0, Math.min(sy, H - sh));
  return { src: snap, sx, sy, sw, sh };
}

function emitScratchTrail(out, fx, x, y, brush, coverColor, snapshot, dpr) {
  if (fx === "none" || out.length >= MAX_PARTICLES) return;
  if (fx === "shine") {
    for (let i = 0; i < 2; i++) {
      out.push({ kind: "sparkle", x: x + rand(-brush, brush) * 0.5, y: y + rand(-brush, brush) * 0.5,
        vx: rand(-22, 22), vy: rand(-46, -8), life: rand(0.45, 0.85), ttl: 0.85,
        size: rand(brush * 0.18, brush * 0.42), rot: rand(0, Math.PI), vrot: rand(-5, 5), hue: rand(40, 52) });
    }
  } else if (fx === "eraser") {
    for (let i = 0; i < 2; i++) {
      const px = x + rand(-brush, brush) * 0.6, py = y + rand(-brush, brush) * 0.6;
      const tile = sampleRect(snapshot, dpr, px, py, rand(brush * 0.22, brush * 0.42));
      out.push({ kind: tile ? "shard" : "crumb", x: px, y: py, vx: rand(-34, 34), vy: rand(-16, 22),
        life: rand(0.5, 0.95), ttl: 0.95, size: rand(brush * 0.16, brush * 0.3), rot: rand(0, Math.PI),
        vrot: rand(-7, 7), rgb: tile ? undefined : parseColor(coverColor), ...(tile ?? {}) });
    }
  } else if (fx === "evaporate") {
    const px = x + rand(-brush, brush) * 0.4, py = y + rand(-brush, brush) * 0.4;
    const tile = sampleRect(snapshot, dpr, px, py, rand(brush * 0.14, brush * 0.26));
    out.push({ kind: tile ? "vapor" : "smoke", x: px, y: py, vx: rand(-9, 9), vy: rand(-34, -14),
      life: rand(0.6, 1.1), ttl: 1.1, size: rand(brush * 0.3, brush * 0.55), rot: rand(-0.3, 0.3),
      vrot: rand(-0.6, 0.6), rgb: tile ? undefined : parseColor(coverColor), ...(tile ?? {}) });
  }
}

function emitRevealBurst(out, fx, w, h, coverColor, snapshot, dpr) {
  if (fx === "none") return;
  const span = Math.max(16, Math.min(w, h));
  if (fx === "shine") {
    const n = Math.min(46, Math.round((w * h) / 5200));
    for (let i = 0; i < n; i++) out.push({ kind: "sparkle", x: rand(0, w), y: rand(0, h),
      vx: rand(-30, 30), vy: rand(-70, -10), life: rand(0.5, 1.0), ttl: 1.0,
      size: rand(span * 0.025, span * 0.06), rot: rand(0, Math.PI), vrot: rand(-5, 5), hue: rand(40, 52) });
  } else if (fx === "eraser") {
    const n = Math.min(40, Math.round((w * h) / 6000));
    for (let i = 0; i < n; i++) {
      const px = rand(0, w), py = rand(0, h * 0.7), tileSize = span * rand(0.03, 0.06);
      const tile = sampleRect(snapshot, dpr, px, py, tileSize);
      out.push({ kind: tile ? "shard" : "crumb", x: px, y: py, vx: rand(-30, 30), vy: rand(-14, 18),
        life: rand(0.6, 1.1), ttl: 1.1, size: tileSize, rot: rand(0, Math.PI), vrot: rand(-8, 8),
        rgb: tile ? undefined : parseColor(coverColor), ...(tile ?? {}) });
    }
  }
}

function emitEvaporateEdge(out, w, edgeY, coverColor, snapshot, dpr) {
  if (out.length >= MAX_PARTICLES) return;
  for (let i = 0; i < 3; i++) {
    const px = rand(0, w), py = edgeY + rand(-6, 10);
    const tile = sampleRect(snapshot, dpr, px, py, rand(w * 0.015, w * 0.035));
    out.push({ kind: tile ? "vapor" : "smoke", x: px, y: py, vx: rand(-12, 12), vy: rand(-62, -28),
      life: rand(0.7, 1.2), ttl: 1.2, size: rand(w * 0.04, w * 0.085), rot: rand(-0.3, 0.3),
      vrot: rand(-0.5, 0.5), rgb: tile ? undefined : parseColor(coverColor), ...(tile ?? {}) });
  }
}

function updateParticles(list, dt) {
  const alive = [];
  for (const p of list) {
    p.life -= dt;
    if (p.life <= 0) continue;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
    if (p.kind === "crumb" || p.kind === "shard") { p.vy += 280 * dt; p.vx *= 1 - Math.min(1, 0.9 * dt); }
    else if (p.kind === "smoke" || p.kind === "vapor") { p.size += 26 * dt; p.vy *= 1 - Math.min(1, 0.5 * dt); }
    else { p.vy += 36 * dt; }
    alive.push(p);
  }
  return alive;
}

function drawSparkle(ctx, r, color) {
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = r * 1.6;
  ctx.beginPath();
  const inner = r * 0.34;
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i, rad = i % 2 === 0 ? r : inner;
    const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

function drawParticles(ctx, list) {
  for (const p of list) {
    const t = Math.max(0, Math.min(1, p.life / p.ttl));
    ctx.save();
    if (p.kind === "sparkle") {
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.sin(t * Math.PI);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); drawSparkle(ctx, p.size, `hsl(${p.hue ?? 46} 100% 72%)`);
    } else if (p.kind === "shard" && p.src) {
      ctx.globalAlpha = Math.min(1, t * 1.5); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.src, p.sx, p.sy, p.sw, p.sh, -p.size / 2, -p.size / 2, p.size, p.size);
    } else if (p.kind === "vapor" && p.src) {
      ctx.globalAlpha = t * 0.5; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.src, p.sx, p.sy, p.sw, p.sh, -p.size / 2, -p.size / 2, p.size, p.size);
    } else if (p.kind === "crumb") {
      const c = p.rgb ?? { r: 136, g: 136, b: 136 };
      ctx.globalAlpha = Math.min(1, t * 1.5); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = `rgb(${c.r} ${c.g} ${c.b})`;
      ctx.beginPath(); ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === "smoke") {
      const c = p.rgb ?? { r: 170, g: 170, b: 170 };
      ctx.globalAlpha = t * 0.45;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      g.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.55)`);
      g.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

/* ── Cover label + hand (portados do ScratchRender) ───────────────────────── */
function drawCoverLabel(ctx, w, h, label) {
  if (!label || !label.trim()) return;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `600 ${Math.max(12, Math.min(w, h) * 0.06)}px Urbanist, system-ui, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, w / 2, h / 2);
}

function HandIcon({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v7.5c0 3.59-2.91 6.5-6.5 6.5h-1.2c-1.6 0-3.13-.64-4.24-1.76L5 16.8c-.78-.79-.78-2.06 0-2.84.78-.78 2.06-.78 2.84 0L9 15.2V8.5a1.5 1.5 0 0 1 3 0"
        fill="#fff" stroke="rgba(0,0,0,0.25)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

const HAND_PX = { small: 34, medium: 44, large: 58 };
const SAMPLE = 48;
const REVEAL_BURST_MS = 920;


/* ── ScratchStage — o motor de render (miolo do ScratchRender) ────────────── */
function ScratchStage({ config, resetKey, forceReveal = false }) {
  const uid = useId().replace(/[:]/g, "");
  const animName = `sc${uid}`;
  const reducedMotion = useReducedMotion();

  const rootRef = useRef(null), canvasRef = useRef(null), fxCanvasRef = useRef(null), handRef = useRef(null);
  const snapshotRef = useRef(null), sampleRef = useRef(null), particlesRef = useRef([]), dprRef = useRef(1);
  const drawingRef = useRef(false), lastPtRef = useRef(null), downPtRef = useRef(null), downTimeRef = useRef(0), movedRef = useRef(false);
  const interactedRef = useRef(false), revealedRef = useRef(false), startedAtRef = useRef(null);
  const activeMsRef = useRef(0), lastTickRef = useRef(0), lastSampleRef = useRef(0), lastBucketRef = useRef(-1);
  const autoRevealRafRef = useRef(null), fxRafRef = useRef(null), fxLastTsRef = useRef(0), fxEmitTsRef = useRef(0), inviteHoleRef = useRef(null);

  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [coachmarkGone, setCoachmarkGone] = useState(false);

  const thresholdPct = config.reveal_threshold;
  const scratchMs = config.scratch_seconds * 1000;
  const handPx = HAND_PX[config.gesture_size] || 44;
  const showCoachmark = config.show_gesture_hint && !revealed && !forceReveal && !coachmarkGone;
  const isRevealed = revealed || forceReveal;

  const captureSnapshot = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const snap = snapshotRef.current ?? document.createElement("canvas");
    snap.width = canvas.width; snap.height = canvas.height;
    const sctx = snap.getContext("2d");
    if (sctx) { sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, snap.width, snap.height); sctx.drawImage(canvas, 0, 0); }
    snapshotRef.current = snap;
  }, []);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current, root = rootRef.current;
    if (!canvas || !root) return;
    const w = root.clientWidth, h = root.clientHeight;
    if (w <= 0 || h <= 0) return;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    dprRef.current = dpr;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);

    const fxCanvas = fxCanvasRef.current;
    if (fxCanvas) {
      fxCanvas.width = Math.round(w * dpr); fxCanvas.height = Math.round(h * dpr);
      const fctx = fxCanvas.getContext("2d");
      if (fctx) { fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); }
    }
    particlesRef.current = [];

    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);

    const paintSolid = () => {
      ctx.fillStyle = config.cover_color; ctx.fillRect(0, 0, w, h);
      drawCoverLabel(ctx, w, h, config.cover_label); captureSnapshot();
    };
    if (config.cover_image_url) {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => {
        const r = Math.max(w / img.width, h / img.height), dw = img.width * r, dh = img.height * r;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        drawCoverLabel(ctx, w, h, config.cover_label); captureSnapshot();
      };
      img.onerror = paintSolid; img.src = config.cover_image_url;
    } else { paintSolid(); }

    if (autoRevealRafRef.current != null) { cancelAnimationFrame(autoRevealRafRef.current); autoRevealRafRef.current = null; }
    activeMsRef.current = 0; revealedRef.current = false; startedAtRef.current = null; lastBucketRef.current = -1;
    interactedRef.current = false;
    setRevealed(false); setProgress(0); setInteracted(false); setCoachmarkGone(false);
  }, [config.cover_color, config.cover_image_url, config.cover_label, captureSnapshot]);

  const clearCover = useCallback(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
  }, []);

  const ensureFxLoop = useCallback(() => {
    if (fxRafRef.current != null) return;
    const loop = (ts) => {
      const fxCanvas = fxCanvasRef.current, ctx = fxCanvas?.getContext("2d");
      if (!fxCanvas || !ctx) { fxRafRef.current = null; fxLastTsRef.current = 0; return; }
      const dt = fxLastTsRef.current ? Math.min(0.05, (ts - fxLastTsRef.current) / 1000) : 0.016;
      fxLastTsRef.current = ts;
      particlesRef.current = updateParticles(particlesRef.current, dt);
      const dpr = dprRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawParticles(ctx, particlesRef.current);
      if (particlesRef.current.length > 0) fxRafRef.current = requestAnimationFrame(loop);
      else { fxRafRef.current = null; fxLastTsRef.current = 0; }
    };
    fxLastTsRef.current = 0; fxRafRef.current = requestAnimationFrame(loop);
  }, []);

  const sampleProgress = useCallback(() => {
    const source = canvasRef.current;
    let sample = sampleRef.current;
    if (!source) return 0;
    if (!sample) { sample = document.createElement("canvas"); sample.width = SAMPLE; sample.height = SAMPLE; sampleRef.current = sample; }
    const sctx = sample.getContext("2d", { willReadFrequently: true }); if (!sctx) return 0;
    sctx.clearRect(0, 0, SAMPLE, SAMPLE); sctx.drawImage(source, 0, 0, SAMPLE, SAMPLE);
    let data;
    try { ({ data } = sctx.getImageData(0, 0, SAMPLE, SAMPLE)); } catch { return 0; }
    let clear = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 40) clear++;
    return (clear / (SAMPLE * SAMPLE)) * 100;
  }, []);

  const animateAutoReveal = useCallback(() => {
    const canvas = canvasRef.current, root = rootRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !root || !ctx) { clearCover(); return; }
    const w = root.clientWidth, h = root.clientHeight, dpr = dprRef.current, fx = config.scratch_fx;
    const center = lastPtRef.current ?? { x: w / 2, y: h / 2 };
    const maxR = Math.hypot(w, h);
    emitRevealBurst(particlesRef.current, fx, w, h, config.cover_color, snapshotRef.current, dpr);
    if (fx !== "none") ensureFxLoop();
    let startTs = 0;
    const step = (ts) => {
      if (startTs === 0) startTs = ts;
      const p = Math.min(1, (ts - startTs) / REVEAL_BURST_MS);
      const eased = p * p * (3 - 2 * p);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
      if (fx === "evaporate") {
        const edgeY = h * (1 - eased);
        ctx.fillStyle = "#000"; ctx.fillRect(0, edgeY, w, h - edgeY);
        const band = Math.max(24, h * 0.12);
        const grad = ctx.createLinearGradient(0, edgeY - band, 0, edgeY);
        grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = grad; ctx.fillRect(0, edgeY - band, w, band);
        if (p < 1) { emitEvaporateEdge(particlesRef.current, w, edgeY, config.cover_color, snapshotRef.current, dpr); ensureFxLoop(); }
      } else {
        ctx.beginPath(); ctx.arc(center.x, center.y, eased * maxR, 0, Math.PI * 2); ctx.fill();
      }
      if (p < 1) autoRevealRafRef.current = requestAnimationFrame(step);
      else { autoRevealRafRef.current = null; clearCover(); }
    };
    autoRevealRafRef.current = requestAnimationFrame(step);
  }, [config.scratch_fx, config.cover_color, ensureFxLoop, clearCover]);

  const triggerReveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true; setRevealed(true); setProgress(100);
    if (config.auto_complete) { if (reducedMotion) clearCover(); else animateAutoReveal(); }
  }, [config.auto_complete, reducedMotion, animateAutoReveal, clearCover]);

  const eraseTo = useCallback((x, y) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const r = config.brush_size;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; ctx.lineWidth = r * 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const last = lastPtRef.current;
    if (last) { ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    lastPtRef.current = { x, y };
  }, [config.brush_size]);

  const pointFromEvent = (e) => {
    const root = rootRef.current; const rect = root.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = useCallback((e) => {
    if (revealedRef.current) return;
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    const firstTouch = !interactedRef.current;
    drawingRef.current = true; interactedRef.current = true; lastTickRef.current = performance.now();
    if (startedAtRef.current == null) startedAtRef.current = Date.now();
    if (!interacted) setInteracted(true);
    if (firstTouch) {
      const canvas = canvasRef.current, snap = snapshotRef.current, ctx = canvas?.getContext("2d");
      if (canvas && snap && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "source-over"; ctx.drawImage(snap, 0, 0);
        ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      }
    }
    const p = pointFromEvent(e);
    downPtRef.current = p; downTimeRef.current = performance.now(); movedRef.current = false; lastPtRef.current = null;
    eraseTo(p.x, p.y);
  }, [eraseTo, interacted]);

  const onPointerMove = useCallback((e) => {
    if (!drawingRef.current || revealedRef.current) return;
    e.preventDefault();
    const now = performance.now();
    activeMsRef.current += now - lastTickRef.current; lastTickRef.current = now;
    const p = pointFromEvent(e);
    if (downPtRef.current) {
      const dx = p.x - downPtRef.current.x, dy = p.y - downPtRef.current.y;
      if (dx * dx + dy * dy > 64) movedRef.current = true;
    }
    eraseTo(p.x, p.y);
    if (config.scratch_fx !== "none" && !reducedMotion && now - fxEmitTsRef.current > 26) {
      fxEmitTsRef.current = now;
      emitScratchTrail(particlesRef.current, config.scratch_fx, p.x, p.y, config.brush_size, config.cover_color, snapshotRef.current, dprRef.current);
      ensureFxLoop();
    }
    if (now - lastSampleRef.current > 110) {
      lastSampleRef.current = now;
      const pct = sampleProgress();
      setProgress(pct);
      if (pct >= thresholdPct || activeMsRef.current >= scratchMs) triggerReveal();
    }
  }, [eraseTo, sampleProgress, thresholdPct, scratchMs, triggerReveal, config.scratch_fx, config.brush_size, config.cover_color, reducedMotion, ensureFxLoop]);

  const endStroke = useCallback(() => { drawingRef.current = false; lastPtRef.current = null; }, []);

  const onCoverPointerUp = useCallback(() => { endStroke(); }, [endStroke]);

  // Paint on mount + on resize (device/size switch) + on config/reset changes.
  useEffect(() => {
    paintCover();
    const root = rootRef.current; if (!root) return;
    const ro = new ResizeObserver(() => paintCover());
    ro.observe(root);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintCover, resetKey]);

  // Coachmark disappears shortly after the first interaction.
  useEffect(() => {
    if (!interacted || coachmarkGone) return;
    const t = window.setTimeout(() => setCoachmarkGone(true), 460);
    return () => window.clearTimeout(t);
  }, [interacted, coachmarkGone]);

  // Invite animation: hand sweeps + carves a traveling hole, healing behind it.
  useEffect(() => {
    const animate = config.show_gesture_hint && config.gesture_animate && !reducedMotion && !interacted && !revealed && !forceReveal;
    if (!animate) return;
    let raf = 0, startTs = 0;
    const loop = (ts) => {
      if (interactedRef.current || revealedRef.current) return;
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current, root = rootRef.current, snap = snapshotRef.current;
      if (!canvas || !root || !snap) return;
      const w = root.clientWidth, h = root.clientHeight;
      if (w <= 0 || h <= 0) return;
      if (!startTs) startTs = ts;
      const t = (ts - startTs) / 1000;
      const cx = w / 2 + Math.sin(t * 1.7) * (w * 0.3);
      const cy = h / 2 + Math.sin(t * 3.4) * (h * 0.05);
      const hand = handRef.current;
      if (hand) { hand.style.left = `${cx}px`; hand.style.top = `${cy}px`; }
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const dpr = dprRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "source-over"; ctx.drawImage(snap, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(cx, cy, config.brush_size, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (interactedRef.current) return;
      const canvas = canvasRef.current, snap = snapshotRef.current;
      if (canvas && snap) {
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "source-over"; ctx.drawImage(snap, 0, 0); ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0); }
      }
    };
  }, [config.show_gesture_hint, config.gesture_animate, config.brush_size, reducedMotion, interacted, revealed, forceReveal, resetKey]);

  useEffect(() => () => {
    if (fxRafRef.current != null) cancelAnimationFrame(fxRafRef.current);
    if (autoRevealRafRef.current != null) cancelAnimationFrame(autoRevealRafRef.current);
  }, []);

  const justify = config.text_position === "top" ? "flex-start" : config.text_position === "center" ? "center" : "flex-end";
  const hasText = config.headline?.trim() || config.body?.trim();
  const ctaHref = config.cta_url?.trim() || undefined;

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 10, background: config.reveal_bg_color, userSelect: "none" }}>
      {/* Reveal layer (underneath) — o criativo enviado + texto + CTA */}
      <a
        href={isRevealed ? ctaHref : undefined}
        target={isRevealed && ctaHref ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-hidden={!isRevealed}
        tabIndex={isRevealed && ctaHref ? 0 : -1}
        style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: justify,
          textDecoration: "none", color: config.text_color, backgroundColor: config.reveal_bg_color,
          backgroundImage: config.reveal_image_url ? `url('${config.reveal_image_url}')` : undefined,
          backgroundSize: config.reveal_fit === "contain" ? "contain" : "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: `${config.reveal_position?.x ?? 50}% ${config.reveal_position?.y ?? 50}%`,
          pointerEvents: isRevealed ? "auto" : "none",
          animation: isRevealed && !reducedMotion ? `${animName}-reveal 900ms cubic-bezier(0.22, 1, 0.36, 1) both` : undefined,
          ...(hasText ? { boxShadow: `inset 0 ${justify === "flex-end" ? "-" : ""}120px 80px -60px rgba(0,0,0,0.45)` } : {}),
        }}
      >
        {!config.reveal_image_url && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.5)", fontSize: 12, fontFamily: "Urbanist, system-ui, sans-serif" }}>
            suba o criativo revelado
          </div>
        )}
        {hasText && (
          <div style={{ position: "relative", padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
            {config.headline?.trim() && (
              <div style={{ fontFamily: "Urbanist, system-ui, sans-serif", fontWeight: 800, fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{config.headline}</div>
            )}
            {config.body?.trim() && (
              <div style={{ fontFamily: "Urbanist, system-ui, sans-serif", fontWeight: 500, fontSize: 13, lineHeight: 1.35, opacity: 0.92 }}>{config.body}</div>
            )}
          </div>
        )}
        {isRevealed && config.show_cta_button && config.cta_text?.trim() && (
          <span style={{
            position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)",
            background: config.cta_color, color: "#fff", fontFamily: "Urbanist, system-ui, sans-serif",
            fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 999, whiteSpace: "nowrap",
            boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
            animation: reducedMotion ? undefined : `${animName}-cta 440ms cubic-bezier(0.22,1,0.36,1) 200ms both`,
          }}>{config.cta_text}</span>
        )}
      </a>

      {/* Cover canvas (scratchable) */}
      {!forceReveal && (
        <canvas ref={canvasRef}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onCoverPointerUp}
          onPointerLeave={endStroke} onPointerCancel={endStroke}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none",
            cursor: revealed ? "default" : "grab", pointerEvents: revealed ? "none" : "auto" }} />
      )}

      {/* FX overlay */}
      {!forceReveal && config.scratch_fx !== "none" && (
        <canvas ref={fxCanvasRef} aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />
      )}

      {/* Coachmark (hand) */}
      {showCoachmark && (
        <div ref={handRef} aria-hidden style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%) translate(58%, 50%)", pointerEvents: "none", zIndex: 2,
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))", opacity: interacted ? 0 : 1,
          transition: "opacity 420ms ease", willChange: "left, top, opacity",
        }}>
          <div style={{ animation: reducedMotion ? `${animName}-scratch 1.3s ease-in-out infinite` : undefined, willChange: "transform" }}>
            {config.gesture_icon_url
              ? <img src={config.gesture_icon_url} alt="" style={{ width: handPx, height: handPx, objectFit: "contain" }} />
              : <HandIcon size={handPx} />}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ${animName}-cta { 0% { opacity:0; transform: translateX(-50%) translateY(8px) scale(0.96);} 100% { opacity:1; transform: translateX(-50%) translateY(0) scale(1);} }
        @keyframes ${animName}-reveal { 0% { transform: scale(1.08);} 100% { transform: scale(1);} }
        @keyframes ${animName}-scratch { 0%,100% { transform: translateX(-7px) rotate(-7deg);} 50% { transform: translateX(7px) rotate(7deg);} }
      `}</style>
    </div>
  );
}

/* ── Shell: painel de config (tema HYPR Command) + palco ──────────────────── */
const FX = [
  { value: "none", label: "Nenhuma" }, { value: "shine", label: "Brilho" },
  { value: "eraser", label: "Borracha" }, { value: "evaporate", label: "Evaporar" },
];

const DEFAULTS = {
  creative_size: SIZES[0],
  reveal_image_url: "", reveal_fit: "cover", reveal_position: { x: 50, y: 50 }, reveal_bg_color: "#0F151B",
  headline: "50% OFF", body: "Só até domingo.", text_position: "bottom", text_color: "#FCFEFE",
  cover_image_url: "", cover_color: "#5F25FF", cover_label: "Raspe para revelar",
  reveal_threshold: 35, scratch_seconds: 3, brush_size: 20, scratch_fx: "none", auto_complete: true,
  gesture_icon_url: "", show_gesture_hint: true, gesture_animate: true, gesture_size: "medium",
  show_cta_button: true, cta_text: "Saiba mais", cta_url: "", cta_color: "#5F25FF",
};


function ScratchEditor() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [resetKey, setResetKey] = useState(0);
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));
  const shotRef = useRef(null);
  const reset = () => setResetKey((k) => k + 1);

  const onReveal = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => { set("reveal_image_url", rd.result); reset(); }; rd.readAsDataURL(f);
  };
  const onCover = (e) => {
    const f = e.target.files?.[0]; if (!f) { set("cover_image_url", ""); return; }
    const rd = new FileReader(); rd.onload = () => { set("cover_image_url", rd.result); reset(); }; rd.readAsDataURL(f);
  };

  const size = cfg.creative_size;
  const maxW = 380, scale = Math.min(1, maxW / size.w);

  return (
    <div style={{ display: "flex", gap: 0, minHeight: 560, background: T.navy, color: T.t1, fontFamily: "Urbanist, system-ui, sans-serif", overflow: "hidden" }}>
      {/* Config */}
      <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${T.line}`, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 9, background: T.yellow }} />
          <b style={{ fontSize: 14, fontWeight: 800 }}>Tap to Scratch</b>
        </div>
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 6 }}>Motor real do max attention</div>

        <label style={lbl}>Criativo revelado (o prêmio)</label>
        <label style={{ ...field, display: "block", textAlign: "center", cursor: "pointer", color: T.teal, borderStyle: "dashed" }}>
          {cfg.reveal_image_url ? "Trocar imagem" : "Subir imagem"}
          <input type="file" accept="image/*" onChange={onReveal} style={{ display: "none" }} />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Headline</label><input style={field} value={cfg.headline} onChange={(e) => set("headline", e.target.value)} /></div>
        </div>
        <label style={lbl}>Body</label>
        <input style={field} value={cfg.body} onChange={(e) => set("body", e.target.value)} />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Posição do texto</label>
            <select style={field} value={cfg.text_position} onChange={(e) => set("text_position", e.target.value)}>
              <option value="top">Topo</option><option value="center">Centro</option><option value="bottom">Base</option>
            </select></div>
          <div><label style={lbl}>Cor texto</label><input type="color" value={cfg.text_color} onChange={(e) => set("text_color", e.target.value)} style={{ ...field, padding: 2, height: 36, width: 46 }} /></div>
        </div>

        <div style={{ height: 1, background: T.line, margin: "16px 0 2px" }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em" }}>Cobertura</div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Texto da cobertura</label><input style={field} value={cfg.cover_label} onChange={(e) => set("cover_label", e.target.value)} onBlur={reset} /></div>
          <div><label style={lbl}>Cor</label><input type="color" value={cfg.cover_color} onChange={(e) => { set("cover_color", e.target.value); }} onBlur={reset} style={{ ...field, padding: 2, height: 36, width: 46 }} /></div>
        </div>
        <label style={lbl}>Textura da cobertura (opcional)</label>
        <input type="file" accept="image/*" onChange={onCover} style={{ ...field, padding: 6, fontSize: 11 }} />

        <label style={lbl}>Efeito de partícula</label>
        <select style={field} value={cfg.scratch_fx} onChange={(e) => set("scratch_fx", e.target.value)}>
          {FX.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div style={{ height: 1, background: T.line, margin: "16px 0 2px" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Botão (CTA)</label><input style={field} value={cfg.cta_text} onChange={(e) => set("cta_text", e.target.value)} /></div>
          <div><label style={lbl}>Cor</label><input type="color" value={cfg.cta_color} onChange={(e) => set("cta_color", e.target.value)} style={{ ...field, padding: 2, height: 36, width: 46 }} /></div>
        </div>

        <label style={lbl}>Formato</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SIZES.map((s) => (
            <button key={s.key} onClick={() => { set("creative_size", s); reset(); }} style={chipStyle(s.key === size.key)}>
              {s.key}
            </button>
          ))}
        </div>
      </div>

      {/* Palco */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 52, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
          <div style={{ fontSize: 13, color: T.t2 }}>Prévia · raspe com o mouse</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={reset} style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.t1, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              Repetir
            </button>
            <DownloadMenu stageRef={shotRef} name="tap-to-scratch" animated gifSeconds={3} renderScale={2 / scale} beforeGif={() => reset()} />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "transparent" }}>
          <div ref={shotRef} style={{ width: size.w * scale, height: size.h * scale }}>
            <ScratchStage config={cfg} resetKey={resetKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Carousel engine (port de CarrosselRender.tsx + CarrosselTransitions) ===== */

/* =============================================================================
 * Tap to Carousel — port fiel do CarrosselRender + CarrosselTransitions do
 * max attention (o2o-platform).
 *
 * Mantém o motor real: palco de slides empilhados dirigido por progresso
 * p ∈ [0,1] (applyP), com o arrasto do dedo fazendo scrub ao vivo (imperativo,
 * zero setState por frame), soltar completa (tween) ou volta; setas / dots /
 * autoplay chegam pela prop `index` e animam a mesma applyP. As 8 transições
 * são as do original: slide (deslize), reel (stories vertical), wipe (cortina),
 * cube (cubo 3D), flip (cartão 3D), depth (profundidade), zoom (crossfade+blur),
 * shine (varredura de luz).
 *
 * Padronizado pro time de vendas (sem perder funcionamento): slides são imagem
 * (upload), setas/dots/loop/hint ligados por padrão, layout "full". Removido do
 * original: modo split/prateleira, slides de vídeo/script (FreeformVideo),
 * overlays, widgets, VAST, tracking, DSP click-wrap, AdChoices.
 * ========================================================================== */

/* ── Motor de transições (CarrosselTransitions, portado) ──────────────────── */
const DUR = { slide: 380, reel: 520, wipe: 480, cube: 600, flip: 640, depth: 560, zoom: 460, shine: 540 };
const smooth = (p) => p * p * (3 - 2 * p);
const springy = (p) => { const c = 1.35; const q = p - 1; return 1 + (c + 1) * q * q * q + c * q * q; };
const EASE = { slide: smooth, reel: springy, depth: springy, wipe: smooth, cube: smooth, flip: smooth, zoom: smooth, shine: smooth };

function CarrosselTransitions({ slides, config, transition, index, reducedMotion, hrefFor, onNavigate, onInteract }) {
  const stageRef = useRef(null);
  const slideElsRef = useRef([]);
  const edgeRef = useRef(null), iconRef = useRef(null), shineRef = useRef(null), flashRef = useRef(null);

  const n = slides.length;
  const vertical = transition === "reel";

  const curRef = useRef(index);
  const [pair, setPair] = useState(null);

  const sizeRef = useRef({ w: 300, h: 250 });
  const tweenRef = useRef(null);
  const draggingRef = useRef(false), dragDirRef = useRef(0), movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, lastPos: 0, t: 0 });
  const velRef = useRef(0);

  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const sync = () => { const w = el.clientWidth, h = el.clientHeight; if (w > 0 && h > 0) sizeRef.current = { w, h }; };
    sync(); const ro = new ResizeObserver(sync); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearFx = useCallback((el) => {
    if (!el) return;
    el.style.transform = ""; el.style.opacity = ""; el.style.filter = "";
    el.style.webkitMaskImage = ""; el.style.maskImage = ""; el.style.zIndex = "";
    el.style.transformOrigin = ""; el.style.boxShadow = ""; el.style.borderRadius = "";
    el.style.visibility = "hidden";
  }, []);

  const setStatic = useCallback((at) => {
    slideElsRef.current.forEach(clearFx);
    const cur = slideElsRef.current[at];
    if (cur) cur.style.visibility = "visible";
    if (edgeRef.current) edgeRef.current.style.opacity = "0";
    if (shineRef.current) shineRef.current.style.opacity = "0";
    if (flashRef.current) flashRef.current.style.opacity = "0";
  }, [clearFx]);

  const applyP = useCallback((from, to, d, p) => {
    const f = slideElsRef.current[from], t = slideElsRef.current[to];
    if (!f || !t) return;
    const { w, h } = sizeRef.current;
    slideElsRef.current.forEach((el, i) => { if (i !== from && i !== to) clearFx(el); });
    f.style.visibility = "visible"; t.style.visibility = "visible";
    f.style.zIndex = "1"; t.style.zIndex = "2";
    if (edgeRef.current) edgeRef.current.style.opacity = "0";
    if (shineRef.current) shineRef.current.style.opacity = "0";
    if (flashRef.current) flashRef.current.style.opacity = "0";
    for (const el of [f, t]) {
      el.style.boxShadow = ""; el.style.transformOrigin = ""; el.style.borderRadius = "";
      el.style.maskImage = ""; el.style.webkitMaskImage = "";
      el.style.opacity = "1"; el.style.filter = ""; el.style.transform = "";
    }

    if (transition === "slide") {
      // Deslize clássico: o atual sai, o próximo entra (largura cheia).
      f.style.transform = `translateX(${(-p * w * d).toFixed(1)}px)`;
      t.style.transform = `translateX(${((1 - p) * w * d).toFixed(1)}px)`;

    } else if (transition === "reel") {
      const dip = 1 - 0.05 * Math.sin(p * Math.PI);
      f.style.transform = `translateY(${(-p * h * d).toFixed(1)}px) scale(${dip.toFixed(4)})`;
      f.style.filter = `brightness(${(1 - 0.25 * p).toFixed(3)})`;
      t.style.transform = `translateY(${((1 - p) * h * d).toFixed(1)}px) scale(${dip.toFixed(4)})`;
      t.style.borderRadius = `${(14 * (1 - p)).toFixed(1)}px`;
      t.style.boxShadow = `0 ${(-16 * d).toFixed(0)}px 40px rgba(0,0,0,.5)`;

    } else if (transition === "wipe") {
      const openPx = p * w, soft = 26;
      const m = d === 1
        ? `linear-gradient(270deg, rgba(0,0,0,1) ${Math.max(0, openPx - soft)}px, transparent ${openPx}px)`
        : `linear-gradient(90deg, rgba(0,0,0,1) ${Math.max(0, openPx - soft)}px, transparent ${openPx}px)`;
      t.style.webkitMaskImage = m; t.style.maskImage = m;
      t.style.filter = `brightness(${(0.82 + 0.18 * p).toFixed(3)})`;
      f.style.transform = `translateX(${(-14 * p * d).toFixed(1)}px)`;
      f.style.filter = `brightness(${(1 - 0.3 * p).toFixed(3)})`;
      const edge = edgeRef.current;
      if (edge) {
        edge.style.transform = `translateX(${(d === 1 ? w - openPx : openPx).toFixed(1)}px)`;
        edge.style.opacity = p > 0.01 && p < 0.99 ? "1" : "0";
      }

    } else if (transition === "cube") {
      const dip = 1 - 0.07 * Math.sin(p * Math.PI);
      f.style.transformOrigin = d === 1 ? "100% 50%" : "0% 50%";
      t.style.transformOrigin = d === 1 ? "0% 50%" : "100% 50%";
      f.style.transform = `scale(${dip.toFixed(4)}) translateX(${(-p * w * d).toFixed(1)}px) rotateY(${(-90 * p * d).toFixed(2)}deg)`;
      t.style.transform = `scale(${dip.toFixed(4)}) translateX(${((1 - p) * w * d).toFixed(1)}px) rotateY(${(90 * (1 - p) * d).toFixed(2)}deg)`;
      f.style.filter = `brightness(${(1 - 0.6 * p).toFixed(3)})`;
      t.style.filter = `brightness(${(0.4 + 0.6 * p).toFixed(3)})`;

    } else if (transition === "flip") {
      const s = 1 - 0.1 * Math.sin(p * Math.PI);
      if (p < 0.5) {
        t.style.visibility = "hidden";
        f.style.transform = `scale(${s.toFixed(4)}) rotateY(${(-180 * p * d).toFixed(2)}deg)`;
        f.style.filter = `brightness(${(1 - 0.6 * (p / 0.5)).toFixed(3)})`;
      } else {
        f.style.visibility = "hidden";
        t.style.transform = `scale(${s.toFixed(4)}) rotateY(${(180 * (1 - p) * d).toFixed(2)}deg)`;
        t.style.filter = `brightness(${(0.4 + 0.6 * ((p - 0.5) / 0.5)).toFixed(3)})`;
      }

    } else if (transition === "depth") {
      f.style.transform = `scale(${(1 - 0.16 * p).toFixed(4)}) translateX(${(-0.12 * w * p * d).toFixed(1)}px)`;
      f.style.filter = `brightness(${(1 - 0.45 * p).toFixed(3)})`;
      f.style.borderRadius = `${(10 * p).toFixed(1)}px`;
      t.style.transformOrigin = d === 1 ? "0% 50%" : "100% 50%";
      t.style.transform = `translateX(${((1 - p) * w * d).toFixed(1)}px) rotateY(${(-16 * (1 - p) * d).toFixed(2)}deg)`;
      t.style.borderRadius = `${(10 * (1 - p)).toFixed(1)}px`;
      t.style.boxShadow = `${(-24 * d).toFixed(0)}px 0 48px rgba(0,0,0,${(0.55 * (1 - p * 0.4)).toFixed(3)})`;

    } else if (transition === "zoom") {
      const blur = reducedMotion ? 0 : 7;
      f.style.opacity = String(1 - p);
      f.style.transform = `scale(${(1 + 0.18 * p).toFixed(4)})`;
      f.style.filter = `blur(${(blur * p).toFixed(1)}px) brightness(${(1 + 0.15 * p).toFixed(3)})`;
      t.style.opacity = String(p);
      t.style.transform = `scale(${(1.18 - 0.18 * p).toFixed(4)})`;
      t.style.filter = `blur(${(blur * (1 - p)).toFixed(1)}px)`;
      if (flashRef.current) flashRef.current.style.opacity = String((Math.sin(p * Math.PI) * 0.14).toFixed(3));

    } else if (transition === "shine") {
      t.style.opacity = String(smooth(p));
      t.style.transform = `scale(${(1.04 - 0.04 * p).toFixed(4)}) skewX(${(-4 * (1 - p) * d).toFixed(2)}deg)`;
      const shine = shineRef.current;
      if (shine) {
        const sw = w * 0.34;
        const x = d === 1 ? -sw + p * (w + 2 * sw) : w - p * (w + 2 * sw);
        shine.style.transform = `translateX(${x.toFixed(1)}px) skewX(-12deg)`;
        shine.style.opacity = String(Math.sin(p * Math.PI).toFixed(3));
      }
    }
  }, [transition, clearFx, reducedMotion]);

  const cancelTween = useCallback(() => { if (tweenRef.current != null) { cancelAnimationFrame(tweenRef.current); tweenRef.current = null; } }, []);
  const runTween = useCallback((ms, ease, step, done) => {
    cancelTween();
    if (ms <= 0) { step(1); done(); return; }
    let start = 0;
    const frame = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / ms);
      step(ease(p));
      if (p < 1) tweenRef.current = requestAnimationFrame(frame);
      else { tweenRef.current = null; done(); }
    };
    tweenRef.current = requestAnimationFrame(frame);
  }, [cancelTween]);

  // index mudou (seta/dot/autoplay) → anima a diferença.
  useEffect(() => {
    if (n === 0) return;
    const cur = curRef.current;
    if (index === cur) return;
    if (draggingRef.current) { curRef.current = index; setStatic(index); return; }
    cancelTween();
    let d = index > cur ? 1 : -1;
    if (config.loop && n > 1) {
      if (cur === n - 1 && index === 0) d = 1;
      else if (cur === 0 && index === n - 1) d = -1;
    }
    setPair({ from: cur, to: index });
    runTween(reducedMotion ? 0 : DUR[transition], EASE[transition],
      (e) => applyP(cur, index, d, e),
      () => { curRef.current = index; setPair(null); setStatic(index); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, n]);

  useEffect(() => { cancelTween(); setPair(null); setStatic(curRef.current); }, [transition, cancelTween, setStatic]);
  useEffect(() => () => cancelTween(), [cancelTween]);
  useEffect(() => {
    if (curRef.current >= slides.length) curRef.current = Math.max(0, slides.length - 1);
    setStatic(curRef.current);
  }, [setStatic, slides.length]);

  const targetFor = useCallback((d) => {
    const next = curRef.current + d;
    if (config.loop) return ((next % n) + n) % n;
    return next < 0 || next > n - 1 ? null : next;
  }, [config.loop, n]);

  const onPointerDown = useCallback((e) => {
    if (n < 2 || tweenRef.current != null) return;
    if (e.target.closest?.("button")) return;
    draggingRef.current = true; dragDirRef.current = 0; movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, lastPos: vertical ? e.clientY : e.clientX, t: performance.now() };
    velRef.current = 0;
    if (e.pointerType !== "touch") { try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ok */ } }
  }, [n, vertical]);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const now = performance.now(), s = startRef.current;
    const pos = vertical ? e.clientY : e.clientX;
    velRef.current = (pos - s.lastPos) / Math.max(1, now - s.t);
    s.lastPos = pos; s.t = now;
    const delta = vertical ? e.clientY - s.y : e.clientX - s.x;
    if (Math.abs(delta) < 8) return;
    if (!movedRef.current) { movedRef.current = true; onInteract(); }
    const d = delta < 0 ? 1 : -1;
    const to = targetFor(d);
    if (to == null) return;
    if (dragDirRef.current && d !== dragDirRef.current) {
      const prevTo = targetFor(dragDirRef.current);
      if (prevTo != null) applyP(curRef.current, prevTo, dragDirRef.current, 0);
    }
    if (dragDirRef.current !== d) { dragDirRef.current = d; setPair({ from: curRef.current, to }); }
    const span = vertical ? sizeRef.current.h : sizeRef.current.w;
    applyP(curRef.current, to, d, Math.max(0, Math.min(1, Math.abs(delta) / span)));
  }, [vertical, targetFor, applyP, onInteract]);

  const endDrag = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const d = dragDirRef.current; dragDirRef.current = 0;
    if (!movedRef.current || !d) return;
    const to = targetFor(d);
    if (to == null) { setPair(null); setStatic(curRef.current); return; }
    const s = startRef.current;
    const delta = vertical ? e.clientY - s.y : e.clientX - s.x;
    const span = vertical ? sizeRef.current.h : sizeRef.current.w;
    const p0 = Math.max(0, Math.min(1, Math.abs(delta) / span));
    const flick = Math.abs(velRef.current) > 0.3 && (velRef.current < 0 ? 1 : -1) === d;
    const commit = p0 > 0.22 || flick;
    const from = curRef.current;
    runTween(reducedMotion ? 0 : 300, commit ? EASE[transition] : smooth,
      (eP) => applyP(from, to, d, commit ? p0 + (1 - p0) * eP : p0 * (1 - eP)),
      () => {
        setPair(null);
        if (commit) { curRef.current = to; setStatic(to); onNavigate(to); }
        else setStatic(from);
      });
  }, [vertical, targetFor, runTween, reducedMotion, transition, applyP, setStatic, onNavigate]);

  return (
    <div ref={stageRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag}
      onPointerCancel={endDrag} onPointerLeave={endDrag}
      style={{ position: "absolute", inset: 0, overflow: "hidden", perspective: 800, touchAction: "none", cursor: n > 1 ? "grab" : "default" }}>
      {slides.map((slide, i) => {
        const dest = hrefFor(slide);
        const empty = !slide.image_url;
        return (
          <a key={slide.id} ref={(el) => { slideElsRef.current[i] = el; }}
            href={dest && !empty ? dest : undefined}
            target={dest && !empty ? "_blank" : undefined} rel="noopener noreferrer"
            onClick={(e) => { if (movedRef.current || empty) e.preventDefault(); }}
            draggable={false} aria-label={slide.label || `Slide ${i + 1}`}
            style={{ position: "absolute", inset: 0, display: "block", overflow: "hidden", visibility: "hidden",
              backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: config.bg_color,
              cursor: dest && !empty ? "pointer" : undefined, willChange: "transform, opacity" }}>
            {empty ? (
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "rgba(200,210,218,0.7)", border: "1.5px dashed rgba(127,127,127,0.45)",
                background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.08) 0 10px, transparent 10px 20px)" }}>
                Slide {i + 1} — sem mídia
              </span>
            ) : slide.kind === "video" ? (
              <video src={slide.image_url} muted loop autoPlay playsInline preload="auto"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%",
                  display: "block", pointerEvents: "none" }} />
            ) : (
              <img src={slide.image_url} alt={slide.label || ""} draggable={false} decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%",
                  display: "block", pointerEvents: "none", userSelect: "none" }} />
            )}
          </a>
        );
      })}

      {transition === "wipe" && (
        <div ref={edgeRef} aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 0, opacity: 0, pointerEvents: "none", zIndex: 4 }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: -1, width: 2, background: "rgba(255,255,255,.95)",
            boxShadow: "0 0 14px 2px rgba(255,255,255,.6), 0 0 40px 6px rgba(95,37,255,.5)" }} />
        </div>
      )}
      {transition === "shine" && (
        <div ref={shineRef} aria-hidden style={{ position: "absolute", top: "-20%", bottom: "-20%", width: "34%", left: 0, opacity: 0,
          pointerEvents: "none", zIndex: 4, transform: "skewX(-12deg)",
          background: "linear-gradient(100deg, transparent, rgba(255,255,255,.42) 46%, rgba(255,255,255,.1) 60%, transparent)" }} />
      )}
      {transition === "zoom" && (
        <div ref={flashRef} aria-hidden style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0, pointerEvents: "none", zIndex: 4 }} />
      )}
    </div>
  );
}

/* ── CarrosselStage — pai (index, autoplay, setas, dots, hint) ────────────── */

function CarrosselStage({ config, resetKey, captureMode = false }) {
  const reducedMotion = useReducedMotion();
  const slides = config.slides;
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [hintGone, setHintGone] = useState(false);

  useEffect(() => { setIndex(0); setInteracted(false); setHintGone(false); }, [resetKey]);
  useEffect(() => { if (index > n - 1) setIndex(Math.max(0, n - 1)); }, [n, index]);

  const markInteracted = useCallback(() => { setInteracted(true); setHintGone(true); }, []);

  const goTo = useCallback((next, surface) => {
    if (n === 0) return;
    let to = next;
    if (config.loop) to = ((next % n) + n) % n;
    else to = Math.max(0, Math.min(n - 1, next));
    setIndex(to);
    if (surface !== "autoplay") markInteracted();
  }, [n, config.loop, markInteracted]);

  // Autoplay.
  useEffect(() => {
    if (!config.autoplay || interacted || n < 2) return;
    const t = setInterval(() => setIndex((at) => (config.loop ? (at + 1) % n : Math.min(n - 1, at + 1))), config.autoplay_interval_ms);
    return () => clearInterval(t);
  }, [config.autoplay, config.autoplay_interval_ms, config.loop, interacted, n]);

  // Modo captura (GIF): avança sozinho e rápido, ignorando interação.
  useEffect(() => {
    if (!captureMode || n < 2) return;
    const t = setInterval(() => setIndex((at) => (at + 1) % n), 1900);
    return () => clearInterval(t);
  }, [captureMode, n]);

  // Some o hint depois da 1ª interação.
  useEffect(() => { if (!interacted || hintGone) return; const t = setTimeout(() => setHintGone(true), 400); return () => clearTimeout(t); }, [interacted, hintGone]);

  const hrefFor = useCallback((slide) => (slide?.click_url?.trim() || config.cta_url?.trim() || undefined), [config.cta_url]);

  const norm = n > 0 ? ((index % n) + n) % n : 0;
  const showHint = config.show_swipe_hint && n > 1 && !hintGone;
  const showArrows = config.show_arrows && n > 1;
  const showDots = config.show_dots && n > 1;
  const vertical = config.slide_transition === "reel";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 10, background: config.bg_color, userSelect: "none" }}>
      <CarrosselTransitions slides={slides} config={config} transition={config.slide_transition}
        index={index} reducedMotion={reducedMotion} hrefFor={hrefFor}
        onNavigate={(to) => { setIndex(to); markInteracted(); }} onInteract={markInteracted} />

      {showArrows && !vertical && (
        <>
          <button aria-label="Anterior" onClick={() => goTo(index - 1, "arrow")} style={arrowStyle("left")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button aria-label="Próximo" onClick={() => goTo(index + 1, "arrow")} style={arrowStyle("right")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </>
      )}

      {showDots && (
        <div style={{ position: "absolute", left: "50%", bottom: 10, transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 6 }}>
          {slides.map((_, i) => (
            <button key={i} aria-label={`Ir ao slide ${i + 1}`} onClick={() => goTo(i, "dot")}
              style={{ width: 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer",
                background: i === norm ? "#fff" : "rgba(255,255,255,.45)", boxShadow: "0 1px 2px rgba(0,0,0,.4)" }} />
          ))}
        </div>
      )}

      {showHint && (
        <div aria-hidden style={{ position: "absolute", right: 14, bottom: showDots ? 26 : 16, display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 999, zIndex: 6,
          fontFamily: "Urbanist, system-ui, sans-serif", pointerEvents: "none", animation: reducedMotion ? undefined : "crHint 1.3s ease-in-out infinite" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            {vertical ? <path d="M12 19V5M6 11l6-6 6 6" /> : <path d="M14 7l-5 5 5 5" />}
          </svg>
          {vertical ? "arraste pra cima" : "arraste"}
        </div>
      )}
      <style>{`@keyframes crHint{0%,100%{transform:translate(0,0)}50%{transform:${vertical ? "translate(0,-6px)" : "translate(-6px,0)"}}}`}</style>
    </div>
  );
}
function arrowStyle(side) {
  return { position: "absolute", top: "50%", [side]: 8, transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 999,
    background: "rgba(0,0,0,.42)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 6 };
}

/* ── Shell: painel enxuto pro vendas (tema HYPR Command) ──────────────────── */
const TRANSITIONS = [
  { v: "slide", label: "Deslize" }, { v: "reel", label: "Reel (stories)" }, { v: "wipe", label: "Cortina" },
  { v: "cube", label: "Cubo 3D" }, { v: "flip", label: "Flip 3D" }, { v: "depth", label: "Profundidade" },
  { v: "zoom", label: "Zoom" }, { v: "shine", label: "Brilho" },
];
const MAX_SLIDES = 10;

let SID = 0;
const nid = () => `s${Date.now()}_${SID++}`;

function CarouselEditor() {
  const [size, setSize] = useState(SIZES[0]);
  const [slides, setSlides] = useState([]);
  const [transition, setTransition] = useState("slide");
  const [autoplay, setAutoplay] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const reset = () => setResetKey((k) => k + 1);
  const shotRef = useRef(null);
  const [capMode, setCapMode] = useState(false);

  const addSlides = (files) => {
    const media = [...files].filter((f) => f.type.startsWith("image") || f.type.startsWith("video")).slice(0, MAX_SLIDES - slides.length);
    let pending = media.length; if (!pending) return;
    const acc = [];
    media.forEach((f) => { const kind = f.type.startsWith("video") ? "video" : "image"; const rd = new FileReader(); rd.onload = () => { acc.push({ id: nid(), image_url: rd.result, kind, click_url: "", label: "" }); if (--pending === 0) { setSlides((s) => [...s, ...acc]); reset(); } }; rd.readAsDataURL(f); });
  };
  const removeSlide = (id) => { setSlides((s) => s.filter((x) => x.id !== id)); reset(); };

  const config = useMemo(() => ({
    slides, slide_transition: transition, layout_mode: "full",
    show_arrows: true, show_dots: true, show_swipe_hint: true,
    autoplay, autoplay_interval_ms: 4000, loop: true,
    bg_color: "#1C262F", cta_url: "",
  }), [slides, transition, autoplay]);

  const maxW = 380, scale = Math.min(1, maxW / size.w);

  return (
    <div style={{ display: "flex", minHeight: 560, background: T.navy, color: T.t1, fontFamily: "Urbanist, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${T.line}`, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 9, background: T.yellow }} />
          <b style={{ fontSize: 14, fontWeight: 800 }}>Tap to Carousel</b>
        </div>
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 6 }}>Motor real do max attention</div>

        <label style={lbl}>Slides (imagem ou vídeo)</label>
        <label style={{ ...field, display: "block", textAlign: "center", cursor: "pointer", color: T.teal, borderStyle: "dashed" }}>
          {slides.length ? `Adicionar (${slides.length}/${MAX_SLIDES})` : "Subir imagens ou vídeos"}
          <input type="file" accept="image/*,video/*" multiple onChange={(e) => addSlides(e.target.files)} style={{ display: "none" }} />
        </label>
        {slides.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {slides.map((s, i) => (
              <div key={s.id} style={{ position: "relative", width: 58, height: 58, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.line}` }}>
                {s.kind === "video"
                  ? <video src={s.image_url} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={s.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {s.kind === "video" && <span style={{ position: "absolute", top: 2, left: 3, background: "rgba(28,38,47,.8)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 4 }}>VÍDEO</span>}
                <button onClick={() => removeSlide(s.id)} style={{ position: "absolute", top: 2, right: 2, width: 17, height: 17, borderRadius: 999, border: "none", background: "rgba(28,38,47,.85)", color: "#fff", fontSize: 12, lineHeight: 1, cursor: "pointer" }}>×</button>
                <span style={{ position: "absolute", bottom: 2, left: 3, background: "rgba(28,38,47,.7)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "0 4px", borderRadius: 4 }}>{i + 1}</span>
              </div>
            ))}
          </div>
        )}

        <label style={lbl}>Transição</label>
        <select style={field} value={transition} onChange={(e) => { setTransition(e.target.value); reset(); }}>
          {TRANSITIONS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
        </select>

        <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={autoplay} onChange={(e) => { setAutoplay(e.target.checked); reset(); }} />
          Autoplay (4s)
        </label>

        <label style={lbl}>Formato</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SIZES.map((s) => (
            <button key={s.key} onClick={() => { setSize(s); reset(); }} style={chipStyle(s.key === size.key)}>
              {s.key}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 14, lineHeight: 1.5 }}>Setas, dots, loop e o convite de arraste já vêm ligados — padronizados pro time.</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 52, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
          <div style={{ fontSize: 13, color: T.t2 }}>Prévia · arraste, setas ou dots</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={reset} style={{ background: T.panel, border: `1px solid ${T.line}`, color: T.t1, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
              Repetir
            </button>
            <DownloadMenu stageRef={shotRef} name="tap-to-carousel" animated gifSeconds={6} gifFps={8} renderScale={2 / scale}
              beforeGif={() => { reset(); setCapMode(true); }} afterGif={() => { setCapMode(false); reset(); }} />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "transparent" }}>
          <div ref={shotRef} style={{ width: size.w * scale, height: size.h * scale }}>
            <CarrosselStage config={config} resetKey={resetKey} captureMode={capMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Tap to Map (React) — MapLibre GL + OpenFreeMap (via npm) ===== */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const DEFAULT_CENTER = [-47.93, -15.78], DEFAULT_ZOOM = 4;
function safeHex(c, f) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((c || "").trim()) ? c : f; }
function withAlpha(hex, a) {
  const h = hex.replace("#", "");
  const p = (i) => parseInt(h.length === 3 ? h[i] + h[i] : h.slice(i * 2, i * 2 + 2), 16);
  if (h.length === 3 || h.length === 6) return `rgba(${p(0)},${p(1)},${p(2)},${a})`;
  return hex;
}
function pinElement(color) {
  const d = document.createElement("div"); d.style.cursor = "pointer";
  d.innerHTML = `<svg width="30" height="40" viewBox="0 0 30 40" fill="none"><path d="M15 39C15 39 27 24.5 27 14A12 12 0 1 0 3 14C3 24.5 15 39 15 39Z" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="14" r="4.4" fill="#fff"/></svg>`;
  return d;
}
const geocache = {};
async function geocodeAddr(q) {
  if (geocache[q] !== undefined) return geocache[q];
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
    const j = await r.json();
    geocache[q] = j && j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
  } catch { geocache[q] = null; }
  return geocache[q];
}

function TapToMapEditor() {
  const ready = true;
  const [size, setSize] = useState(SIZES[2]);
  const [title, setTitle] = useState("Encontre a loja mais próxima");
  const [company, setCompany] = useState("Nissan");
  const [headerColor, setHeaderColor] = useState("#1C262F");
  const [pinColor, setPinColor] = useState("#EF4444");
  const [logo, setLogo] = useState("");
  const [splash, setSplash] = useState("");
  const [addresses, setAddresses] = useState("Nissan Tatuapé | Av. Celso Garcia, 3000 - Tatuapé, São Paulo\nNissan Morumbi | Av. Giovanni Gronchi, 5000 - Morumbi, São Paulo\nNissan Santana | Av. Cruzeiro do Sul, 1800 - Santana, São Paulo");
  const [ctaText, setCtaText] = useState("Como chegar");
  const [status, setStatus] = useState("Arraste a capa pra revelar o mapa");
  const [splashGone, setSplashGone] = useState(false);
  const [card, setCard] = useState(null);
  const [busy, setBusy] = useState(false);

  const mapDiv = useRef(null), mapRef = useRef(null), markersRef = useRef([]);
  const splashRef = useRef(null);
  const shotRef = useRef(null);

  useEffect(() => {
    if (!ready || !mapDiv.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: mapDiv.current, style: MAP_STYLE, center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, attributionControl: { compact: true }, preserveDrawingBuffer: true });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [ready]);
  useEffect(() => { if (mapRef.current) setTimeout(() => mapRef.current.resize(), 60); }, [size]);

  const apply = async () => {
    const map = mapRef.current; if (!map) return;
    setBusy(true);
    const lines = addresses.split("\n").map((l) => l.trim()).filter(Boolean);
    const locs = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split("|");
      const name = parts.length >= 2 ? parts[0].trim() : `Loja ${i + 1}`;
      const rest = parts.length >= 2 ? parts.slice(1).join("|").trim() : lines[i];
      const m = rest.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
      if (m) locs.push({ name, address: "", lat: +m[1], lng: +m[2] });
      else { setStatus(`Geocodificando ${i + 1}/${lines.length}…`); const hit = await geocodeAddr(rest); if (hit) locs.push({ name, address: rest, lat: hit.lat, lng: hit.lng }); await new Promise((r) => setTimeout(r, 900)); }
    }
    markersRef.current.forEach((mk) => mk.remove()); markersRef.current = [];
    const color = safeHex(pinColor, "#EF4444");
    const b = new maplibregl.LngLatBounds();
    locs.forEach((loc) => {
      const el = pinElement(color);
      el.addEventListener("click", () => { setCard(loc); map.easeTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 13), duration: 500 }); });
      const mk = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([loc.lng, loc.lat]).addTo(map);
      markersRef.current.push(mk); b.extend([loc.lng, loc.lat]);
    });
    if (locs.length === 1) map.easeTo({ center: [locs[0].lng, locs[0].lat], zoom: 13 });
    else if (locs.length > 1) map.fitBounds(b, { padding: 56, maxZoom: 14, duration: 500 });
    setStatus(locs.length ? `${locs.length} pins · arraste a capa e toque num pin` : "Nenhum endereço geocodificado");
    setBusy(false);
  };

  // Splash swipe
  const dragRef = useRef({ y: null, dy: 0 });
  const onDown = (e) => { dragRef.current = { y: (e.touches ? e.touches[0].clientY : e.clientY), dy: 0 }; if (splashRef.current) splashRef.current.style.transition = "none"; };
  const onMove = (e) => { const st = dragRef.current; if (st.y == null) return; const y = (e.touches ? e.touches[0].clientY : e.clientY); st.dy = Math.min(0, y - st.y); const H = splashRef.current?.clientHeight || 300; splashRef.current.style.transform = `translateY(${st.dy}px)`; splashRef.current.style.opacity = String(Math.max(0, 1 + st.dy / H)); if (e.cancelable) e.preventDefault(); };
  const onUp = () => { const st = dragRef.current; if (st.y == null) return; const H = splashRef.current?.clientHeight || 300; const el = splashRef.current; el.style.transition = "transform .32s ease, opacity .32s ease"; if (Math.abs(st.dy) > H * 0.3) { el.style.transform = `translateY(-${H}px)`; el.style.opacity = "0"; setTimeout(() => setSplashGone(true), 300); setStatus("Mapa revelado · toque num pin"); } else { el.style.transform = "translateY(0)"; el.style.opacity = "1"; } dragRef.current = { y: null, dy: 0 }; };
  useEffect(() => { const mv = onMove, up = onUp; window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up); return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); }; });

  const upload = (setter, mark) => (e) => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setter(rd.result); rd.readAsDataURL(f); };

  const maxW = 560, scale = Math.min(1, maxW / size.w);
  const glass = { background: withAlpha(safeHex(headerColor, "#1C262F"), 0.78), backdropFilter: "blur(20px) saturate(170%)", WebkitBackdropFilter: "blur(20px) saturate(170%)", border: "1px solid rgba(255,255,255,.16)", color: "#fff", boxShadow: "0 8px 22px -8px rgba(0,0,0,.45), inset 0 1px 0 0 rgba(255,255,255,.18)" };

  return (
    <div style={{ display: "flex", minHeight: 560 }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${T.line}`, padding: 18 }}>
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>MapLibre + OpenFreeMap {ready ? "" : "· carregando lib…"}</div>
        <label style={lbl}>Título (header)</label><input style={field} value={title} onChange={(e) => setTitle(e.target.value)} />
        <label style={lbl}>Empresa</label><input style={field} value={company} onChange={(e) => setCompany(e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Cor header</label><input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} style={{ ...field, padding: 2, height: 36 }} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Cor pin</label><input type="color" value={pinColor} onChange={(e) => setPinColor(e.target.value)} style={{ ...field, padding: 2, height: 36 }} /></div>
        </div>
        <label style={lbl}>Logo (opcional)</label>
        <label style={{ ...field, display: "block", textAlign: "center", cursor: "pointer", color: T.teal }}>{logo ? "Trocar logo" : "Subir logo"}<input type="file" accept="image/*" onChange={upload(setLogo)} style={{ display: "none" }} /></label>
        <label style={lbl}>Capa / splash (arraste pra revelar)</label>
        <label style={{ ...field, display: "block", textAlign: "center", cursor: "pointer", color: T.teal, borderStyle: "dashed" }}>{splash ? "Trocar capa" : "Subir capa"}<input type="file" accept="image/*" onChange={upload(setSplash)} style={{ display: "none" }} /></label>
        <label style={lbl}>Endereços · "Nome | Endereço" (ou "Nome | lat,lng")</label>
        <textarea style={{ ...field, minHeight: 96, resize: "vertical", fontSize: 12 }} value={addresses} onChange={(e) => setAddresses(e.target.value)} />
        <label style={lbl}>Botão do card</label><input style={field} value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
        <label style={lbl}>Formato</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SIZES.map((s) => <button key={s.key} onClick={() => setSize(s)} style={chipStyle(s.key === size.key)}>{s.key}</button>)}
        </div>
        <button onClick={apply} disabled={!ready || busy} style={{ ...field, marginTop: 14, background: T.navy, borderColor: T.teal, color: T.teal, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>{busy ? "Gerando…" : "Aplicar e gerar pins"}</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 44, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", fontSize: 12, color: T.t2 }}><span>{status}</span><DownloadMenu stageRef={shotRef} name="tap-to-map" mapRef={mapRef} renderScale={2 / scale} /></div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "transparent" }}>
          <div ref={shotRef} style={{ position: "relative", width: size.w * scale, height: size.h * scale, borderRadius: 12, overflow: "hidden", background: "#e9eaed", boxShadow: "0 12px 40px rgba(0,0,0,.35)" }}>
            <div ref={mapDiv} style={{ position: "absolute", inset: 0 }} />
            {!ready && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#8792a0", fontSize: 12 }}>Carregando mapa…</div>}
            {/* header */}
            <div style={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 5, display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 12, ...glass }}>
              {logo && <img src={logo} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />}
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
                <b style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</b>
                <span style={{ fontSize: 10.5, opacity: 0.85 }}>{company}</span>
              </div>
            </div>
            {/* card */}
            {card && (
              <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, zIndex: 6, background: "#fff", borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,.22)", padding: "12px 14px" }}>
                <button onClick={() => setCard(null)} style={{ position: "absolute", top: 8, right: 10, border: "none", background: "none", fontSize: 18, color: "#9aa0a6", cursor: "pointer" }}>×</button>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#18181b", paddingRight: 18 }}>{card.name}</div>
                <div style={{ fontSize: 11, color: "#5f6368", margin: "3px 0 11px" }}>{card.address}</div>
                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(card.lat + "," + card.lng)}`, "_blank")}
                  style={{ border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, ...glass }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>{ctaText}
                </button>
              </div>
            )}
            {/* splash */}
            {!splashGone && (
              <div ref={splashRef} onMouseDown={onDown} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
                style={{ position: "absolute", inset: 0, zIndex: 10, background: "#0F151B", cursor: "grab", touchAction: "none", overflow: "hidden" }}>
                {splash ? <img src={splash} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                  : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#8da3b2", fontSize: 12, textAlign: "center", padding: 24 }}>Suba a capa e arraste pra cima pra revelar o mapa</div>}
                <div style={{ position: "absolute", left: "50%", bottom: 22, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 999, pointerEvents: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 19V5M6 11l6-6 6 6" /></svg>arraste para ver o mapa
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Click to Calendar (compacto) ===== */
function CalendarEditor() {
  const [media, setMedia] = useState(null);
  const [v, setV] = useState({ title: "Show da Banda X", desc: "Garanta seu ingresso antes que esgote.", date: "", time: "20:00", notify: "30 minutos antes" });
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));
  const bannerRef = useRef(null);
  const calRef = useRef(null);
  const bothRef = useRef(null);
  const upload = (e) => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => setMedia(rd.result); rd.readAsDataURL(f); };
  const dateLine = (() => { if (!v.date) return "Selecione a data"; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.date); if (!m) return v.date; const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]; const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; const d = new Date(+m[1], +m[2] - 1, +m[3]); return `${dias[d.getDay()]}, ${+m[3]} de ${meses[+m[2] - 1]}`; })();
  return (
    <div style={{ display: "flex", minHeight: 560 }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${T.line}`, padding: 18 }}>
        <label style={lbl}>Criativo (banner 300×250)</label>
        <label style={{ ...field, display: "block", textAlign: "center", cursor: "pointer", color: T.teal, borderStyle: "dashed" }}>{media ? "Trocar imagem" : "Subir imagem"}<input type="file" accept="image/*" onChange={upload} style={{ display: "none" }} /></label>
        <label style={lbl}>Título do evento</label><input style={field} value={v.title} onChange={(e) => set("title", e.target.value)} />
        <label style={lbl}>Descrição</label><textarea style={{ ...field, minHeight: 60, resize: "vertical" }} value={v.desc} onChange={(e) => set("desc", e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Data</label><input type="date" style={field} value={v.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Horário</label><input type="time" style={field} value={v.time} onChange={(e) => set("time", e.target.value)} /></div>
        </div>
        <label style={lbl}>Notificação</label>
        <select style={field} value={v.notify} onChange={(e) => set("notify", e.target.value)}>
          {["No horário do evento", "10 minutos antes", "30 minutos antes", "1 hora antes", "1 dia antes"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ minHeight: 52, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "10px 18px", flexWrap: "wrap" }}>
          <ImageMenu stageRef={bannerRef} name="click-to-calendar-banner" label="Baixar passo 1" />
          <ImageMenu stageRef={bothRef} name="click-to-calendar" label="Baixar os dois" primary />
          <ImageMenu stageRef={calRef} name="click-to-calendar-evento" label="Baixar passo 2" />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, minWidth: 0 }}>
        <div ref={bothRef} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 30, flexWrap: "wrap" }}>
          <div ref={bannerRef}>
            <div style={{ width: 280, background: "#c9ced4", borderRadius: 36, padding: 10, boxShadow: "0 18px 44px rgba(0,0,0,.18)" }}>
              <div style={{ background: "#fff", borderRadius: 28, overflow: "hidden", height: 540, display: "flex", flexDirection: "column" }}>
                <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 74, height: 6, background: "#d7dbdf", borderRadius: 99 }} /></div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 22, height: 22, background: "#e7eaed", borderRadius: 6 }} />
                    <div style={{ flex: 1, height: 8, background: "#e7eaed", borderRadius: 4 }} />
                    <div style={{ width: 22, height: 8, background: "#eef0f2", borderRadius: 4 }} />
                    <div style={{ width: 22, height: 8, background: "#eef0f2", borderRadius: 4 }} />
                  </div>
                  <div style={{ height: 64, background: "#eceef1", borderRadius: 8 }} />
                  <div style={{ height: 8, background: "#eceef1", borderRadius: 4 }} />
                  <div style={{ height: 8, background: "#eceef1", borderRadius: 4, width: "80%" }} />
                  <div style={{ width: "100%", aspectRatio: "300/250", background: media ? "#000" : "#f3f4f6", borderRadius: 8, overflow: "hidden", border: "1px dashed #cfd4d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {media ? <img src={media} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#9aa4ad", fontSize: 12 }}>criativo 300×250</span>}
                  </div>
                  <div style={{ height: 8, background: "#eceef1", borderRadius: 4 }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, height: 44, background: "#eceef1", borderRadius: 8 }} />
                    <div style={{ flex: 1, height: 44, background: "#eceef1", borderRadius: 8 }} />
                  </div>
                </div>
                <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 110, height: 5, background: "#d7dbdf", borderRadius: 99 }} /></div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: T.t3 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 600 }}>click</span>
        </div>

          <div ref={calRef}>
            <div style={{ width: 280, background: "#c9ced4", borderRadius: 36, padding: 10, boxShadow: "0 18px 44px rgba(0,0,0,.18)" }}>
              <div style={{ background: "#fff", borderRadius: 28, overflow: "hidden", height: 540, display: "flex", flexDirection: "column" }}>
                <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 74, height: 6, background: "#d7dbdf", borderRadius: 99 }} /></div>
                <div style={{ padding: "8px 16px 16px", color: "#202124", fontFamily: "Roboto, Urbanist, sans-serif", flex: 1 }}>
                  <div style={{ border: "1px solid #e6e9ec", borderRadius: 14, padding: "18px 18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{v.title || "Título do evento"}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 16, fontSize: 13.5, color: "#3c4043" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      <div><div>{dateLine}</div><div style={{ color: "#5f6368" }}>{(v.time || "--:--")} (GMT-03)</div></div>
                    </div>
                    <div style={{ marginTop: 14, fontSize: 13.5, color: "#3c4043", lineHeight: 1.4 }}>{v.desc}</div>
                    <button style={{ marginTop: 22, width: "100%", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "default", fontFamily: "inherit" }}>Add to Calendar</button>
                    <div style={{ display: "flex", gap: 10, marginTop: 18, fontSize: 13.5, color: "#3c4043" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                      Local do evento
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 12, fontSize: 13.5, color: "#3c4043" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /></svg>
                      Organizador
                    </div>
                  </div>
                </div>
                <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 110, height: 5, background: "#d7dbdf", borderRadius: 99 }} /></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Mockup Simples (compacto) — criativo num portal wireframe ===== */
function SimplesEditor() {
  const [media, setMedia] = useState(null);
  const [mediaKind, setMediaKind] = useState("image");
  const [size, setSize] = useState(SIZES[0]);
  const [device, setDevice] = useState("desktop");
  const shotRef = useRef(null);
  const upload = (e) => { const f = e.target.files?.[0]; if (!f) return; const kind = f.type.startsWith("video") ? "video" : "image"; const rd = new FileReader(); rd.onload = () => { setMedia(rd.result); setMediaKind(kind); }; rd.readAsDataURL(f); };
  const block = (h) => <div style={{ background: "#e6e9ec", borderRadius: 6, height: h }} />;
  const mediaEl = media
    ? (mediaKind === "video"
      ? <video src={media} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : <img src={media} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />)
    : <span style={{ color: "#9aa4ad", fontSize: 11 }}>{size.key}</span>;
  const slot = <div style={{ width: "100%", aspectRatio: `${size.w}/${size.h}`, background: media ? "#000" : "#eef0f2", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #dfe3e6" }}>{mediaEl}</div>;

  const desktop = (
    <div style={{ width: 460, background: "#fff", borderRadius: 10, boxShadow: "0 10px 34px rgba(0,0,0,.28)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #eef0f2" }}>
        <div style={{ width: 70, height: 16, background: "#c7ccd2", borderRadius: 4 }} />
        <div style={{ flex: 1 }} />
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 34, height: 8, background: "#dde1e4", borderRadius: 3 }} />)}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "#e6e9ec", borderRadius: 8, height: 150 }} />
        {block(10)}{block(10)}
        <div style={{ maxWidth: 300, margin: "6px auto" }}>{slot}</div>
        {block(10)}{block(10)}{block(10)}
      </div>
    </div>
  );
  const mobile = (
    <div style={{ width: 300, background: "#0e0e12", borderRadius: 34, padding: 10, boxShadow: "0 16px 40px rgba(0,0,0,.4)" }}>
      <div style={{ background: "#fff", borderRadius: 26, overflow: "hidden" }}>
        <div style={{ height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 70, height: 6, background: "#d3d7db", borderRadius: 99 }} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid #eef0f2" }}>
          <div style={{ width: 50, height: 12, background: "#c7ccd2", borderRadius: 4 }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 18, height: 12, background: "#dde1e4", borderRadius: 3 }} />
        </div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#e6e9ec", borderRadius: 8, height: 110 }} />
          {block(9)}{block(9)}
          <div style={{ margin: "4px auto", width: "100%" }}>{slot}</div>
          {block(9)}{block(9)}{block(9)}{block(9)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: 560 }}>
      <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${T.line}`, padding: 18 }}>
        <label style={lbl}>Criativo (imagem ou vídeo)</label>
        <label style={{ ...field, display: "block", textAlign: "center", cursor: "pointer", color: T.teal, borderStyle: "dashed" }}>{media ? "Trocar criativo" : "Subir imagem ou vídeo"}<input type="file" accept="image/*,video/*" onChange={upload} style={{ display: "none" }} /></label>
        <label style={lbl}>Formato</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{SIZES.map((s) => <button key={s.key} onClick={() => setSize(s)} style={chipStyle(s.key === size.key)}>{s.key}</button>)}</div>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 14, lineHeight: 1.5 }}>Portal genérico em wireframe; o anúncio entra na página no formato escolhido. Alterne entre desktop e mobile na prévia.</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 52, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setDevice("desktop")} style={chipStyle(device === "desktop")}>Desktop</button>
            <button onClick={() => setDevice("mobile")} style={chipStyle(device === "mobile")}>Mobile</button>
          </div>
          <DownloadMenu stageRef={shotRef} name="mockup-simples" animated={mediaKind === "video"} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, background: "transparent", overflow: "visible" }}>
          <div ref={shotRef}>{device === "desktop" ? desktop : mobile}</div>
        </div>
      </div>
    </div>
  );
}

/* ===== Home (grade) + roteador da aba ===== */
function chipStyle(on) { return { background: on ? "var(--teal-dim)" : "var(--bg-input)", border: `1px solid ${on ? T.teal : T.line}`, color: on ? T.teal : T.t2, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }; }
/* ===== Export (PNG/GIF) — html2canvas + gif.js via cdnjs sob demanda ===== */
function loadScriptOnce(src) {
  return new Promise((res, rej) => {
    if ([...document.scripts].some((s) => s.src === src)) return res();
    const s = document.createElement("script"); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("load " + src)); document.head.appendChild(s);
  });
}
async function ensureH2C() { if (!window.html2canvas) await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"); return window.html2canvas; }
async function ensureGIF() { if (!window.GIF) await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js"); return window.GIF; }
let _gifWorkerURL = null;
async function getGifWorkerURL() {
  if (_gifWorkerURL) return _gifWorkerURL;
  // O navegador bloqueia Worker de outra origem — baixamos o script e servimos via Blob same-origin.
  const res = await fetch("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js");
  if (!res.ok) throw new Error("worker fetch " + res.status);
  const txt = await res.text();
  _gifWorkerURL = URL.createObjectURL(new Blob([txt], { type: "application/javascript" }));
  return _gifWorkerURL;
}
function triggerDownload(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500); }
async function shotCanvas(el, mapRef, scale) {
  const h2c = await ensureH2C();
  const base = await h2c(el, { backgroundColor: null, useCORS: true, logging: false, scale: scale || 1 });
  if (mapRef && mapRef.current) {
    // html2canvas não captura WebGL — compõe o mapa por baixo dos overlays
    try {
      const mc = mapRef.current.getCanvas();
      const out = document.createElement("canvas"); out.width = base.width; out.height = base.height;
      const ctx = out.getContext("2d");
      ctx.drawImage(mc, 0, 0, out.width, out.height);
      ctx.drawImage(base, 0, 0);
      return out;
    } catch { return base; }
  }
  return base;
}
async function exportPNG(el, name, mapRef, renderScale = 2) { const c = await shotCanvas(el, mapRef, Math.min(4, renderScale)); await new Promise((r) => c.toBlob((b) => { triggerDownload(b, name + ".png"); r(); }, "image/png")); }
async function exportGIF(el, name, { seconds = 2.5, fps = 12, onProgress, mapRef, renderScale = 2 } = {}) {
  const GIF = await ensureGIF(); await ensureH2C();
  const workerScript = await getGifWorkerURL();
  // resolução alvo: renderScale relativo ao exibido, limitado pra não estourar o tamanho do GIF (~1000px de borda maior)
  let rs = Math.min(3.5, Math.max(1.5, renderScale));
  const longEdge = Math.max(el.offsetWidth, el.offsetHeight) * rs;
  if (longEdge > 1000) rs = rs * (1000 / longEdge);
  const w = Math.round(el.offsetWidth * rs), h = Math.round(el.offsetHeight * rs);
  const gif = new GIF({ workers: 2, quality: 1, dither: false, width: w, height: h, workerScript });
  const frames = Math.max(6, Math.round(seconds * fps)), delay = Math.round(1000 / fps);
  for (let i = 0; i < frames; i++) {
    const c = await shotCanvas(el, mapRef, rs);
    gif.addFrame(c, { delay, copy: true });
    onProgress && onProgress(((i + 1) / frames) * 0.7);
    await new Promise((r) => setTimeout(r, delay));
  }
  await new Promise((res, rej) => {
    gif.on("progress", (p) => onProgress && onProgress(0.7 + p * 0.3));
    gif.on("finished", (b) => { triggerDownload(b, name + ".gif"); res(); });
    gif.on("abort", () => rej(new Error("gif abort")));
    gif.render();
  });
}

function DownloadMenu({ stageRef, name, animated = false, mapRef = null, beforeGif, afterGif, gifSeconds = 2.5, gifFps = 12, renderScale = 2 }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [prog, setProg] = useState(0);
  const doPNG = async () => { if (!stageRef.current) return; setBusy("png"); setOpen(false); try { await exportPNG(stageRef.current, name, mapRef, Math.max(renderScale, 3)); } catch (e) { console.error("PNG export:", e); alert("Falha ao gerar PNG."); } setBusy(""); };
  const doGIF = async () => {
    if (!stageRef.current) return; setBusy("gif"); setProg(0); setOpen(false);
    try { await beforeGif?.(); await new Promise((r) => setTimeout(r, 350)); await exportGIF(stageRef.current, name, { seconds: gifSeconds, fps: gifFps, onProgress: setProg, mapRef, renderScale }); }
    catch (e) { console.error("GIF export:", e); alert("Falha ao gerar GIF. Detalhe no console (F12)."); }
    finally { await afterGif?.(); setBusy(""); }
  };
  const btn = { background: T.teal, border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: busy ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit", opacity: busy ? 0.8 : 1 };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} disabled={!!busy} style={btn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        {busy ? `Gerando ${busy.toUpperCase()} ${Math.round(prog * 100)}%` : "Baixar"}
      </button>
      {open && !busy && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, padding: 6, minWidth: 210, zIndex: 30, boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
          <button onClick={doPNG} style={menuItem}>PNG · imagem estática</button>
          {animated && <button onClick={doGIF} style={menuItem}>GIF · mostra o funcionamento</button>}
        </div>
      )}
    </div>
  );
}
const menuItem = { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", color: T.t1, borderRadius: 7, padding: "9px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

async function exportJPG(el, name, renderScale = 3) {
  const h2c = await ensureH2C();
  const c = await h2c(el, { backgroundColor: "#ffffff", useCORS: true, logging: false, scale: Math.min(4, renderScale) });
  await new Promise((r) => c.toBlob((b) => { triggerDownload(b, name + ".jpg"); r(); }, "image/jpeg", 0.92));
}
function JpgButton({ stageRef, name }) {
  const [busy, setBusy] = useState(false);
  const dl = async () => { if (!stageRef.current) return; setBusy(true); try { await exportJPG(stageRef.current, name, 3); } catch (e) { console.error("JPG export:", e); alert("Falha ao gerar JPG."); } setBusy(false); };
  return (
    <button onClick={dl} disabled={busy} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: `1px solid ${T.line}`, color: "var(--teal)", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer", fontFamily: "inherit" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
      {busy ? "Gerando…" : "Baixar JPG"}
    </button>
  );
}
function ImageMenu({ stageRef, name, label = "Baixar", primary = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const run = async (kind) => {
    if (!stageRef.current) return; setBusy(kind); setOpen(false);
    try { if (kind === "png") await exportPNG(stageRef.current, name, null, 3); else await exportJPG(stageRef.current, name, 3); }
    catch (e) { console.error("export " + kind + ":", e); alert("Falha ao gerar " + kind.toUpperCase() + "."); }
    setBusy("");
  };
  const b = { display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer", fontFamily: "inherit" };
  const style = primary ? { ...b, background: "var(--teal)", border: "none", color: "#fff" } : { ...b, background: "var(--bg-card)", border: `1px solid ${T.line}`, color: "var(--teal)" };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} disabled={!!busy} style={style}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        {busy ? `Gerando ${busy.toUpperCase()}…` : label}
      </button>
      {open && !busy && (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "calc(100% + 6px)", background: "var(--bg-card)", border: `1px solid ${T.line}`, borderRadius: 10, padding: 6, minWidth: 120, zIndex: 30, boxShadow: "0 12px 30px rgba(0,0,0,.25)" }}>
          <button onClick={() => run("png")} style={menuItem}>PNG</button>
          <button onClick={() => run("jpg")} style={menuItem}>JPG</button>
        </div>
      )}
    </div>
  );
}

const MOCKUPS = [
  { id: "scratch", title: "Tap to Scratch", desc: "Raspadinha que revela o criativo por baixo.", accent: "#7A5CFF", glyph: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>' },
  { id: "carousel", title: "Tap to Carousel", desc: "Slides que deslizam, com transições 3D.", accent: "#3397B9", glyph: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M19 8v8M22 10v4"/>' },
  { id: "map", title: "Tap to Map", desc: "Mapa interativo com pins das lojas.", accent: "#EF4444", glyph: '<path d="M9 20l-5 2V6l5-2 6 2 5-2v16l-5 2-6-2z"/><path d="M9 4v16M15 6v16"/>' },
  { id: "calendar", title: "Click to Calendar", desc: "Banner que adiciona um evento no Google Calendar.", accent: "#22A06B", glyph: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4M9 14l2 2 4-4"/>' },
  { id: "simples", title: "Mockup Simples", desc: "Criativo aplicado num portal genérico.", accent: "#E0A400", glyph: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/>' },
];
function Home({ onOpen }) {
  return (
    <div style={{ fontFamily: "Urbanist, system-ui, sans-serif" }}>
      <style>{`.mkgc{transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease}.mkgc:hover{transform:translateY(-5px);box-shadow:var(--sh-lg, 0 10px 26px rgba(0,0,0,.12));border-color:var(--teal)}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
        {MOCKUPS.map((m) => (
          <button key={m.id} className="mkgc" onClick={() => onOpen(m.id)}
            style={{ textAlign: "left", cursor: "pointer", background: "transparent", border: `1px solid ${T.line}`, borderRadius: 16, padding: 22, color: T.t1, fontFamily: "inherit" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bg3)", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={m.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: m.glyph }} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6 }}>{m.title}</div>
            <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.4, minHeight: 36 }}>{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MockupGenerator() {
  const [view, setView] = useState(null);
  const M = MOCKUPS.find((m) => m.id === view);
  const base = { fontFamily: "Urbanist, system-ui, sans-serif", color: T.t1 };
  if (!view) return <div style={{ ...base, padding: 4 }}><Home onOpen={setView} /></div>;
  return (
    <div style={{ ...base, background: T.navy, minHeight: 640, borderRadius: 14, overflow: "hidden", border: `1px solid ${T.line}` }}>
      <div style={{ height: 52, borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 12, padding: "0 18px" }}>
        <button onClick={() => setView(null)} style={{ background: "transparent", border: `1px solid ${T.line}`, color: T.t1, borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>Voltar
        </button>
        <b style={{ fontSize: 14, fontWeight: 800 }}>{M?.title}</b>
      </div>
      {view === "scratch" && <ScratchEditor />}
      {view === "carousel" && <CarouselEditor />}
      {view === "map" && <TapToMapEditor />}
      {view === "calendar" && <CalendarEditor />}
      {view === "simples" && <SimplesEditor />}
    </div>
  );
}
