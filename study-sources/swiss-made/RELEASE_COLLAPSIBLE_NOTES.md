# The Label Is Not the Origin | Collapsible notes release

This is the same narrative and data site as v1.1, with a focused layout change at the end of the page.

## Changes

- The Technical notes section now starts with two native, keyboard-accessible disclosures, closed by default: Method & scene notes and Sources.
- Within the method panel, Notes by scene and Extended scene explanations are separately collapsible to avoid a very long page.
- All explanatory text, citations and source URLs were preserved. All chapter graphics, LAB behavior, scroll beats, and arrow navigation are unchanged.
- The header SOURCES link scrolls to the section and expands Sources. Other Method + Sources shortcuts expand the method panel when clicked. Both can be collapsed again.
- All new labels are in English and the existing publication path remains unchanged.

## Deploy

From `site/` run `npm install && npm run build`. Publish the contents of `site/dist/` to `/studies/swiss-made/`, replacing the previously published files. Do not create another nested `site` or `dist` folder in the public URL.

## QA performed

- JavaScript module syntax check (`node --check` across src/*.js).
- HTML structure and native details open/close interactions tested in Chromium at desktop 1440px and portrait 390px, using a CSS/HTML fixture independent from the Vite bundles.
- All notes and previously archived passages checked for presence.
- Full Vite build not performed: npm registry unavailable in this environment; local build check required.
