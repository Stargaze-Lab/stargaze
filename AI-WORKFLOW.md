# Stargaze — procedure for new work and sketches

This portfolio has two publication routes. Choosing the correct one is the main decision.

## 1. Larger study or case

Use this route for a project page, an editorial narrative or an experiment with several files/routes.

- Metadata: `content/projects/<slug>.json`
- Self-contained study in this repository: `public/studies/<slug>/`
- `href` in the metadata: `./studies/<slug>/`
- A study hosted in another repository may use its complete public URL instead.

No edit to `src/main.js` is needed.

## 2. Inline sketch

Use this route for a compact exercise that opens inside the portfolio viewer.

- Metadata: `content/sketches/<slug>.json`
- Code: `src/sketches/<slug>.js`
- The metadata must include `"status":"live"` and `"sketch":"<slug>"`.

The loader discovers matching files automatically. Do not create a separate `index.html`, `meta.json` or folder under `public` for an inline sketch.

Every live sketch module must provide one of these interfaces:

```js
export default function mount(container) {
  // Build the experiment inside container.
  return () => {
    // Remove listeners, animation frames, audio and temporary elements.
  };
}
```

or named exports:

```js
export function mount(container) {}
export function cleanup() {}
```

An animated card preview is optional:

```js
export function mountPreview(canvas) {
  // Draw the compact card animation.
  return () => {
    // Stop its animation and observers.
  };
}
```

## Standard AI handoff

For future changes, send the assistant:

1. The latest ZIP exported from the repository.
2. A short brief saying whether the item is a **larger study** or an **inline sketch**.
3. Text, images/data and interaction requirements.

The assistant should return one complete updated ZIP after:

1. Preserving all current content and styles.
2. Adding the item through the correct route above.
3. Running `npm run build` successfully.
4. Checking that the card is correctly marked as `live` or `in development`.
5. Checking opening, closing, previous/next navigation and cleanup.
6. Excluding `node_modules`, `dist`, `.DS_Store` and `__MACOSX` from the ZIP.

The build now validates metadata and confirms that every `live` sketch has its matching module. A missing or misspelled file stops the build with a direct error instead of publishing an empty card.

## Local review and publication

```bash
npm install
npm run dev
```

After review, commit and push the changes to the default branch. The included GitHub Pages workflow runs the production build and publishes `dist` automatically. In the repository settings, the Pages source must be set to **GitHub Actions** once.

## Music Box example

The current Music Box follows the inline route:

- `content/sketches/music-box.json`
- `src/sketches/music-box.js`

It is the reference implementation for sound, Canvas interaction, recording, responsive controls, preview animation and complete cleanup.
