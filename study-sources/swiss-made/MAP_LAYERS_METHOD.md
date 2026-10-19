# Cartographic highlight method — v1.0

## Source and status
Observed AREA / BFS–GEOSTAT map from the frozen Switzerland 2050 data package, `TERRITORY_MAP_OBSERVED_v0.1.png`, with nine named categories and a local derivative `switzerland-current-use.png`. It is a raster sampled from the fixed 100 m land-use grid in the previously audited research; this revision does not download or re-run the raw 4M-point CSV.

Original chart published by the project displays the following categories:

- settlements and infrastructure — 331,231 ha / 8.0% / red;
- orchards, vines, horticulture — 46,624 ha / 1.1% / purple;
- arable land — 379,022 ha / 9.2% / amber;
- local meadows and pasture — 521,015 ha / 12.6% / green;
- alpine agricultural land — 502,154 ha / 12.2% / light green;
- forests and other wooded areas — 1,313,469 ha / 31.8% / dark green;
- lakes and rivers — 178,414 ha / 4.3% / blue;
- unproductive vegetation / bare ground — 754,159 ha / 18.3% / gray;
- glaciers / permanent snow — 102,984 ha / 2.5% / pale blue.

The headline national-share bar rounds aggregates to 35% agriculture, 32% wooded, 25% unproductive and 8% settlements. The additional highlight 'rock / bare ground / ice' selects the gray and pale-blue classes (18.3% + 2.5%) and DOES NOT represent an elevation model or all mountain land.

## What the code does
`public/assets/area-four-groups.png` recolors classified pixels to match the four-bar legend palette. `area-highlight-{agriculture,wooded,unproductive,settlements,arable,rockice}.png` contain transparent background and the pixels of each selected class. Each is derived via nearest fixed RGB class swatch and a conservative anti-alias tolerance (`build_layers.py` in the authoring workspace). No random pixels are added, and no predictions or site-suitability maps are produced. The interface changes *display opacity*, not the data.

**Caveat:** Visible political/canton labels and antialiased boundaries were already baked into the rendered source raster; they can leave minor visual artifacts after recoloring. The map is a visual exploration of an existing raster, not a new 100m raster export with full provenance of every pixel. For a future production GIS interactive map, fetch the frozen BFS/GEOSTAT AREA raw data and reclassify each 100m sample before building the tile set.

Official sources:
- [BFS Land use in Switzerland (2018)](https://www.bfs.admin.ch/bfsstatic/dam/assets/19365040/master)
- [FSO/GEOSTAT on opendata.swiss](https://opendata.swiss/en/dataset/arealstatistik-der-schweiz)
- [Land use statistics 2018 (BFS)](https://www.swissstats.bfs.admin.ch/data/webviewer/appId/ch.admin.bfs.swissstat/article/issue21020021804-01/package)
