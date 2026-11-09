/**
 * Where the dots of the W05 field sit on the map: Bitola (the invented Gradba-Pro) and one town per region of the State
 * Labour Inspectorate (DIT), each the largest town of a region whose municipalities the DIT report lists (proposed annual
 * report 2025, regional sentences pp. 8 to 9, which also give the inspection totals below; they add up to 26,484).
 *
 * Gazetteer: OpenStreetMap Nominatim, https://nominatim.openstreetmap.org/search?city=<town>&country=North%20Macedonia&format=jsonv2
 * fetched 8 November 2026 (data (c) OpenStreetMap contributors, ODbL 1.0). Each point is the city's administrative relation
 * as Nominatim returns it, rounded to 0.01 degrees (about 1 km, far below one dot of the field). OSM relation ids:
 * Bitola 6435563, Veles 6800913, Stip 6791464, Ohrid 6483644, Strumica 6875365, Tetovo 6928757, Kumanovo 6835885,
 * Skopje 6966465.
 */
export const GAZETTEER = "OpenStreetMap Nominatim, fetched 8 Nov 2026 (ODbL)";

/** [lon, lat] of Bitola. */
export const BITOLA = [21.33, 41.03];

/** The eight DIT regions in the report's order: region key, town, [lon, lat], inspections in 2025 (DIT proposed report 2025). */
export const REGIONS = [
  { key: "vardar", town: "Veles", at: [21.77, 41.72], inspections: 2506 },
  { key: "east", town: "Štip", at: [22.19, 41.74], inspections: 4616 },
  { key: "southwest", town: "Ohrid", at: [20.8, 41.12], inspections: 2653 },
  { key: "southeast", town: "Strumica", at: [22.64, 41.44], inspections: 2280 },
  { key: "pelagonia", town: "Bitola", at: BITOLA, inspections: 3497 },
  { key: "polog", town: "Tetovo", at: [20.97, 42.01], inspections: 2690 },
  { key: "northeast", town: "Kumanovo", at: [21.72, 42.14], inspections: 2258 },
  { key: "skopje", town: "Skopje", at: [21.43, 42.0], inspections: 5984 },
];
