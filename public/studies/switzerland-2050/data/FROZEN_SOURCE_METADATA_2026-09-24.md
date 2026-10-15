# Frozen web/source metadata snapshot — 24/09/2026

This file records the source facts needed by implementation so future design work does not need to rediscover them. URLs are also in `06_remote_fetch/REMOTE_DATASETS.csv`.

## S18 — site-adapted land use
- Publisher: Agroscope; made available 19 Feb 2026.
- Versioned Zenodo record: `10.5281/zenodo.17687485` (concept DOI referenced by WUR: `10.5281/zenodo.17687484`).
- File: `Site_adaptation_Switzerland.zip`, 191.6 MB, MD5 `274e7147e4a164d7b133d21782d578c1`.
- Spatial standardization: 25×25 m, CH1903+ / LV95.
- Universe: utilized agricultural area (FOAG/LPIS 2021), with permanent crops/ecological focus areas treated according to the published model; do not reinterpret as AREA.

## FFF 2023
- National snapshot is explicitly based on canton FFF geodata available on 01.01.2023 and is the basis of the 2023 federal FFF statistics.
- Complete for all 26 cantons.
- Geopackage / LV95. Main layer `FFF_SDA_CH_2023`; metadata table `FFF_SDA_KT_META`.
- Terms: Open Data, free use; attribution mandatory to ARE and cantonal offices.
- Credited total from ARE statistics: 445,680 ha; national minimum 438,460 ha.

## AREA
- Exact raw URL/hash from the prior project QA are pinned in `REMOTE_DATASETS.csv`.
- Project snapshot: 4,129,072 rows; 100 m grid; EPSG:2056.
- LAB baseline remains the comparable 2013–2018 round; do not substitute mixed-year current status without explicit labeling.

## Wheat / bread calibration
- BLW: approximately 80,000 ha of bread grains; domestic need mostly covered by domestic production under normal conditions.
- swiss granum 2024 actual: 250,773 t baking-capable bread grain.
- supply balance snapshot used for calibration: domestic ~251k t; free zones 10k t; tariff-quota imports 90k t; reported stocks 110k t; total 461k t; milling demand 455k t; balance +6k t.
- These quantities form a calibration/identity test, not a 2050 forecast.
