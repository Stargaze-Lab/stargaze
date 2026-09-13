import { projects, sketches } from "./projects.generated.js";

const directions = {
  exhibition: "01 — exposição",
  instrument: "02 — instrumento",
  balanced: "03 — equilíbrio",
};

const directionButtons = [...document.querySelectorAll("[data-direction-button]")];
const directionViews = [...document.querySelectorAll("[data-direction-view]")];
const directionName = document.querySelector("#direction-name");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function setDirection(direction, updateHistory = true) {
  if (!directions[direction]) direction = "balanced";
  document.body.dataset.direction = direction;
  directionName.textContent = directions[direction];

  directionButtons.forEach((button) => {
    const selected = button.dataset.directionButton === direction;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  directionViews.forEach((view) => {
    view.hidden = view.dataset.directionView !== direction;
  });

  if (updateHistory) {
    const url = new URL(window.location.href);
    url.searchParams.set("direction", direction);
    history.replaceState({}, "", url);
  }

  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  window.scrollTo({ top: 0, behavior: "auto" });
}

directionButtons.forEach((button, index) => {
  button.addEventListener("click", () => setDirection(button.dataset.directionButton));
  button.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = directionButtons[(index + step + directionButtons.length) % directionButtons.length];
    setDirection(next.dataset.directionButton);
    next.focus();
  });
});

function buildNetwork(container) {
  if (container.dataset.built) return;
  container.dataset.built = "true";
  const nodeCount = container.closest(".exhibition-feature") ? 38 : 28;
  for (let index = 0; index < nodeCount; index += 1) {
    const node = document.createElement("i");
    node.style.setProperty("--x", `${8 + ((index * 37) % 84)}%`);
    node.style.setProperty("--y", `${7 + ((index * 53) % 82)}%`);
    node.style.setProperty("--size", `${3 + ((index * 11) % 9)}px`);
    container.append(node);
  }
  for (let index = 0; index < nodeCount + 8; index += 1) {
    const line = document.createElement("b");
    line.style.setProperty("--x", `${10 + ((index * 31) % 78)}%`);
    line.style.setProperty("--y", `${10 + ((index * 47) % 76)}%`);
    line.style.setProperty("--length", `${40 + ((index * 17) % 120)}px`);
    line.style.setProperty("--angle", `${(index * 43) % 360}deg`);
    line.style.setProperty("--alpha", `${0.08 + ((index * 7) % 18) / 100}`);
    container.append(line);
  }
}

function buildSequencer(container) {
  if (container.dataset.built) return;
  container.dataset.built = "true";
  const positions = [[14, 62, 13], [23, 34, 8], [34, 77, 10], [42, 24, 14], [58, 51, 9], [68, 19, 7], [74, 70, 15], [88, 40, 9]];
  positions.forEach(([x, y, size]) => {
    const note = document.createElement("i");
    note.style.setProperty("--x", `${x}%`);
    note.style.setProperty("--y", `${y}%`);
    note.style.setProperty("--size", `${size}px`);
    container.append(note);
  });
}

document.querySelectorAll(".art-network").forEach(buildNetwork);
document.querySelectorAll(".art-sequencer").forEach(buildSequencer);

const entries = new Map([...projects, ...sketches].map((entry) => [entry.slug, entry]));
const instrumentOrder = ["wikiverso", "celeste", "colony-globe", "music-box"];
const instrumentFallbacks = {
  wikiverso: "https://stargaze.glitchme.art/wikiverso/",
  celeste: "../celeste/",
  "colony-globe": "https://stargaze.glitchme.art/colony/",
  "music-box": "../#lab",
};
const instrumentWorkbench = document.querySelector(".instrument-workbench");

function resolveEntryHref(entry) {
  if (!entry?.href) return instrumentFallbacks[entry?.slug] || "../";
  if (/^https?:/.test(entry.href)) return entry.href;
  return `../${entry.href.replace(/^\.\//, "")}`;
}

function setInstrumentEntry(slug) {
  const entry = entries.get(slug);
  if (!entry || !instrumentWorkbench) return;
  const position = instrumentOrder.indexOf(slug);
  instrumentWorkbench.dataset.activeEntry = slug;
  document.querySelector("#instrument-counter").textContent = `${String(position + 1).padStart(2, "0")} / ${String(instrumentOrder.length).padStart(2, "0")}`;
  document.querySelector("#instrument-eyebrow").textContent = entry.eyebrow;
  document.querySelector("#instrument-project-title").textContent = entry.title;
  document.querySelector("#instrument-summary").textContent = entry.summary;
  document.querySelector("#instrument-link").href = resolveEntryHref(entry);
  document.querySelectorAll("[data-instrument-entry]").forEach((button) => button.classList.toggle("active", button.dataset.instrumentEntry === slug));
}

document.querySelectorAll("[data-instrument-entry]").forEach((button) => {
  button.addEventListener("click", () => setInstrumentEntry(button.dataset.instrumentEntry));
});

document.querySelectorAll(".instrument-mode button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".instrument-mode button").forEach((item) => item.classList.toggle("active", item === button));
  });
});

function parseColor(color) {
  if (color.startsWith("#")) {
    const value = color.slice(1);
    const hex = value.length === 3 ? value.split("").map((character) => character + character).join("") : value;
    return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  }
  return color.match(/[\d.]+/g)?.map(Number).slice(0, 3) || [231, 189, 109];
}

function mountSignalField(stage) {
  const canvas = stage.querySelector("canvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const pointer = { x: 0, y: 0, active: false, energy: 0 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let particles = [];

  function seed() {
    const count = width < 640 ? 42 : Math.min(92, Math.max(56, Math.round(width / 19)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: width * (.05 + ((index * 47) % 91) / 100),
      y: height * (.05 + ((index * 67) % 91) / 100),
      vx: (((index * 19) % 20) - 10) / 90,
      vy: (((index * 31) % 20) - 10) / 90,
      r: 1 + ((index * 13) % 17) / 12,
      phase: index * .63,
    }));
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (reducedMotion) draw(performance.now());
  }

  function move(event) {
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.energy = Math.min(1, pointer.energy + Math.hypot(x - pointer.x, y - pointer.y) / 110);
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  }

  function draw(time = 0) {
    if (!width || !height) {
      if (!reducedMotion) frame = requestAnimationFrame(draw);
      return;
    }
    context.clearRect(0, 0, width, height);
    const direction = document.body.dataset.direction;
    const accent = parseColor(getComputedStyle(document.body).getPropertyValue("--accent").trim());
    const ink = direction === "exhibition" ? [24, 23, 19] : [242, 240, 234];
    const connectionDistance = direction === "instrument" ? 112 : 86;

    particles.forEach((particle, index) => {
      if (!reducedMotion) {
        particle.vx += Math.sin(time * .00035 + particle.phase) * .0015;
        particle.vy += Math.cos(time * .00028 + particle.phase) * .0015;
        if (pointer.active) {
          const dx = pointer.x - particle.x;
          const dy = pointer.y - particle.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          if (distance < 190) {
            const force = (190 - distance) / 190;
            particle.vx -= dx / distance * force * (.026 + pointer.energy * .05);
            particle.vy -= dy / distance * force * (.026 + pointer.energy * .05);
          }
        }
        particle.vx *= .992;
        particle.vy *= .992;
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;
      }

      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next];
        const distance = Math.hypot(other.x - particle.x, other.y - particle.y);
        if (distance >= connectionDistance) continue;
        const alpha = (1 - distance / connectionDistance) * (direction === "exhibition" ? .12 : .16);
        context.strokeStyle = `rgba(${accent.join(",")},${alpha})`;
        context.lineWidth = .7;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }

      const highlighted = index % 11 === 0;
      context.fillStyle = highlighted ? `rgba(${accent.join(",")},.82)` : `rgba(${ink.join(",")},${direction === "exhibition" ? .34 : .28})`;
      context.beginPath();
      context.arc(particle.x, particle.y, highlighted ? particle.r + 1 : particle.r, 0, Math.PI * 2);
      context.fill();
    });

    pointer.energy *= .95;
    if (!reducedMotion) frame = requestAnimationFrame(draw);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerleave", () => { pointer.active = false; });
  resize();
  draw(performance.now());

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  }, { once: true });
}

document.querySelectorAll("[data-signal-field]").forEach(mountSignalField);

const initialDirection = new URL(window.location.href).searchParams.get("direction") || "balanced";
setDirection(initialDirection, false);
