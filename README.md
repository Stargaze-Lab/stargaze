# Stargaze portfolio — test version

A static, GitHub Pages-ready portfolio for data visualization, 3D, live browser tools and creative-code work.

## Run locally

```bash
npm install
npm run dev
```

## Content structure

- `content/projects/` contains the larger cases shown in **Selected work**.
- `content/sketches/` contains live tools and planned experiments shown in **Live lab**.
- `public/studies/` can hold a complete self-contained study that should live inside this repository.
- `src/main.js` contains the shared portfolio interface and the automatic sketch loader.
- `src/sketches/` contains self-contained inline experiments.

The site regenerates its content list whenever `npm run dev` or `npm run build` runs. Do not edit `src/projects.generated.js` directly.

## Add a larger case study

1. Duplicate `content/templates/project.example.json` into `content/projects/`.
2. Rename it with a short slug, for example `climate-atlas.json`.
3. Update the title, text, tools, date, accent, size and visual.
4. Choose one publication route for `href`:
   - A separate repository or existing site: use the complete `https://...` URL.
   - A self-contained HTML study in this repository: put its files in `public/studies/climate-atlas/` and use `"href":"./studies/climate-atlas/"`.
5. Run `npm run dev` to review it.

For Three.js, D3 or projects with their own build process, a separate repository is usually cleaner. The portfolio then acts as the editorial entry point and links to that deployment. Small HTML/CSS/JS studies can comfortably live under `public/studies/`.

Supported accents: `amber`, `violet`, `blue`, `sage`, `aqua`.

Supported spans: `standard`, `wide`, `tall`.

Supported case visuals: `network`, `wave`, `threads`, `field`, `migration-globe`.

## Add a planned sketch

1. Duplicate `content/templates/sketch.example.json` into `content/sketches/`.
2. Use `"status":"planned"` to create a designed placeholder.
3. List the intended interface controls in `controls`.

## Add a live inline sketch

1. Add `src/sketches/your-sketch.js` following the module contract in `AI-WORKFLOW.md`.
2. Add `content/sketches/your-sketch.json` with `"status":"live"` and `"sketch":"your-sketch"`.
3. Run `npm run dev` to review it.

The loader discovers the JavaScript file automatically. New sketches no longer require manual edits in `src/main.js`.

The current placeholders demonstrate three useful future directions: pattern construction, poster generation and data glyph design. They can be replaced gradually without restructuring the homepage.

For the repeatable AI-assisted update and publishing procedure, see [`AI-WORKFLOW.md`](./AI-WORKFLOW.md).

## Publish

The included GitHub Actions workflow builds and publishes the site whenever the `main` branch is updated. In the repository settings, set Pages source to **GitHub Actions**.
