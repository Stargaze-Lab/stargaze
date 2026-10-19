# Switzerland 2050 — Food × Territory

**Browser prototype v1.0 — narrative navigation + observed geographic focus + LAB relayout**  
Independent data-journalism / interactive design experiment by Stargaze.

## Test locally

Node 20+ recommended.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). For publishability, **also** run:

```bash
npm run build
npm run preview
```

To publish from Git to Netlify, use **build** `npm run build` and **publish** `dist`. If doing a manual static upload, upload the generated **`dist/` folder**, not the unbuilt source ZIP. Keep this test separate from the Stargaze production site.

## Editorial thread: what the site now argues

The investigation begins with an open question: what future can Swiss food production have as weather and competition for land change? Public Swiss data provide a laboratory to follow a coherent sequence:

1. **Balance** — The **50% figure refers to food energy available for consumption** covered by domestic production, not to half the kilograms eaten. Plants (31%) and animals (93%) use **different group denominators**. The observed 2023→2024 decline (54→50%) and plant-food energy drop make the sensitivity to adverse weather tangible. A *separate optional footnote* explains the 809 kg per person mass balance (505 plant + 304 animal), clearly outside the energy calculation.
2. **Network** — Milk, wheat and coffee illustrate **different ways food can be “Swiss”**. They make room for land dependence, a weather-affected harvest and stocks/imports, and foreign raw materials processed and potentially re-exported. Diagram visuals return to the cleaner plates/flow lines of v0.5, now with touch, hover and keyboard explanations.
3. **Territory** — Agricultural production competes and coexists with forests, settlements and mountainous terrain. Observed BFS/AREA raster and derived ASCII atlas are toggleable. The site-adapted scenario is a **distinct modeled universe**, not a map of spare hectares. A proportional landscape transect is a diagram, **not** a topographic section.
4. **LAB** — The reader can explore shifts in demand, production mode and regional/international responsibility. The illustrated objects now have refined contours and low-poly details. Their **positions are schematic, not real future farm/city locations**. Bread-grain is the only numerical calibration; other reactions are qualitative.
5. **About** — The project question, findings and human/AI roles are explicit. **The user-supplied `stargaze-logo.svg` is included unchanged** in the About and footer, with a plain editorial text lockup, not a recreated official wordmark.

### Visual / evidence rules

- Never confuse mass/energy, observations/models/scenarios, or AREA/UAA/FFF land universes.
- `31%` and `93%` are *not* components of a pie totaling `50%`.
- 2024 extreme weather is evidence of sensitivity to weather, **not by itself an attribution to anthropogenic climate change**.
- No geographic location is calculated for LAB objects; no exact hectare gains are inferred from a qualitative diet slider.
- The ASCII atlas is a **graphic interpretation of an observed raster**, not a new classified GIS dataset. The original raster remains one click away.
- Each core beat has a visible explanation and an external source link where relevant.

## Design influences (not embedded dependencies)

- [Anatomy — object as explanation](https://skills.wheresryan.sh/anatomy)
- [Giorgia Lupi / data humanism](https://giorgialupi.com/work)

No third-party design skill is bundled. The source SVG from the user is in `public/assets/stargaze-logo.svg`; do not substitute the older provisional graphic.

## Known testing limits

- `node --check` passed for all local JS modules. HTML element/step nesting and local asset paths were checked. Static desktop/mobile layouts were inspected in a headless Chromium composition, without executing the D3/Three modules.
- The assembly environment cannot resolve the npm registry (`EAI_AGAIN`). **A full Vite build and live interactive QA have NOT been completed here.** Perform them on your computer before deployment.
- Do not assume external links, accessibility, all viewports, WebGL performance or award submission requirements are certified. Audit them as part of the external review.
- Raw high-volume Swiss GIS remains remotely pinned in the prior Data Freeze package, not embedded in this prototype. Raster styling cannot substitute for fine-grained geospatial modeling.

See `REVIEW_NOTES.md` for a brief to give the next reviewing agent.


### v0.9 editorial transitions and ending
The browser narrative now has explicit interludes between BALANCE, NETWORK, TERRITORY, and LAB, plus a FINDINGS section before ABOUT. The finding is that a domestic food-energy share alone does not account for inputs, routes, harvest volatility and land-use constraints. This is an evidence-based editorial synthesis; it is not a predictive 2050 model. See REVIEW_NOTES.md for QA.


## v1.0 implementation notes

**Navigation:** Press `←` / `→` to move to previous/next story beat when focus is outside links, buttons, dialogs, and input controls. The vertical dot navigator also remains clickable.

**Observed map focus:** Hover, keyboard-focus or tap the four major AREA categories to see the corresponding locations. The extra arable and rock/bare ground/ice subcategories are filters, not new estimates. Click again to reset a selected focus. Each highlight was extracted from the frozen, legend-bearing AREA source raster (local file in DATA FREEZE); it is not a geospatial prediction. The national area percentages are the published statistical totals, not counts of screen pixels. See `MAP_LAYERS_METHOD.md`.

**Capability:** The paired arable/grassland bars compare the current and S3 modeled states *inside one LPIS/UAA 2021 analysis universe*. Hover over a bar for its reported number. This is not the national AREA land use atlas.

**LAB:** Desktop uses control / live map / response columns so that manipulations and consequences fit within one viewport. The oversized redundant SVG output row is visually hidden but the accessible textual results remain live. Mobile has a shorter sticky map above the controls.

**QA limitation:** Syntax and local static assets checked, but npm offline dependencies are uncached and the automated Chromium screenshot timed out. Run `npm install && npm run build` and visually test desktop + mobile before publication. No live-browser interaction audit was possible in this build environment.


### Patch v1.0.1 — Network
- Reduced Network headline and support typography at desktop/mobile breakpoints.
- Reduced visible network nodes and fixed the accidental rendering of transparent touch targets as large circles.
- Preserved enlarged invisible hit areas for hover, tap and keyboard.
- No modifications to the Territory map, LAB, evidence or sources.
