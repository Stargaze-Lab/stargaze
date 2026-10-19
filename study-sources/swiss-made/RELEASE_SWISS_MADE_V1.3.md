# Swiss-made · bilingual release v1.3

## Publication

Canonical folder: `/studies/swiss-made/`. `vite.config.js` has relative base `./` so the compiled assets continue to work under the new slug. Publish the contents of `site/dist/` directly into this folder. If the previous path is already public, set up a redirect from `/studies/switzerland-2050/` to avoid breaking existing visitors.

## Change list

- Hero: `WHERE DOES / YOUR FOOD / COME FROM?` with the final line highlighted.
- EN/DE switch in the masthead, German translation for editorial copy, charts, interaction labels, LAB, About, Technical notes and source descriptions. Query option `?lang=de` retains the same URL path. Switch does not reload the site.
- Technical notes and source cards: language-aware hyphenation, soft hyphens for long German compounds, no clipping from unbreakable titles.
- All data values, original official links, visual assets, stages, step order, LAB interactions and collapsible panel behavior remain unchanged.

## Checks

From `site/`: run `npm install && npm run build`, then `npm run dev` and test desktop/mobile EN/DE. Before republishing, verify the German text for tone with a native German/Swiss reviewer if available. Do not deploy the QA preview file.

The build was not executed in the authoring environment because DNS to npm registry was unavailable.

## QA limitation

The editable localization includes German labels for the supplied data, public links and LAB controls; the final compiled browser build and cross-device interaction QA still require npm access on the publishing machine.
