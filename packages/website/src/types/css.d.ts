/**
 * Ambient declaration for side-effect stylesheet imports.
 *
 * TypeScript 6 raises TS2882 for a side-effect import of a non-code extension
 * unless the module is declared. TypeScript 5 accepted it silently, and Next
 * does not ship a `*.css` declaration of its own, so the upgrade surfaced
 * every `import "./globals.css"` in the tree at once.
 *
 * The declaration is intentionally shapeless: the platform imports
 * stylesheets only for their side effect and never binds their value, so
 * giving the module an `any` export would invite exactly the untyped access
 * this file exists to avoid.
 */
declare module "*.css";
