export const balanceSeries = [
  { year: '2010–19', total: 60, plant: 43, animal: 98 },
  { year: '2020', total: 56, plant: 39, animal: 94 },
  { year: '2021', total: 52, plant: 34, animal: 95 },
  { year: '2022', total: 53, plant: 37, animal: 95 },
  { year: '2023', total: 54, plant: 36, animal: 95 },
  { year: '2024', total: 50, plant: 31, animal: 93 }
];

export const networkStates = {
  system: {
    nodes: [
      ['grow','GROW',.10,.20], ['import','IMPORT',.10,.76], ['ch','SWITZERLAND',.50,.48],
      ['transform','TRANSFORM',.80,.18], ['store','STORE',.52,.80], ['consume','CONSUME',.80,.50], ['export','EXPORT',.88,.78]
    ],
    links: [['grow','ch'],['import','ch'],['ch','transform'],['ch','store'],['transform','consume'],['transform','export'],['store','consume']]
  },
  milk: {
    nodes: [['grass','GRASS',.08,.55],['cattle','CATTLE',.30,.55],['milk','MILK',.52,.55],['cheese','CHEESE',.74,.40],['market','MARKET / EXPORT',.90,.56]],
    links: [['grass','cattle'],['cattle','milk'],['milk','cheese'],['cheese','market']]
  },
  wheat: {
    nodes: [['weather','2024 WEATHER',.07,.18],['harvest','SWISS HARVEST',.27,.38],['mill','MILL / BREAD',.82,.42],['stocks','STOCKS',.30,.79],['imports','IMPORTS',.58,.78]],
    links: [['weather','harvest'],['harvest','mill'],['stocks','mill'],['imports','mill']]
  },
  coffee: {
    nodes: [['origin','GROWN ELSEWHERE',.08,.55],['import','IMPORT',.30,.55],['roast','ROAST / PROCESS',.53,.55],['consume','CONSUME',.78,.35],['export','EXPORT',.88,.70]],
    links: [['origin','import'],['import','roast'],['roast','consume'],['roast','export']]
  },
  compare: {
    nodes: [['territory','TERRITORY',.13,.25],['buffer','STOCKS / TRADE',.13,.55],['transform','TRANSFORMATION',.13,.80],['swiss','“SWISS”',.55,.52],['network','NETWORK',.88,.52]],
    links: [['territory','swiss'],['buffer','swiss'],['transform','swiss'],['swiss','network']]
  }
};

export const territoryMetrics = {
  current: { arable: 383745, grass: 451352 },
  s3: { arable: 338081, grass: 497016 },
  transitions: { arableToGrass: 161079, grassToArable: 115420 },
  area: { agriculturalKm2: 14525, arableKm2: 3884, localGrassKm2: 5128, alpineKm2: 5033 },
  fff: { creditedHa: 445680, minimumHa: 438460 }
};

export const wheatBaseline = {
  millingDemand: 455000,
  domesticBakingCapable: 250773,
  effectiveYield: 3.1346625
};

export const dependencyProfiles = {
  open: { land: .92, climate: .82, structure: .25, energy: .20, water: .65, nutrients: .55, logistics: .35 },
  protected: { land: .55, climate: .48, structure: .72, energy: .62, water: .52, nutrients: .68, logistics: .55 },
  controlled: { land: .25, climate: .18, structure: .95, energy: .96, water: .60, nutrients: .88, logistics: .78 }
};

export const sources = [
  { id:'agristat-food', tag:'FOOD / OBSERVED', title:'Nahrungsmittelbilanz 2024', publisher:'Agristat', href:'https://www.sbv-usp.ch/de/agristat-aktuell-11-25-nahrungsmittelbilanz-nmb-2024', use:'50%, 31%, 93% share of available food energy supplied domestically in 2024 (total, plant, animal). Separate Table 7: 809 kg/person/year available food mass (505 plant + 304 animal), not consumption and not the energy denominator.' },
  { id:'agristat-food-pdf', tag:'FOOD / PDF', title:'Agristat Aktuell 11-25: Food Balance 2024', publisher:'Agristat', href:'https://www.sbv-usp.ch/fileadmin/sbvuspch/04_Medien/Agristat_aktuell/2025/Aktuell_AGRISTAT_2025-11.pdf', use:'Primary table source for food-balance denominators and group shares.' },
  { id:'blw-structure', tag:'FOOD → TERRITORY', title:'Agricultural structural survey 2024', publisher:'BLW/BFS', href:'https://www.blw.admin.ch/de/newnsb/134ie84Ka4FLoV81xijG7', use:'1.041M ha UAA; 58% grassland; 38% arable.' },
  { id:'milk', tag:'CASE / MILK', title:'Milk and dairy products', publisher:'BLW', href:'https://www.blw.admin.ch/de/milch-und-milchprodukte', use:'Dairy farms, marketed milk, transformation into cheese/quark.' },
  { id:'wheat', tag:'CASE / WHEAT', title:'2024 bread-grain harvest', publisher:'swiss granum / BLW', href:'https://www.swissgranum.ch/stories/bilanz-der-ernte-2024-durch-swiss-granum', use:'Baking-capable harvest and documented wheat supply mechanism.' },
  { id:'trade', tag:'CASE / COFFEE + TRADE', title:'Statistics and analyses', publisher:'BLW', href:'https://wits.worldbank.org/trade/comtrade/en/country/CHE/year/2024/tradeflow/Exports/partner/ALL/product/090121', use:'Trade volumes and values for non-decaffeinated roasted coffee exports, HS 090121 (do not equate exports with domestic growing).'  },
  { id:'feed', tag:'CASE / FEED', title:'Futtermittelbilanz 2024', publisher:'Agristat', href:'https://www.sbv-usp.ch/de/agristat-aktuell-04-26-futtermittelbilanz-2024', use:'Domestic feed shares for herbivores and monogastrics.' },
  { id:'area', tag:'TERRITORY / OBSERVED', title:'Land Use Statistics / AREA', publisher:'BFS/GEOSTAT', href:'https://www.bfs.admin.ch/bfs/en/home/statistics/territory-environment/land-use-cover.html', use:'Observed land-use baseline and AREA methodology.' },
  { id:'area-raw', tag:'TERRITORY / DATA', title:'AREA grid: LV95 CSV ZIP', publisher:'BFS/GEOSTAT', href:'https://data.geo.admin.ch/ch.bfs.arealstatistik/arealstatistik/arealstatistik_2056.csv.zip', use:'Pinned reproducible raw source used by the project QA.' },
  { id:'site-adapted', tag:'TERRITORY / MODELED', title:'Site-adapted land-use distribution in Swiss agriculture', publisher:'Agroscope / Kreuzer et al.', href:'https://doi.org/10.5281/zenodo.17687484', use:'Modeled capability scenarios and current↔adapted agricultural-use transitions.' },
  { id:'fff', tag:'TERRITORY / CONSTRAINT', title:'Fruchtfolgeflächen statistics', publisher:'ARE', href:'https://www.are.admin.ch/de/fff-statistik', use:'FFF 2023 credited hectares and national minimum.' },
  { id:'bread', tag:'LAB / CALIBRATION', title:'Bread grain', publisher:'BLW', href:'https://www.blw.admin.ch/de/brotgetreide', use:'Approx. bread-grain area and supply-policy context.' },
  { id:'swissgranum', tag:'LAB / CALIBRATION', title:'2024 harvest balance', publisher:'swiss granum', href:'https://www.swissgranum.ch/stories/bilanz-der-ernte-2024-durch-swiss-granum', use:'250,773 t baking-capable bread grain in 2024.' },
  { id:'production-systems', tag:'LAB / PRODUCTION', title:'Vertical / urban / outside-agriculture production research', publisher:'Agroscope', href:'https://www.agroscope.admin.ch/en/10-vertical-farming-urban-farming-food-production-outside-agriculture', use:'Qualitative dependency dimensions for production-system comparison.' }
];
