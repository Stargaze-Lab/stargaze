# Review brief — Switzerland 2050 v0.7

Act as an independent **editorial, factual, interaction and front-end QA reviewer**. Do not assume this is ready to submit simply because it renders. Give a candid GO / NO-GO recommendation with critical blockers vs optional polish.

## Story to test

**Question:** What can Switzerland grow and transform in a changing climate, when production crosses borders and agriculture shares finite space with settlement, forest and mountain landscapes?

**Sequence:**

1. 50% domestic supply as **available food energy** in 2024 (not half the food consumed by mass).
2. Different domestic energy shares for plant foods (31%) and animal foods (93%), with distinct denominators and possible input/feed dependencies.
3. A 2023→2024 weather-affected harvest shock. Do not confuse individual extreme weather events with demonstrated climate-change causation.
4. Swiss-made means different things: milk (grassland, livestock, processing), wheat (weather, stocks, imports, milling), coffee (imported beans, domestic processing, exporting).
5. Swiss land is already occupied: observed uses, modeled suitability, political and geographic constraints, without combining incompatible land datasets.
6. The LAB explores dependencies with reactive schematic objects, not a national forecasting model.

The 809 kg/505 kg/304 kg mass accounting is purposely **optional context** inside the first chapter. Review whether it should remain or disappear from the submission.

## Factual checks

Check the exact source PDFs/tables and every primary link. Challenge the 2024 food-energy shares, the milk processing share, the wheat tonnage, coffee claims, BFS 2018 land categories and model S3 comparisons. Ensure source visibility on mobile and correct difference between observed, modeled, policy and scenarios. No implied causal chain beyond what evidence supports.

## Visual and UX checks

Inspect the 3 Balance states, the cleaner interactive Network plates/flow lines, the observed/ASCII Territory toggle, the constraints transect, and LAB object mode changes (field/greenhouse/controlled, plant-animal ratio, geography lens, wheat slider). Check keyboard, touch, focus, reduced motion and legibility. **LAB object positions are schematic**; verify they do not imply geography. Look for overlap/clipping at 390×844 and 1440×900 and other viewport sizes.

## Branding and transparency

The About/footer includes the **exact uploaded Stargaze mark**, with type alongside it for identification. Confirm proper brand sizing. The project discloses AI assistance in research, connecting data, interface design and prototyping, without representing AI-generated inferences as primary datasets.

## Build / shipping checks

Run `npm install && npm run build && npm run preview`. Look for console errors, failed requests and data/chart behavior before publishing. We could only validate JS syntax and static composition in the isolated assembly environment; the npm registry was unreachable here. Do not call these checks completed.


## v0.9 — editorial continuity + takeaways
- Three chapter bridges now state the causal/editorial reason for moving on (balance→network, network→territory, territory→LAB).
- A FINDINGS section precedes ABOUT and answers the initial investigation with evidence, caveats and direct sources; it does NOT assert a 2050 forecast or a fully tested climate-causation hypothesis.
- Key QA: reveal animations, keyboard links, mobile stacking, navigation dot for FINDINGS, and whether the transition typography clips on short viewports.


## v1.0 targeted review
- Test left/right keyboard navigation between narrative beats; arrows must still adjust range sliders and work normally in focused interactive elements.
- On Territory current, hover/focus/tap Agriculture, Wooded, Unproductive, Settlements and the Arable + Rock/Ice filters: selected classes should appear only where mapped. Verify selection persistence and click again to reset.
- On Territory Capability, check bar labels, model vs observed framing, and tooltip. The numbers are from a **different** LPIS/UAA universe than the national AREA map.
- On LAB desktop ensure control / map / output columns remain simultaneously visible at 1280–1600px. On mobile, check reduced-height sticky map with controls below it.
- Cartographic masks are extracted from the project's already classified **observed raster**, NOT a reread of the 4M raw records. They retain the raster's cartographic resolution and may have antialiasing/label artifacts. Never treat raster pixels as national statistic totals.
- A complete browser/interaction/build check still remains mandatory because npm resolution and headless screenshot were unavailable in the authoring environment.
