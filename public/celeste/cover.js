const TAU = Math.PI * 2;
const INK = "#070b18";
const GOLD = "231, 189, 109";

function rgba(alpha) {
  return `rgba(${GOLD}, ${alpha})`;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStarField() {
  const random = seededRandom(260825);
  return Array.from({ length: 72 }, (_, index) => ({
    x: random(),
    y: random(),
    radius: index % 19 === 0 ? 1.75 : 0.45 + random() * 0.8,
    alpha: 0.18 + random() * 0.42,
    phase: random() * TAU,
  }));
}

const constellations = [
  [
    [0.08, 0.61], [0.23, 0.48], [0.35, 0.54], [0.47, 0.38],
    [0.61, 0.46], [0.75, 0.3], [0.9, 0.39],
  ],
  [
    [0.18, 0.24], [0.31, 0.31], [0.43, 0.21], [0.56, 0.28],
    [0.67, 0.17], [0.82, 0.22],
  ],
];

function ellipsePoint(centerX, centerY, radiusX, radiusY, angle, tilt = 0) {
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  return { x: centerX + x * cos - y * sin, y: centerY + x * sin + y * cos };
}

function strokeEllipse(context, options) {
  const {
    centerX, centerY, radiusX, radiusY, tilt = 0,
    alpha = 0.2, width = 1, dash = [], start = 0, end = TAU,
  } = options;
  context.save();
  context.strokeStyle = rgba(alpha);
  context.lineWidth = width;
  context.setLineDash(dash);
  context.beginPath();
  const steps = Math.max(48, Math.ceil(Math.abs(end - start) * 30));
  for (let index = 0; index <= steps; index += 1) {
    const angle = start + ((end - start) * index) / steps;
    const point = ellipsePoint(centerX, centerY, radiusX, radiusY, angle, tilt);
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  }
  context.stroke();
  context.restore();
}

function drawFourPointStar(context, x, y, radius, alpha) {
  context.save();
  context.translate(x, y);
  context.fillStyle = rgba(alpha);
  context.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 4;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.18;
    const px = Math.cos(angle) * pointRadius;
    const py = Math.sin(angle) * pointRadius;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function drawConstellation(context, points, bounds, phase, still) {
  const projected = points.map(([x, y], index) => ({
    x: bounds.x + x * bounds.width,
    y: bounds.y + y * bounds.height + Math.sin(phase * 0.34 + index) * bounds.height * 0.008,
  }));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = rgba(0.42);
  context.lineWidth = Math.max(0.8, bounds.width / 680);
  context.beginPath();
  projected.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.stroke();

  projected.forEach((point, index) => {
    const pulse = still ? 1 : 0.88 + Math.sin(phase * 0.7 + index * 0.91) * 0.12;
    if (index % 3 === 0) {
      drawFourPointStar(context, point.x, point.y, (2.8 + (index % 2)) * pulse, 0.82);
    } else {
      context.beginPath();
      context.fillStyle = rgba(0.74);
      context.arc(point.x, point.y, 1.25 * pulse, 0, TAU);
      context.fill();
    }
  });
  context.restore();
}

export function mountCover(container) {
  if (!container) return () => {};

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
  container.replaceChildren(canvas);

  const context = canvas.getContext("2d", { alpha: true });
  const stars = buildStarField();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 1;
  let height = 1;
  let frame = 0;
  let visible = true;
  let destroyed = false;

  function resize() {
    const bounds = container.getBoundingClientRect();
    const density = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    draw(performance.now(), false);
  }

  function draw(time, schedule = true) {
    if (destroyed) return;
    context.clearRect(0, 0, width, height);

    pointer.x += (pointer.targetX - pointer.x) * 0.028;
    pointer.y += (pointer.targetY - pointer.y) * 0.028;
    const still = reducedMotion.matches;
    const seconds = still ? 0 : time * 0.001;
    const parallaxX = pointer.x * width * 0.022;
    const parallaxY = pointer.y * height * 0.022;
    const centerX = width * 0.58 + parallaxX * 0.28;
    const centerY = height * 0.51 + parallaxY * 0.28;
    const sphereRadius = Math.max(width * 0.53, height * 0.77);

    context.fillStyle = INK;
    context.fillRect(0, 0, width, height);

    const aura = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, sphereRadius);
    aura.addColorStop(0, rgba(0.075));
    aura.addColorStop(0.64, rgba(0.032));
    aura.addColorStop(1, rgba(0));
    context.fillStyle = aura;
    context.fillRect(0, 0, width, height);

    // Celestial sphere: one gold ink, articulated only by alpha and line weight.
    strokeEllipse(context, {
      centerX, centerY, radiusX: sphereRadius, radiusY: sphereRadius * 0.78,
      tilt: -0.05, alpha: 0.34, width: 1.15,
    });

    [-0.68, -0.36, 0, 0.36, 0.68].forEach((latitude, index) => {
      const latitudeScale = Math.sqrt(1 - latitude * latitude);
      strokeEllipse(context, {
        centerX,
        centerY: centerY + latitude * sphereRadius * 0.61,
        radiusX: sphereRadius * latitudeScale,
        radiusY: sphereRadius * (0.105 + latitudeScale * 0.03),
        tilt: -0.05,
        alpha: index === 2 ? 0.24 : 0.13,
        width: index === 2 ? 1.05 : 0.75,
      });
    });

    for (let index = 0; index < 9; index += 1) {
      strokeEllipse(context, {
        centerX,
        centerY,
        radiusX: sphereRadius * (0.1 + index * 0.003),
        radiusY: sphereRadius * 0.78,
        tilt: (index / 9) * Math.PI - 0.05,
        alpha: index % 3 === 0 ? 0.15 : 0.095,
        width: 0.75,
      });
    }

    // Ecliptic and two slowly drifting observational trajectories.
    strokeEllipse(context, {
      centerX,
      centerY,
      radiusX: sphereRadius * 0.96,
      radiusY: sphereRadius * 0.31,
      tilt: -0.23,
      alpha: 0.55,
      width: 1.25,
    });
    strokeEllipse(context, {
      centerX,
      centerY,
      radiusX: sphereRadius * 0.9,
      radiusY: sphereRadius * 0.255,
      tilt: -0.23,
      alpha: 0.22,
      width: 0.9,
      dash: [2, 7],
    });

    [0, Math.PI].forEach((offset, index) => {
      const progress = (seconds * (0.035 + index * 0.008) + offset) % TAU;
      strokeEllipse(context, {
        centerX,
        centerY,
        radiusX: sphereRadius * (0.7 + index * 0.12),
        radiusY: sphereRadius * (0.2 + index * 0.035),
        tilt: -0.5 + index * 0.7,
        alpha: 0.44,
        width: 1,
        start: progress,
        end: progress + Math.PI * 0.58,
      });
      const marker = ellipsePoint(
        centerX,
        centerY,
        sphereRadius * (0.7 + index * 0.12),
        sphereRadius * (0.2 + index * 0.035),
        progress + Math.PI * 0.58,
        -0.5 + index * 0.7,
      );
      drawFourPointStar(context, marker.x, marker.y, 3.2, 0.74);
    });

    stars.forEach((star, index) => {
      const drift = still ? 0 : seconds * (0.0014 + (index % 5) * 0.00018);
      const x = ((star.x + drift) % 1.04) * width - width * 0.02 + parallaxX * (0.22 + star.radius * 0.08);
      const y = star.y * height + parallaxY * (0.18 + star.radius * 0.08);
      const pulse = still ? 1 : 0.82 + Math.sin(seconds * 0.42 + star.phase) * 0.18;
      if (star.radius > 1.55) {
        drawFourPointStar(context, x, y, star.radius * 2.4 * pulse, star.alpha + 0.12);
      } else {
        context.beginPath();
        context.fillStyle = rgba(star.alpha * pulse);
        context.arc(x, y, star.radius, 0, TAU);
        context.fill();
      }
    });

    const constellationBounds = {
      x: centerX - sphereRadius * 0.78,
      y: centerY - sphereRadius * 0.57,
      width: sphereRadius * 1.56,
      height: sphereRadius * 1.08,
    };
    context.save();
    context.translate(Math.sin(seconds * 0.027) * width * 0.012, 0);
    drawConstellation(context, constellations[0], constellationBounds, seconds, still);
    context.globalAlpha = 0.62;
    context.translate(width * 0.08, height * 0.02);
    context.rotate(-0.16);
    drawConstellation(context, constellations[1], constellationBounds, seconds + 2.4, still);
    context.restore();

    const vignette = context.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, "rgba(7, 11, 24, 0.12)");
    vignette.addColorStop(0.58, "rgba(7, 11, 24, 0)");
    vignette.addColorStop(1, "rgba(7, 11, 24, 0.58)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);

    if (schedule && visible && !still) frame = requestAnimationFrame(draw);
  }

  function move(event) {
    const bounds = container.getBoundingClientRect();
    pointer.targetX = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5) * 2;
    pointer.targetY = ((event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5) * 2;
  }

  function resetPointer() {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }

  function restart() {
    cancelAnimationFrame(frame);
    draw(performance.now(), true);
  }

  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) restart();
    else cancelAnimationFrame(frame);
  }, { threshold: 0.02 });

  resizeObserver.observe(container);
  visibilityObserver.observe(container);
  container.addEventListener("pointermove", move, { passive: true });
  container.addEventListener("pointerleave", resetPointer, { passive: true });
  reducedMotion.addEventListener?.("change", restart);
  resize();
  restart();

  return () => {
    destroyed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    reducedMotion.removeEventListener?.("change", restart);
    container.removeEventListener("pointermove", move);
    container.removeEventListener("pointerleave", resetPointer);
    canvas.remove();
  };
}

export default mountCover;
