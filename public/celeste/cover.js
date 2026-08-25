const TAU = Math.PI * 2;

const palette = {
  ink: "#070b18",
  midnight: "#0b1230",
  blue: "#6e8ed8",
  paleBlue: "#b8cdf4",
  amber: "#e7bd6d",
  warm: "#f4ddb0",
};

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

function createField() {
  const random = seededRandom(170825);
  return Array.from({ length: 54 }, (_, index) => ({
    longitude: random() * TAU,
    latitude: (random() - 0.5) * Math.PI * 0.92,
    depth: 0.72 + random() * 0.28,
    radius: index % 11 === 0 ? 1.8 : 0.7 + random() * 0.8,
    phase: random() * TAU,
    warm: random() > 0.22,
  }));
}

const constellation = [
  [-0.88, -0.04],
  [-0.58, -0.22],
  [-0.33, -0.08],
  [-0.05, -0.3],
  [0.22, -0.09],
  [0.5, -0.24],
  [0.78, -0.02],
  [0.48, 0.18],
  [0.2, 0.08],
  [-0.05, 0.28],
  [-0.34, 0.1],
  [-0.62, 0.24],
];

function projectStar(star, width, height, rotation, parallax) {
  const longitude = star.longitude + rotation;
  const cosLatitude = Math.cos(star.latitude);
  const x3 = Math.cos(longitude) * cosLatitude;
  const y3 = Math.sin(star.latitude);
  const z3 = Math.sin(longitude) * cosLatitude;
  const scale = 0.72 + z3 * 0.16;
  return {
    x: width * 0.56 + x3 * width * 0.45 * scale + parallax.x * star.depth,
    y: height * 0.46 + y3 * height * 0.67 * scale + parallax.y * star.depth,
    alpha: Math.max(0.1, 0.3 + z3 * 0.34) * star.depth,
    radius: star.radius * (0.78 + z3 * 0.22),
  };
}

function ellipsePoint(centerX, centerY, radiusX, radiusY, angle, tilt = 0) {
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  return { x: centerX + x * cos - y * sin, y: centerY + x * sin + y * cos };
}

function drawArc(context, centerX, centerY, radiusX, radiusY, tilt, color, alpha, dash = []) {
  context.save();
  context.strokeStyle = color;
  context.globalAlpha = alpha;
  context.lineWidth = 1;
  context.setLineDash(dash);
  context.beginPath();
  for (let index = 0; index <= 160; index += 1) {
    const point = ellipsePoint(centerX, centerY, radiusX, radiusY, (index / 160) * TAU, tilt);
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  }
  context.stroke();
  context.restore();
}

export function mountCover(container) {
  if (!container) return () => {};

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
  container.replaceChildren(canvas);

  const context = canvas.getContext("2d", { alpha: true });
  const field = createField();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 1;
  let height = 1;
  let frame = 0;
  let visible = true;
  let destroyed = false;

  function resize() {
    const bounds = container.getBoundingClientRect();
    const density = Math.min(window.devicePixelRatio || 1, 1.75);
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

    pointer.x += (pointer.targetX - pointer.x) * 0.035;
    pointer.y += (pointer.targetY - pointer.y) * 0.035;
    const still = reducedMotion.matches;
    const seconds = still ? 0 : time * 0.001;
    const rotation = seconds * 0.018;
    const parallax = { x: pointer.x * width * 0.028, y: pointer.y * height * 0.028 };
    const centerX = width * 0.57 + parallax.x * 0.2;
    const centerY = height * 0.44 + parallax.y * 0.2;
    const radiusX = Math.max(width * 0.47, height * 0.72);
    const radiusY = Math.max(height * 0.62, width * 0.3);

    const background = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusX * 1.1);
    background.addColorStop(0, "rgba(33, 52, 105, 0.58)");
    background.addColorStop(0.52, "rgba(15, 25, 62, 0.42)");
    background.addColorStop(1, "rgba(7, 11, 24, 0)");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 5; index += 1) {
      const latitude = (index - 2) / 2;
      drawArc(
        context,
        centerX,
        centerY + latitude * radiusY * 0.26,
        radiusX * Math.sqrt(Math.max(0.22, 1 - latitude * latitude * 0.58)),
        radiusY * (0.14 + (1 - Math.abs(latitude)) * 0.04),
        -0.035,
        palette.paleBlue,
        index === 2 ? 0.22 : 0.12,
      );
    }

    for (let index = 0; index < 7; index += 1) {
      drawArc(
        context,
        centerX,
        centerY,
        radiusX * (0.12 + index * 0.02),
        radiusY,
        (index / 7) * Math.PI + 0.12,
        palette.blue,
        0.1,
      );
    }

    drawArc(context, centerX, centerY, radiusX * 0.98, radiusY * 0.42, -0.19, palette.amber, 0.52);
    drawArc(context, centerX, centerY, radiusX * 0.89, radiusY * 0.36, -0.19, palette.amber, 0.18, [2, 8]);

    context.save();
    context.translate(centerX + Math.sin(seconds * 0.08) * width * 0.018, centerY);
    context.rotate(-0.17 + Math.sin(seconds * 0.045) * 0.025);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = palette.amber;
    context.globalAlpha = 0.5;
    context.lineWidth = 1.2;
    context.beginPath();
    constellation.forEach(([x, y], index) => {
      const px = x * radiusX * 0.72;
      const py = y * radiusY * 0.72;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    context.stroke();
    constellation.forEach(([x, y], index) => {
      const pulse = still ? 1 : 0.86 + Math.sin(seconds * 0.72 + index * 0.83) * 0.14;
      context.beginPath();
      context.fillStyle = index % 4 === 0 ? palette.paleBlue : palette.warm;
      context.globalAlpha = 0.68 + (index % 3) * 0.08;
      context.arc(x * radiusX * 0.72, y * radiusY * 0.72, (index % 4 === 0 ? 2.2 : 1.45) * pulse, 0, TAU);
      context.fill();
    });
    context.restore();

    field.forEach((star) => {
      const point = projectStar(star, width, height, rotation, parallax);
      context.beginPath();
      context.fillStyle = star.warm ? palette.warm : palette.paleBlue;
      context.globalAlpha = point.alpha * (still ? 1 : 0.86 + Math.sin(seconds * 0.46 + star.phase) * 0.14);
      context.arc(point.x, point.y, Math.max(0.45, point.radius), 0, TAU);
      context.fill();
    });

    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusX * 0.82);
    glow.addColorStop(0, "rgba(184, 205, 244, 0.025)");
    glow.addColorStop(0.78, "rgba(110, 142, 216, 0.035)");
    glow.addColorStop(1, "rgba(7, 11, 24, 0)");
    context.globalAlpha = 1;
    context.fillStyle = glow;
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

const standalone = document.querySelector("[data-celeste-cover]");
if (standalone) mountCover(standalone);
