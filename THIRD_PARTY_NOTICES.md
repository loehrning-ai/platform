# Third-Party Notices

This file records third-party material distributed or transformed by the repository. Package dependencies retain the licenses declared by their package manifests and bundled license files. Bun's lockfile pins package versions but is not a complete license inventory.

## Inter-derived fonts

`Loehrning Sans` and `Typing` are modified, renamed derivatives of Inter by Rasmus Andersson and The Inter Project Authors. They are redistributed under SIL Open Font License 1.1. See `LICENSES/OFL-1.1.txt` and `ASSET_MANIFEST.json`.

## Geist

The application uses the `geist` package, distributed under the SIL Open Font License. It is installed from the package lock and is not checked into this repository.

## Geographic outline data

`packages/simplified-website/src/lib/country-polylines-3d.ts` contains transformed geographic outline data from `world-atlas`'s `countries-50m.json`, processed with `topojson-client`. Both packages are distributed under the ISC License. The generated file retains source and transformation attribution. The complete upstream notices, including their distinct copyright years, are reproduced in `LICENSES/world-atlas-ISC.txt` and `LICENSES/topojson-client-ISC.txt`.

## Imported interactive-course assets

Imported screenshots and license copies under `packages/simplified-website/public/imported-courses/` come from commit-pinned interactive-course projects. Source paths, commits, SHA-256 values, and corresponding license locations are recorded in the course catalog and asset manifest.

## Framework and library notices

Next.js, React, Tailwind CSS, Framer Motion, Lucide, Supabase clients, Sentry clients, and other dependencies are not relicensed by this repository. Consult each installed package's license and the root `bun.lock` before redistribution.

The installed dependency graph includes optional platform packages used by
image processing. In the audited macOS ARM64 install,
`@img/sharp-libvips-darwin-arm64@1.2.4` declares LGPL-3.0-or-later. It is not
stored in this source tree because `node_modules/` is excluded. Any distributor
of a container, executable, dependency cache, or other bundle containing it
must preserve and satisfy its upstream license terms. `png-js@2.0.0` omits the
`license` field from its manifest but includes an MIT `LICENSE` file;
`rgbcolor@1.0.1` declares `MIT OR SEE LICENSE IN FEEL-FREE.md` and includes its
MIT text. The installed Sentry integration also resolves `@sentry/cli@2.58.6`
and a platform CLI binary under FSL-1.1-MIT. They are optional build-time tools
and are excluded with `node_modules/` from this source tree. The dependency
license gate checks manifest or bundled-license coverage, blocks unreviewed
strong-copyleft, source-available, and other conditional identifiers, and keeps
the exact libvips and Sentry CLI package/version exceptions visible. It does
not replace legal review of a release bundle.
