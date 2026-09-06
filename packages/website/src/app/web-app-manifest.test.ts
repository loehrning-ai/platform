import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

/**
 * Web app manifest contract.
 *
 * The companion shell installs to the home screen from a plain manifest: no
 * service worker, no offline promise, no cached shell. Everything asserted
 * here is a claim the installed window actually keeps, and the theme colour is
 * pinned to the same `--color-background` token the browser chrome uses, so
 * the splash screen can never drift away from the page it opens.
 */

const APP_DIRECTORY = __dirname;
const WEBSITE_ROOT = join(APP_DIRECTORY, "..", "..");
const PUBLIC_DIRECTORY = join(WEBSITE_ROOT, "public");

type ManifestIcon = {
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
  readonly purpose: string;
};

type WebAppManifest = {
  readonly id: string;
  readonly name: string;
  readonly short_name: string;
  readonly description: string;
  readonly lang: string;
  readonly start_url: string;
  readonly scope: string;
  readonly display: string;
  readonly background_color: string;
  readonly theme_color: string;
  readonly icons: readonly ManifestIcon[];
};

const LOCALE_MANIFESTS = [
  { locale: "de", file: "site.webmanifest", startUrl: "/" },
  { locale: "en", file: "site.en.webmanifest", startUrl: "/en/" },
] as const;

const EXPECTED_ICONS = [
  { src: "/icon-192.png", sizes: "192x192", purpose: "any", pixels: 192 },
  { src: "/icon-512.png", sizes: "512x512", purpose: "any", pixels: 512 },
  {
    src: "/icon-192-maskable.png",
    sizes: "192x192",
    purpose: "maskable",
    pixels: 192,
  },
  {
    src: "/icon-512-maskable.png",
    sizes: "512x512",
    purpose: "maskable",
    pixels: 512,
  },
] as const;

/**
 * Members that would either register a worker or advertise an installed app
 * this repository does not ship. None of them may appear.
 */
const FORBIDDEN_MEMBERS = [
  "serviceworker",
  "related_applications",
  "prefer_related_applications",
  "display_override",
] as const;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function readManifest(file: string): WebAppManifest {
  const raw = readFileSync(join(PUBLIC_DIRECTORY, file), "utf8");
  return JSON.parse(raw) as WebAppManifest;
}

function readManifestSource(file: string): string {
  return readFileSync(join(PUBLIC_DIRECTORY, file), "utf8");
}

function backgroundToken(): string {
  const css = readFileSync(join(APP_DIRECTORY, "globals.css"), "utf8");
  const root = postcss.parse(css);
  let value: string | undefined;
  root.walkAtRules("theme", (rule) => {
    rule.walkDecls("--color-background", (declaration) => {
      value = declaration.value.trim();
    });
  });
  if (!value) throw new Error("globals.css @theme has no --color-background");
  return value;
}

function layoutSource(): string {
  return readFileSync(join(APP_DIRECTORY, "layout.tsx"), "utf8");
}

/** Reads the pixel dimensions straight out of the PNG IHDR chunk. */
function pngDimensions(absolutePath: string): {
  width: number;
  height: number;
} {
  const bytes = readFileSync(absolutePath);
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${absolutePath} is not a PNG file`);
  }
  if (bytes.subarray(12, 16).toString("latin1") !== "IHDR") {
    throw new Error(`${absolutePath} has no leading IHDR chunk`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

describe("web app manifest", () => {
  it.each(LOCALE_MANIFESTS)(
    "declares an installable standalone app for $locale",
    ({ locale, file, startUrl }) => {
      const manifest = readManifest(file);

      expect(manifest.name).toBe("loehrning.ai");
      expect(manifest.short_name).toBe("loehrning");
      // Android truncates the home-screen label well before this length.
      expect(manifest.short_name.length).toBeLessThanOrEqual(12);
      expect(manifest.lang).toBe(locale);
      expect(manifest.description.length).toBeGreaterThan(40);
      expect(manifest.display).toBe("standalone");
      expect(manifest.start_url).toBe(startUrl);
      expect(manifest.id).toBe(startUrl);
    },
  );

  it.each(LOCALE_MANIFESTS)(
    "keeps the whole origin inside the installed $locale window",
    ({ file }) => {
      const manifest = readManifest(file);

      // The sign-in callback lives at /auth/callback, outside both locale
      // prefixes. A narrower scope would drop the installed window back into
      // a browser tab in the middle of signing in.
      expect(manifest.scope).toBe("/");
    },
  );

  it.each(LOCALE_MANIFESTS)(
    "paints the $locale splash screen with the background token",
    ({ file }) => {
      const manifest = readManifest(file);
      const token = backgroundToken();

      expect(manifest.theme_color).toBe(token);
      expect(manifest.background_color).toBe(token);
    },
  );

  it("uses the same colour for the manifest and the browser chrome", () => {
    const themeColor = /themeColor:\s*"(#[0-9a-fA-F]{6})"/.exec(layoutSource());

    expect(themeColor).not.toBeNull();
    expect(themeColor?.[1]).toBe(backgroundToken());
  });

  it.each(LOCALE_MANIFESTS)(
    "ships the brand mark at 192 and 512 for $locale, plain and maskable",
    ({ file }) => {
      const manifest = readManifest(file);

      expect(manifest.icons).toHaveLength(EXPECTED_ICONS.length);
      for (const [index, expected] of EXPECTED_ICONS.entries()) {
        const icon = manifest.icons[index];
        expect(icon.src).toBe(expected.src);
        expect(icon.sizes).toBe(expected.sizes);
        expect(icon.type).toBe("image/png");
        expect(icon.purpose).toBe(expected.purpose);

        const absolutePath = join(PUBLIC_DIRECTORY, icon.src.slice(1));
        expect(existsSync(absolutePath)).toBe(true);
        expect(pngDimensions(absolutePath)).toEqual({
          width: expected.pixels,
          height: expected.pixels,
        });
      }
    },
  );

  it.each(LOCALE_MANIFESTS)(
    "claims no offline behaviour and no worker for $locale",
    ({ file }) => {
      const manifest = readManifest(file) as unknown as Record<string, unknown>;

      for (const member of FORBIDDEN_MEMBERS) {
        expect(Object.hasOwn(manifest, member)).toBe(false);
      }
    },
  );

  it("registers no service worker anywhere in the app", () => {
    expect(existsSync(join(PUBLIC_DIRECTORY, "sw.js"))).toBe(false);
    expect(existsSync(join(PUBLIC_DIRECTORY, "service-worker.js"))).toBe(false);
    expect(layoutSource()).not.toContain("serviceWorker");
  });

  it.each(LOCALE_MANIFESTS)(
    "keeps dashes out of the $locale install copy",
    ({ file }) => {
      // Same typography rule as every other user-facing string: hyphens only.
      expect(readManifestSource(file)).not.toMatch(/[–—]/);
    },
  );

  it("keeps one manifest per locale wired into the document head", () => {
    const layout = layoutSource();

    expect(layout).toContain('"/site.webmanifest"');
    expect(layout).toContain('"/site.en.webmanifest"');
  });
});
