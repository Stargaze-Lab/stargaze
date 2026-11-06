# ASCII / OBJECT LAB — v0.3

An independent, browser-based **3D → ASCII** branding playground. Dark colors are based on the user-supplied screenshot of [ship.space](https://ship.space/). This is an unofficial design study; it is **not affiliated with ship.space**.

## New in v0.3

- Removed the large success notification displayed when a built-in or imported model loads. Failures still display an error message. The selected model's name is shown unobtrusively in the **MODEL / FILE** section.
- **</> COPY EMBED** generates a complete responsive HTML `<iframe srcdoc="...">` snippet with **GLB model data embedded in Base64**. No external GLB hosting, upload, account, database, or backend is required.
- **↓ EMBED HTML** downloads a standalone HTML document containing the model and settings, useful for heavier HTML snippets and platforms that restrict clipboard sizes.
- The interactive embed includes the current 3D model (including imported OBJ/STL/GLTF models converted to GLB), ramp, colors, lighting, dither, active camera angle, object rotation, assembly animation, auto-rotation and orbital decoration. Viewers can **drag to orbit** and **scroll/pinch to zoom**.
- Each embed is an independent viewer: it does not require the deployed Stargaze lab URL to be online.
- A selectable code fallback dialog is shown if automatic copying is blocked by browser permissions. Try **COPY CODE** in that dialog (user gesture), or select and copy manually.

## What stays the same from v0.2

- Eleven glyph ramps: letters, classic ASCII, technical, dots, orbital rings, Braille, blocks, stars, geometric symbols, binary, and a custom ramp.
- Knot, Orb, **gravity-ring spacecraft**, **Utah Teapot** model presets; `.glb`, `.obj`, `.stl`, and self-contained `.gltf` imports.
- Adjustable lighting, resolution, ordered dithering, contrast, exposure, gamma, motion, reconstruction, and four-color night palette.
- PNG / editable SVG text / ASCII TXT / JSON preset export.
- All modeling and processing happen **locally in the browser**; no model is transmitted to the site.

## Publish to Stargaze

To publish at `https://stargaze.glitchme.art/Ascii_object_lab/`:

1. Extract the ZIP.
2. Copy the entire included **`Ascii_object_lab/`** folder into `public/` in the existing Stargaze project.
3. Keep all files together: `index.html`, `main.js`, **`embed-runtime.js`**, `styles.css`, and `assets/icon.svg`.
4. Run Stargaze's normal build and deployment. Confirm `dist/Ascii_object_lab/index.html` is present.
5. Open the URL. You do not have to add an entry on the homepage.

The lab needs **no Python and no separate JS bundling/build**. For local testing only, run `python3 -m http.server 8000` from the lab folder and visit `http://localhost:8000`.

## How to export an interactive HTML embed

1. Select a preset or import a compatible 3D file.
2. Set the font ramp, color palette, light, dither, camera angle and motion as you want.
3. Click **</> COPY EMBED**. Paste the HTML into a website that accepts iframe HTML. You may edit the `aspect-ratio` and sizing style in the copied iframe tag.
4. Alternatively click **↓ EMBED HTML** and use the generated HTML as a standalone viewer (host it wherever you like, or open it locally with internet access).

**Technical details and caveats:**

- The **3D model is inline**, but the viewer still loads **Three.js v0.180.0 modules from jsDelivr**. Internet access is needed. Embeds do not need the Stargaze URL or a separately hosted model.
- The raw GLB is converted to Base64 (approximately 33% larger), then carried inside the iframe's `srcdoc` attribute. A simplified GLB exports cleanly and stays lightweight.
- To protect against unwieldy pasted code, the inline exporter currently rejects a generated GLB over **8 MiB** and suggests model simplification.
- Some website builders/CMSs sanitize `<iframe>` markup, disallow scripts, or enforce restrictive Content Security Policies. For those cases, the downloadable HTML can be deployed directly and embedded with an ordinary iframe `src="https://your-domain/path/to/file.html"` (which would then need HTML hosting, not separate GLB hosting).
- The copied iframe is sandboxed with `allow-scripts` (without `allow-same-origin`) to isolate the embedded viewer from its parent page.
- Some uncommon Unicode glyphs need compatible fonts on the final viewer's device.
- The embed captures a copy of the model and parameters **at export time**. Changing the lab later does not change already-copied snippets; export again if needed.
- Rebuild is a glyph-screen dissolve, not physical mesh fragmentation.
- Check the licensing of imported 3D files before commercial use.

## Files

- `index.html` — authoring app and controls
- `main.js` — editor, model loaders, render and exports
- `embed-runtime.js` — lightweight interactive viewer, inlined into each exported HTML
- `styles.css` — editor styling
- `assets/icon.svg` — lab icon

This project uses the MIT-licensed Three.js library.
