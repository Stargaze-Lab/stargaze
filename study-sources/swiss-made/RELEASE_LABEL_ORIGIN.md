# The Label Is Not the Origin

## Editorial revision for the existing Stargaze study

The updated publication address is `/studies/swiss-made/`. This is a text and presentation revision of the v1.0.2 GitHub subfolder build. The interactive map, LAB logic, data values, visual assets and original external source links were retained.

Changes:

- New page title, main heading, subtitle and opening statement as supplied in `spec-switzerland-2050.md`.
- A short new beat, THE PLATE, inside the existing Balance stage. The visual recycles the existing weight breakdown and shows the published 809 kg total.
- Updated story copy for Balance and Network, exact text supplied by the editorial spec.
- Updated LAB introduction, closing statement and page identity.
- Preserved four finding cards, their values and their sources.
- Moved scene explanations to a permanent Technical notes section near the end, including the method firewall, editorial limits and full existing source index.
- SOURCES and other method links now jump to Technical notes, no modal overlay.
- Preserved Stargaze branding and the original AI-assisted methodology declaration.
- Kept relative asset paths to support the existing nested GitHub Pages URL.

## Local check

```sh
cd site
npm install
npm run dev
npm run build
```

Publish the **contents of `dist/`** to the folder that already serves `/studies/swiss-made/`, then commit and push the Stargaze repository. The publication path is now /studies/swiss-made/ by user request.

**Validation in this environment:** HTML structure, JavaScript syntax and relative asset references were checked. `npm install` could not download the dependencies because DNS resolution for npmjs.org failed, so the full Vite build must be checked on the local machine before publishing. A Chromium local navigation attempt was also blocked by the environment.

The story's numerical claims are those supplied by the spec and earlier research. The copy is editorially intentional, while more precise definitions and limitations remain accessible in Technical notes. No new geospatial layers or model outputs were generated.


## Navigation patch: transitions

The left and right keyboard arrows and the side dots now include the three existing transition screens in document order: Balance to Network, Network to Territory, and Territory to LAB. Transitions also activate the matching dot during normal scrolling. No copy, data or links were changed.
