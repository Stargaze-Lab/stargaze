# Stargaze portfolio editing rules

Preserve the existing Vite architecture and visual identity. Do not replace the site with a starter.

## Content routes

- Larger cases: add metadata to `content/projects/`. Put a self-contained local study in `public/studies/<slug>/` and point `href` to `./studies/<slug>/`.
- Planned sketches: add metadata to `content/sketches/` with `status: "planned"`.
- Live inline sketches: add metadata to `content/sketches/` with `status: "live"` and `sketch: "<slug>"`; add the module at `src/sketches/<slug>.js`.
- Never add `meta.json`, a sketch-specific `index.html`, or a manual registry entry for an inline sketch.

## Inline sketch contract

- Prefer a default `mount(container)` export that returns a cleanup function.
- Named `mount(container)` plus `cleanup()` is also supported.
- `mountPreview(canvas)` is optional and should return a cleanup function.
- Cleanup must cancel animation frames and timers, disconnect observers, remove event listeners, close Web Audio contexts and revoke temporary URLs.
- Use browser-native APIs unless a dependency is clearly justified.
- Keep controls keyboard and touch accessible.

## Validation and delivery

- Run `npm run build` after every content or code change.
- Check live/planned status, overlay opening, previous/next navigation, closing and repeated reopening.
- Preserve unrelated user changes.
- Deliver source without `node_modules`, `dist`, `.DS_Store` or `__MACOSX`.
- Update `README.md` or `AI-WORKFLOW.md` when the publication contract changes.
