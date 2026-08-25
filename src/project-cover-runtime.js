const activeCovers = new WeakMap();

const escapeAttribute = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
})[character]);

export function projectCoverMarkup(entry, large = false) {
  return `<div class="project-visual visual-project-cover ${large ? "is-large" : ""}" data-project-cover="${escapeAttribute(entry.cover)}"></div>`;
}

export function mountProjectCovers(root = document) {
  const containers = [...root.querySelectorAll("[data-project-cover]")];
  let destroyed = false;

  containers.forEach(async (container) => {
    if (activeCovers.has(container)) return;
    try {
      const moduleUrl = new URL(container.dataset.projectCover, document.baseURI);
      if (moduleUrl.origin !== window.location.origin) throw new Error("Project covers must use the same origin.");
      const module = await import(/* @vite-ignore */ moduleUrl.href);
      if (destroyed || !container.isConnected) return;
      const mount = module.mountCover || module.default;
      if (typeof mount !== "function") throw new Error("Cover module has no mount function.");
      const cleanup = mount(container);
      activeCovers.set(container, typeof cleanup === "function" ? cleanup : () => {});
    } catch (error) {
      container.classList.add("cover-load-error");
      console.error(`Could not load project cover ${container.dataset.projectCover}.`, error);
    }
  });

  return () => {
    destroyed = true;
    containers.forEach((container) => {
      activeCovers.get(container)?.();
      activeCovers.delete(container);
    });
  };
}
