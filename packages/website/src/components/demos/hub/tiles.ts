import type { ComponentType } from "react";
import type { DemoSlug } from "@/lib/demos";
import KiPrognosen from "../ki-prognosen-einschaetzen/tile";
import Geschaeftsberichte from "../geschaeftsberichte-mit-ki-lesen/tile";
import Datenbereitschaft from "../datenbereitschaft-fuer-ki/tile";
import Esg from "../esg-berichte-mit-ki/tile";
import AuditVorbereitung from "../audit-vorbereitung-mit-ki/tile";
import type { TileProps } from "./tile-kit";

/**
 * The five hub miniatures, imported statically: a tile is a server component
 * (SVG, no script, no CSS import), so the hub carries no demo code. The scene
 * key `w01`..`w05` in tile-scenes.css is the slug's position in DEMO_SLUGS.
 */
export const TILES: Readonly<Record<DemoSlug, ComponentType<TileProps>>> = {
  "ki-prognosen-einschaetzen": KiPrognosen,
  "geschaeftsberichte-mit-ki-lesen": Geschaeftsberichte,
  "datenbereitschaft-fuer-ki": Datenbereitschaft,
  "esg-berichte-mit-ki": Esg,
  "audit-vorbereitung-mit-ki": AuditVorbereitung,
};
