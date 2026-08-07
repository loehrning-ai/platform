# License Policy

This repository is multi-licensed. The application code is open source; the repository as a whole is not an open-content collection. A public or source-visible file is not automatically covered by the MIT License merely because it is stored beside application code.

## MIT License

The following original project material is licensed under [LICENSES/MIT.txt](LICENSES/MIT.txt):

- root configuration and public documentation, excluding `CODE_OF_CONDUCT.md`,
  `marketing/**`, and brand artwork;
- `scripts/**`, including root verification tools and their tests;
- `packages/website/src/**`, excluding the exact reserved paths `src/fonts/**`, `src/app/blog/**`, `src/lib/blog-metadata.ts`, and the ISC-licensed generated file `src/lib/country-polylines-3d.ts`;
- `packages/website/scripts/**`;
- `packages/website/tests/**`;
- `packages/website/supabase/migrations/**`;
- package, TypeScript, ESLint, Tailwind, PostCSS, Playwright, Vitest, Next.js, and Sentry configuration files.

Dependencies retain their own licenses.

The AI-native demo implementations under
`packages/website/src/components/ai-native/demos/**` are first-party
project source by Tim Löhr and fall under the MIT grant above. Historical local
working archives are not dependencies and are not part of the public tree.

## Workshop bundles

`packages/website/public/workshops/**` is copyright Tim Löhr, all rights reserved, except vendored fonts under `public/workshops/**/assets/fonts/**`, which are SIL Open Font License 1.1 (see `LICENSES/OFL-1.1.txt` and `LICENSES/OFL-1.1-JetBrainsMono.txt`).

## ISC geographic data

`packages/website/src/lib/country-polylines-3d.ts` contains transformed geographic outline data from `world-atlas`, processed with `topojson-client`. It is distributed under the upstream ISC licenses reproduced in `LICENSES/world-atlas-ISC.txt` and `LICENSES/topojson-client-ISC.txt`. The generated file retains source and transformation attribution and is not included in this project's MIT grant.

## CC BY 4.0

Original governance templates under `packages/website/content/vorlagen/**` are licensed under the Creative Commons Attribution 4.0 International license in [LICENSES/CC-BY-4.0.txt](LICENSES/CC-BY-4.0.txt).

Attribution: `loehrning.ai, Tim Löhr, https://loehrning.ai/vorlagen`.

The project-specific adaptation in `CODE_OF_CONDUCT.md` is also licensed under CC BY 4.0. Its upstream Contributor Covenant attribution and modification notice are retained in that file.

The public editorial operating system is licensed under CC BY 4.0 at these
paths:

- `marketing/README.md`;
- `marketing/manifest.json`;
- `marketing/calendar/**`;
- `marketing/measurement/**`;
- `marketing/research/**`;
- `marketing/strategy/**`;
- `marketing/templates/**`.

Attribution: `loehrning.ai, Tim Löhr, https://loehrning.ai`.

This grant covers original project text in those paths. It does not relicense
third-party quotations, names, trademarks, linked material, or data. Those
items retain their original rights.

## SIL Open Font License 1.1

Fonts under `packages/website/src/fonts/**` are modified and renamed derivatives of Inter. They remain licensed under [LICENSES/OFL-1.1.txt](LICENSES/OFL-1.1.txt). The original Inter copyright belongs to The Inter Project Authors. The modified family names are `Loehrning Sans` and `Typing`; the modifications are not endorsed by the Inter authors.

## Imported course material

Files under `packages/website/public/imported-courses/**` retain the license of their commit-pinned source project. Local license copies are stored under `public/imported-courses/licenses/`. Screenshots and hashes are mapped in [ASSET_MANIFEST.json](ASSET_MANIFEST.json).

## Editorial content: source-visible, reuse not granted

Unless a file contains a more permissive notice, the following material is copyright Tim Löhr, all rights reserved:

- `packages/website/content/books/**`;
- original course prose and quiz content under `packages/website/content/**` outside `content/vorlagen/**`;
- the blog editorial bundle under `packages/website/src/app/blog/**` and its catalog metadata in `packages/website/src/lib/blog-metadata.ts`;
- authored website and LinkedIn drafts under `marketing/drafts/**`;
- methodology material under `packages/website/public/methodology/**`;
- book-cover images under `packages/website/public/book-covers/**`.

The files are included so the application can be built, reviewed, and operated. Repository access does not grant permission to republish, adapt, sell, train on, or redistribute this editorial material beyond rights provided by applicable law.

## Brand and trademarks: reuse not granted

The `loehrning.ai` name, logo, icons, favicons, social artwork, and other brand assets remain copyright Tim Löhr, all rights reserved. The MIT License does not grant trademark rights or permission to present a modified deployment as an official loehrning.ai service.

Brand files are listed in [ASSET_MANIFEST.json](ASSET_MANIFEST.json). They may remain in a fork for development and compatibility, but public redistribution or modified branding requires separate permission or replacement assets.

## Contributions

By contributing code or repository documentation, a contributor agrees to license that contribution under MIT. Contributions to `CODE_OF_CONDUCT.md`, `content/vorlagen/**`, and the CC BY 4.0 marketing paths listed above are accepted under CC BY 4.0. Contributions to `marketing/drafts/**` and other content or assets require an explicit license statement and proof of the contributor's rights.
