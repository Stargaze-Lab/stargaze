import { projects, sketches } from "./projects.generated.js";

const sketchModules = import.meta.glob("./sketches/*.js");

const colors = { amber: "#e7bd6d", violet: "#b096e8", blue: "#65a6df", sage: "#a6b575", aqua: "#60c9bc" };
const flockPalette = [colors.amber, colors.violet, colors.blue, colors.aqua, colors.sage];
const grid = document.querySelector("#project-grid");
const index = document.querySelector("#project-index");
const lab = document.querySelector("#lab-grid");
const overlay = document.querySelector("#project-overlay");
const entries = new Map([...projects, ...sketches].map((entry) => [entry.slug, entry]));
let activeSlug = null;
let activeTrigger = null;
let cleanupSketch = null;
let sketchLoadToken = 0;
const previewCleanups = [];

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const arrow = `<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h11M10 4l5 5-5 5"/></svg>`;

function visualMarkup(entry, large = false) {
  const coordinate = escapeHtml(entry.slug.replaceAll("-", " / "));
  if (entry.sketch === "orbit") return `<div class="project-visual visual-orbit ${large ? "is-large" : ""}"><canvas class="orbit-canvas" data-orbit="${large ? "large" : "card"}"></canvas></div>`;
  if (entry.kind === "sketch" && entry.sketch) {
    if (large) return `<div class="project-visual visual-live-sketch is-large" data-sketch-stage="${escapeHtml(entry.sketch)}"><p class="sketch-loading">Loading experiment…</p></div>`;
    const isConceptualPreview = entry.sketch === "music-box";
    return `<div class="project-visual visual-live-sketch ${isConceptualPreview ? "is-conceptual" : ""}"><canvas class="sketch-preview" data-sketch-preview="${escapeHtml(entry.sketch)}" aria-hidden="true"></canvas>${isConceptualPreview ? "" : `<div class="visual-grid"></div><span class="visual-coordinate">${coordinate}</span>`}</div>`;
  }
  let content = "";
  if (entry.visual === "network") content = `<div class="network-nodes">${"<i></i>".repeat(12)}</div>`;
  if (entry.visual === "wave") content = `<div class="wave-lines">${"<i></i>".repeat(7)}</div>`;
  if (entry.visual === "threads") content = `<div class="thread-rings">${"<i></i>".repeat(5)}</div>`;
  if (entry.visual === "field") content = `<div class="data-field">${"<i></i>".repeat(48)}</div>`;
  if (entry.visual === "migration-globe") content = `<div class="migration-scene" aria-hidden="true">
    <div class="migration-globe">
      <div class="globe-grid globe-grid-longitude">${"<i></i>".repeat(4)}</div>
      <div class="globe-grid globe-grid-latitude">${"<i></i>".repeat(3)}</div>
      <div class="globe-axis"></div>
    </div>
    <div class="migration-routes">${"<i><b></b></i>".repeat(5)}</div>
    <div class="migration-points">${"<i></i>".repeat(9)}</div>
  </div>`;
  if (entry.visual === "pattern") content = `<div class="pattern-preview">${"<i></i>".repeat(42)}</div><div class="mini-controls"><span></span><span></span><span></span></div>`;
  if (entry.visual === "poster") content = `<div class="poster-preview"><b>SG—${String(entry.order || 2).padStart(2, "0")}</b><span>GENERATIVE<br>POSTER<br>SYSTEM</span><i></i></div><div class="mini-controls"><span></span><span></span><span></span></div>`;
  if (entry.visual === "glyph") content = `<div class="glyph-preview">${"<i></i>".repeat(24)}</div><div class="mini-controls"><span></span><span></span></div>`;
  return `<div class="project-visual visual-${escapeHtml(entry.visual)} ${large ? "is-large" : ""}"><div class="visual-grid"></div>${content}<span class="visual-coordinate">${coordinate}</span></div>`;
}

function projectCardMarkup(project, position) {
  return `<button class="project-card span-${escapeHtml(project.span)}" data-entry="${escapeHtml(project.slug)}" data-accent="${escapeHtml(project.accent)}" style="--card-accent:${colors[project.accent] || colors.amber}" aria-label="Open ${escapeHtml(project.title)}">
    ${visualMarkup(project)}
    <span class="card-topline"><span>${String(position + 1).padStart(2, "0")}</span><span>↗ case</span></span>
    <span class="card-copy"><span class="card-eyebrow">${escapeHtml(project.eyebrow)}</span><strong>${escapeHtml(project.title)}</strong><span class="card-summary">${escapeHtml(project.summary)}</span></span>
    <span class="card-open">view ${arrow}</span>
  </button>`;
}

function sketchCardMarkup(sketch, position) {
  const isLive = sketch.status === "live";
  return `<button class="lab-card ${isLive ? "is-live" : "is-planned"}" data-entry="${escapeHtml(sketch.slug)}" data-accent="${escapeHtml(sketch.accent)}" style="--card-accent:${colors[sketch.accent] || colors.amber}" aria-label="Open ${escapeHtml(sketch.title)}">
    <span class="lab-visual">${visualMarkup(sketch)}</span>
    <span class="lab-meta"><span>${String(position + 1).padStart(2, "0")}</span><span class="lab-status">${isLive ? "● live now" : "○ in development"}</span></span>
    <span class="lab-copy"><span class="card-eyebrow">${escapeHtml(sketch.eyebrow)}</span><strong>${escapeHtml(sketch.title)}</strong><span>${escapeHtml(sketch.summary)}</span></span>
    <span class="lab-controls">${(sketch.controls || []).map((control) => `<i>${escapeHtml(control)}</i>`).join("")}</span>
  </button>`;
}

function render() {
  grid.innerHTML = projects.map(projectCardMarkup).join("") + `<div class="signal-card" aria-hidden="true"><i></i><i></i><i></i><i></i><span>more signals<br>incoming</span></div>`;
  lab.innerHTML = sketches.map(sketchCardMarkup).join("");
  index.innerHTML = `<div class="index-labels"><span>No.</span><span>Project</span><span>Kind</span><span>Year</span></div>` + projects.map((project, position) => `<button data-entry="${escapeHtml(project.slug)}" data-accent="${escapeHtml(project.accent)}"><span>${String(position + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(project.title)}</strong><small>${project.tools.map(escapeHtml).join(" · ")}</small></span><span>↗ case study</span><span>${project.date.slice(0, 4)}</span></button>`).join("");
  document.querySelector("#project-count").textContent = `${projects.length} cases · 2025—26`;
  document.querySelector("#sketch-count").textContent = `${sketches.filter((item) => item.status === "live").length} live · ${sketches.filter((item) => item.status !== "live").length} in development`;
  bindEntryTriggers();
  document.querySelectorAll('[data-orbit="card"]').forEach((canvas) => mountOrbit(canvas, false));
  mountSketchPreviews();
}

function sketchLoader(name) {
  return sketchModules[`./sketches/${name}.js`];
}

function mountSketchPreviews() {
  document.querySelectorAll("[data-sketch-preview]").forEach(async (canvas) => {
    const loader = sketchLoader(canvas.dataset.sketchPreview);
    if (!loader) return;
    try {
      const module = await loader();
      if (!canvas.isConnected || typeof module.mountPreview !== "function") return;
      const cleanup = module.mountPreview(canvas);
      if (typeof cleanup === "function") previewCleanups.push(cleanup);
    } catch (error) {
      console.error(`Could not load preview for ${canvas.dataset.sketchPreview}.`, error);
    }
  });
}

async function mountInlineSketch(entry, token) {
  const stage = document.querySelector(`[data-sketch-stage="${CSS.escape(entry.sketch)}"]`);
  const loader = sketchLoader(entry.sketch);
  if (!stage || !loader) {
    if (stage) stage.innerHTML = `<p class="sketch-error">Experiment module not found.</p>`;
    return;
  }

  try {
    const module = await loader();
    if (token !== sketchLoadToken || activeSlug !== entry.slug) return;
    stage.replaceChildren();

    let mountedCleanup = null;
    if (typeof module.default === "function") {
      mountedCleanup = await module.default(stage);
    } else if (typeof module.mount === "function") {
      const instance = module.mount(stage);
      mountedCleanup = typeof module.cleanup === "function"
        ? module.cleanup
        : (typeof instance?.destroy === "function" ? () => instance.destroy() : null);
    }

    if (token !== sketchLoadToken || activeSlug !== entry.slug) {
      mountedCleanup?.();
      return;
    }
    cleanupSketch = typeof mountedCleanup === "function" ? mountedCleanup : null;
  } catch (error) {
    console.error(`Could not load sketch ${entry.sketch}.`, error);
    if (token === sketchLoadToken && activeSlug === entry.slug) {
      stage.innerHTML = `<p class="sketch-error">The experiment could not start. Reload the page and try again.</p>`;
    }
  }
}

function bindEntryTriggers() {
  document.querySelectorAll("[data-entry]").forEach((element) => {
    element.addEventListener("click", () => openEntry(element.dataset.entry, element));
    element.addEventListener("pointerenter", () => setAccent(element.dataset.accent));
    element.addEventListener("pointerleave", () => { if (activeSlug === null) resetAccent(); });
    element.addEventListener("focus", () => setAccent(element.dataset.accent));
    element.addEventListener("blur", () => { if (activeSlug === null) resetAccent(); });
  });
}

function setAccent(nameOrColor) {
  document.documentElement.style.setProperty("--accent", colors[nameOrColor] || nameOrColor || colors.amber);
}
function resetAccent() { document.documentElement.style.removeProperty("--accent"); }

function openEntry(slug, trigger = activeTrigger) {
  const entry = entries.get(slug);
  if (!entry) return;
  sketchLoadToken += 1;
  const loadToken = sketchLoadToken;
  activeSlug = slug;
  activeTrigger = trigger;
  setAccent(entry.accent);
  cleanupSketch?.();
  cleanupSketch = null;
  document.querySelector("#stage-art").innerHTML = visualMarkup(entry, true);
  const collection = entry.kind === "sketch" ? sketches : projects;
  const position = collection.findIndex((item) => item.slug === slug);
  document.querySelector("#stage-counter").textContent = `${entry.kind === "sketch" ? "LAB" : "CASE"} · ${String(position + 1).padStart(2, "0")} / ${String(collection.length).padStart(2, "0")}`;
  document.querySelector("#sheet-eyebrow").textContent = entry.eyebrow;
  document.querySelector("#sheet-title").textContent = entry.title;
  document.querySelector("#sheet-summary").textContent = entry.summary;
  document.querySelector("#sheet-description").textContent = entry.description;
  document.querySelector("#sheet-tools").innerHTML = entry.tools.map((tool) => `<span>${escapeHtml(tool)}</span>`).join("");
  document.querySelector("#sheet-year").textContent = entry.date.slice(0, 4);
  document.querySelector("#sheet-format").textContent = entry.kind === "sketch" ? (entry.status === "live" ? "Interactive browser tool" : "Planned live tool") : "Interactive case study";
  if (entry.href) {
    document.querySelector("#sheet-action").innerHTML = `<a class="project-cta" href="${escapeHtml(entry.href)}" target="_blank" rel="noreferrer">Open project ${arrow}</a>`;
  } else if (entry.status === "planned") {
    document.querySelector("#sheet-action").innerHTML = `<p class="planned-note"><i></i> Planned controls · ${(entry.controls || []).map(escapeHtml).join(" / ")}</p>`;
  } else {
    document.querySelector("#sheet-action").innerHTML = `<p class="live-note"><i></i> ${escapeHtml(entry.instructions || "Move your pointer across the experiment")}</p>`;
  }
  overlay.classList.add("open");
  overlay.dataset.liveSketch = entry.kind === "sketch" && Boolean(entry.sketch) ? "true" : "false";
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (entry.sketch === "orbit") cleanupSketch = mountOrbit(document.querySelector('[data-orbit="large"]'), true);
  else if (entry.kind === "sketch" && entry.sketch) mountInlineSketch(entry, loadToken);
  overlay.querySelector('[data-action="close"]').focus();
}

function closeEntry() {
  if (activeSlug === null) return;
  sketchLoadToken += 1;
  cleanupSketch?.();
  cleanupSketch = null;
  overlay.classList.remove("open");
  delete overlay.dataset.liveSketch;
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  activeSlug = null;
  resetAccent();
  activeTrigger?.focus();
  activeTrigger = null;
}

function step(direction) {
  if (activeSlug === null) return;
  const entry = entries.get(activeSlug);
  const collection = entry.kind === "sketch" ? sketches : projects;
  const index = collection.findIndex((item) => item.slug === activeSlug);
  openEntry(collection[(index + direction + collection.length) % collection.length].slug, activeTrigger);
}

function hexToRgb(hex) { const value = Number.parseInt(hex.slice(1), 16); return [(value >> 16) & 255, (value >> 8) & 255, value & 255]; }
function mixPalette(amount) {
  const scaled = Math.max(0, Math.min(.999, amount)) * (flockPalette.length - 1);
  const start = Math.floor(scaled); const mix = scaled - start;
  const a = hexToRgb(flockPalette[start]); const b = hexToRgb(flockPalette[Math.min(start + 1, flockPalette.length - 1)]);
  return `rgb(${a.map((value, i) => Math.round(value + (b[i] - value) * mix)).join(",")})`;
}

function mountFlock(canvas) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const parent = canvas.parentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0, frame = 0, running = true;
  const pointer = { x: 0, y: 0, active: false, energy: 0 };
  let birds = [];
  const seedBirds = () => {
    const count = width < 700 ? 48 : Math.min(96, Math.max(68, Math.round(width / 18)));
    birds = Array.from({ length: count }, (_, i) => ({ x: width * (.18 + ((i * 47) % 100) / 125), y: height * (.12 + ((i * 31) % 100) / 130), vx: .45 + ((i * 17) % 30) / 45, vy: ((i * 29) % 20) / 28 - .35, phase: i * .73 }));
  };
  const resize = () => {
    const rect = parent.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height; canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(dpr, 0, 0, dpr, 0, 0); seedBirds();
  };
  const move = (event) => {
    const rect = canvas.getBoundingClientRect(); const nextX = event.clientX - rect.left; const nextY = event.clientY - rect.top;
    pointer.energy = Math.min(1, pointer.energy + Math.hypot(nextX - pointer.x, nextY - pointer.y) / 80);
    pointer.x = nextX; pointer.y = nextY; pointer.active = true;
    setAccent(mixPalette(pointer.x / Math.max(width, 1)));
  };
  const leave = () => { pointer.active = false; };
  const drawBird = (bird, accent, time) => {
    const angle = Math.atan2(bird.vy, bird.vx); const size = 3.8 + Math.min(4, Math.hypot(bird.vx, bird.vy) * 1.4); const wing = Math.sin(time * .006 + bird.phase) * 2.2;
    context.save(); context.translate(bird.x, bird.y); context.rotate(angle); context.strokeStyle = accent; context.globalAlpha = .35 + Math.min(.5, Math.hypot(bird.vx, bird.vy) * .18); context.lineWidth = 1.1; context.lineCap = "round";
    context.beginPath(); context.moveTo(-size, -wing); context.quadraticCurveTo(-size * .25, 0, 0, 0); context.quadraticCurveTo(size * .25, 0, size, wing); context.stroke(); context.restore();
  };
  const draw = (time = 0) => {
    if (!running || document.hidden) return;
    context.clearRect(0, 0, width, height);
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || colors.amber;
    if (!reducedMotion) birds.forEach((bird, index) => {
      let alignX = 0, alignY = 0, centerX = 0, centerY = 0, separateX = 0, separateY = 0, neighbors = 0;
      birds.forEach((other, otherIndex) => {
        if (index === otherIndex) return;
        const dx = other.x - bird.x; const dy = other.y - bird.y; const distance = Math.hypot(dx, dy);
        if (distance < 78) { alignX += other.vx; alignY += other.vy; centerX += other.x; centerY += other.y; neighbors += 1; }
        if (distance > 0 && distance < 23) { separateX -= dx / distance; separateY -= dy / distance; }
      });
      if (neighbors) {
        bird.vx += ((alignX / neighbors - bird.vx) * .014) + ((centerX / neighbors - bird.x) * .00022) + separateX * .035;
        bird.vy += ((alignY / neighbors - bird.vy) * .014) + ((centerY / neighbors - bird.y) * .00022) + separateY * .035;
      }
      if (pointer.active) {
        const dx = pointer.x - bird.x; const dy = pointer.y - bird.y; const distance = Math.max(1, Math.hypot(dx, dy));
        if (distance < 240) { bird.vx += dx / distance * .018; bird.vy += dy / distance * .018; }
        if (distance < 72) { bird.vx -= dx / distance * .11; bird.vy -= dy / distance * .11; }
      }
      bird.vx += Math.sin(time * .00035 + bird.phase) * .0025;
      bird.vy += Math.cos(time * .00028 + bird.phase) * .002;
      const speed = Math.hypot(bird.vx, bird.vy); const maxSpeed = 1.9 + pointer.energy * 1.7;
      if (speed > maxSpeed) { bird.vx = bird.vx / speed * maxSpeed; bird.vy = bird.vy / speed * maxSpeed; }
      bird.x += bird.vx; bird.y += bird.vy;
      if (bird.x < -18) bird.x = width + 18; if (bird.x > width + 18) bird.x = -18;
      if (bird.y < -18) bird.y = height + 18; if (bird.y > height + 18) bird.y = -18;
    });
    pointer.energy *= .97;
    birds.forEach((bird) => drawBird(bird, accent, time));
    if (!reducedMotion) frame = requestAnimationFrame(draw);
  };
  const observer = new ResizeObserver(() => { resize(); if (reducedMotion) draw(performance.now()); }); observer.observe(parent); resize(); draw(performance.now());
  canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && running && !reducedMotion) draw(performance.now()); else cancelAnimationFrame(frame); });
}

function mountOrbit(canvas, expanded) {
  if (!canvas) return () => {};
  const context = canvas.getContext("2d"); const parent = canvas.parentElement;
  let width = 0, height = 0, frame = 0, time = 0, running = true;
  const pointer = { x: .5, y: .5, active: false }; const count = expanded ? 180 : 78;
  const particles = Array.from({ length: count }, (_, n) => ({ phase: n / count * Math.PI * 2, radius: .16 + (n * 37 % 100) / 360, speed: .18 + (n * 19 % 80) / 260, tilt: (n * 13 % 70) / 100 - .35 }));
  const resize = () => { const rect = parent.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2); width = rect.width; height = rect.height; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const move = (event) => { const rect = canvas.getBoundingClientRect(); pointer.x = (event.clientX - rect.left) / rect.width; pointer.y = (event.clientY - rect.top) / rect.height; pointer.active = true; };
  const draw = () => {
    if (!running || document.hidden) return; time += .008; context.clearRect(0, 0, width, height);
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || colors.amber;
    const cx = width * (pointer.active ? .46 + pointer.x * .08 : .5); const cy = height * (pointer.active ? .46 + pointer.y * .08 : .5); const size = Math.min(width, height);
    context.globalCompositeOperation = "lighter";
    particles.forEach((particle) => { const angle = particle.phase + time * particle.speed * 8; const rx = size * particle.radius; const ry = rx * (.26 + particle.tilt * .26); const x = cx + Math.cos(angle) * rx; const y = cy + Math.sin(angle) * ry + Math.cos(angle * .7) * size * particle.tilt * .08; const tailX = cx + Math.cos(angle - .055) * rx; const tailY = cy + Math.sin(angle - .055) * ry + Math.cos((angle - .055) * .7) * size * particle.tilt * .08; context.globalAlpha = .28 + particle.phase % 1 * .5; context.strokeStyle = accent; context.lineWidth = expanded ? 1.35 : 1; context.beginPath(); context.moveTo(tailX, tailY); context.lineTo(x, y); context.stroke(); });
    context.globalAlpha = .75; const glow = context.createRadialGradient(cx, cy, 0, cx, cy, size * .12); glow.addColorStop(0, accent); glow.addColorStop(1, "transparent"); context.fillStyle = glow; context.beginPath(); context.arc(cx, cy, size * .12, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1; context.globalCompositeOperation = "source-over";
    frame = requestAnimationFrame(draw);
  };
  const observer = new ResizeObserver(resize); observer.observe(parent); resize(); draw();
  canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", () => { pointer.active = false; });
  const visibility = () => { if (!document.hidden && running) draw(); else cancelAnimationFrame(frame); }; document.addEventListener("visibilitychange", visibility);
  return () => { running = false; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener("pointermove", move); document.removeEventListener("visibilitychange", visibility); };
}

document.querySelectorAll(".view-switch button").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".view-switch button").forEach((item) => item.classList.toggle("active", item === button));
  const showGrid = button.dataset.view === "grid"; grid.hidden = !showGrid; index.hidden = showGrid;
}));
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => { if (button.dataset.action === "close") closeEntry(); if (button.dataset.action === "previous") step(-1); if (button.dataset.action === "next") step(1); }));
overlay.addEventListener("pointerdown", (event) => { if (event.target === overlay) closeEntry(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeEntry(); if (activeSlug !== null && event.key === "ArrowRight") step(1); if (activeSlug !== null && event.key === "ArrowLeft") step(-1); });
document.querySelector("#current-year").textContent = new Date().getFullYear();
render();
mountFlock(document.querySelector("#hero-flock"));
