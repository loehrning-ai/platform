import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const LICENSE_FILE_RE =
  /^(?:licen[cs]e|copying|notice)(?:[._-].*)?$|^feel-free\.md$/i;
const RESTRICTED_OR_CONDITIONAL_LICENSE_RE =
  /(?:^|[^a-z])(?:agpl|gpl|lgpl|sspl|busl|fsl|functional[ -]source[ -]license|commons[ -]clause|elastic[ -]license|polyform|prosperity)(?:[^a-z]|$)/i;

const REVIEWED_LICENSE_EXCEPTIONS = [
  {
    id: /^@img\/sharp-libvips-[^@]+@1\.2\.4$/,
    license: "LGPL-3.0-or-later",
    rationale: "optional prebuilt image-processing runtime",
  },
  {
    id: /^@img\/sharp-libvips-[^@]+@1\.3\.2$/,
    license: "LGPL-3.0-or-later",
    rationale: "optional prebuilt image-processing runtime (libvips bump via sharp ^0.35.0, same license as 1.2.4)",
  },
  {
    id: /^@sentry\/cli(?:-[a-z0-9-]+)?@2\.58\.6$/,
    license: "FSL-1.1-MIT",
    rationale: "optional build-time Sentry CLI; excluded from the source tree",
  },
];

function reviewedLicenseException(id, license) {
  return REVIEWED_LICENSE_EXCEPTIONS.find(
    (exception) => exception.id.test(id) && exception.license === license,
  );
}

function declaredLicense(manifest) {
  if (typeof manifest.license === "string") return manifest.license.trim();
  if (
    manifest.license &&
    typeof manifest.license === "object" &&
    typeof manifest.license.type === "string"
  ) {
    return manifest.license.type.trim();
  }
  if (Array.isArray(manifest.licenses)) {
    return manifest.licenses
      .map((entry) => (typeof entry === "string" ? entry : entry?.type))
      .filter((entry) => typeof entry === "string" && entry.trim() !== "")
      .join(" OR ");
  }
  return "";
}

async function packageDirectories(nodeModulesRoot) {
  const store = path.join(nodeModulesRoot, ".bun");
  let locators;
  try {
    locators = await readdir(store, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      `Dependency license audit requires Bun's installed package store at ${store}. Run bun install --frozen-lockfile first.`,
      { cause: error },
    );
  }

  const directories = [];
  for (const locator of locators) {
    if (!locator.isDirectory()) continue;
    const packageRoot = path.join(store, locator.name, "node_modules");
    let entries;
    try {
      entries = await readdir(packageRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === ".bin") continue;
      if (entry.name.startsWith("@")) {
        const scopeRoot = path.join(packageRoot, entry.name);
        const scoped = await readdir(scopeRoot, { withFileTypes: true });
        for (const packageEntry of scoped) {
          if (packageEntry.isDirectory()) {
            directories.push(path.join(scopeRoot, packageEntry.name));
          }
        }
      } else {
        directories.push(path.join(packageRoot, entry.name));
      }
    }
  }
  return directories;
}

export async function auditDependencyLicenses(
  nodeModulesRoot = path.resolve("node_modules"),
) {
  const packages = new Map();
  const findings = [];
  const fileOnly = [];
  const reviewRequired = [];

  for (const directory of await packageDirectories(nodeModulesRoot)) {
    let manifest;
    try {
      manifest = JSON.parse(
        await readFile(path.join(directory, "package.json"), "utf8"),
      );
    } catch (error) {
      findings.push(
        `${path.relative(nodeModulesRoot, directory)} has no readable package.json (${error?.code ?? "invalid JSON"})`,
      );
      continue;
    }
    if (!manifest.name || !manifest.version) continue;
    const id = `${manifest.name}@${manifest.version}`;
    if (packages.has(id)) continue;

    const license = declaredLicense(manifest);
    const files = await readdir(directory);
    const bundledLicenseFiles = files.filter((name) =>
      LICENSE_FILE_RE.test(name),
    );
    packages.set(id, { license, bundledLicenseFiles });

    if (!license && bundledLicenseFiles.length === 0) {
      findings.push(
        `${id} has neither license metadata nor a bundled license file`,
      );
      continue;
    }
    if (!license) fileOnly.push(id);
    if (license && RESTRICTED_OR_CONDITIONAL_LICENSE_RE.test(license)) {
      const exception = reviewedLicenseException(id, license);
      if (exception) {
        reviewRequired.push(`${id} (${license}; ${exception.rationale})`);
      } else {
        findings.push(
          `${id} declares an unreviewed restricted or conditional license expression ${JSON.stringify(license)}`,
        );
      }
    }
  }

  return {
    packageCount: packages.size,
    findings: findings.sort(),
    fileOnly: fileOnly.sort(),
    reviewRequired: reviewRequired.sort(),
  };
}

export async function verifyDependencyLicenses(nodeModulesRoot) {
  const result = await auditDependencyLicenses(nodeModulesRoot);
  if (result.findings.length > 0) {
    throw new Error(
      `Dependency license audit failed:\n${result.findings
        .map((finding) => `- ${finding}`)
        .join("\n")}`,
    );
  }
  return result;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  try {
    const result = await verifyDependencyLicenses(
      path.resolve(process.argv[2] ?? "node_modules"),
    );
    console.log(
      `Dependency license audit passed: ${result.packageCount} package/version manifests; ${result.fileOnly.length} file-only declarations; ${result.reviewRequired.length} explicitly reviewed restricted or conditional package(s).`,
    );
    for (const id of result.fileOnly) console.log(`FILE-ONLY: ${id}`);
    for (const id of result.reviewRequired) console.log(`REVIEWED: ${id}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
