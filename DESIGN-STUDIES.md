# Stargaze home direction studies

This is a private comparison layer. It does not replace the current homepage and is included only to evaluate the next visual direction.

## Open the studies

```bash
npm ci
npm run dev
```

The evolved **Equilíbrio** direction is at `/design-studies/`. It includes a four-scene interactive hero with dot controls, monochromatic animated project covers, project focus and a public Field Notes reader. The exhibition fills the available width and stacks below 780px of container space. Authoring is separate: `npm run editor` runs on localhost and exports publication packages (see `CADERNO-LOCAL.md`). The original three switchable directions remain available at `/design-studies/archive.html`:

1. **Exposição** — projects read as works in a spacious digital exhibition.
2. **Instrumento** — the homepage behaves like a public workbench with project controls.
3. **Equilíbrio** — editorial hierarchy with reactive and playable behavior.

You can also link directly to a direction:

- `/design-studies/archive.html?direction=exhibition`
- `/design-studies/archive.html?direction=instrument`
- `/design-studies/archive.html?direction=balanced`

## What is intentionally provisional

- The studies use graphic abstractions instead of replacing the definitive project covers.
- Life Threads appears as paused; its source and current public entry remain untouched.
- Lissajous and Chromascope appear as editorial placeholders so their future role can be evaluated.
- The new Field Notes section has no fabricated articles. It remains empty until a manually authored note is approved. Sample articles exist only in the archived first studies.
- The public homepage, project metadata and experiments are unchanged.

Run `npm run build` to validate both the current homepage and the comparison route.
