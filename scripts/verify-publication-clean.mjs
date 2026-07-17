import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BLOCKED_DIRECTORY_NAMES = new Set([
  ".auth",
  ".aws",
  ".bun-cache",
  ".cache",
  ".docker-buildx",
  ".git",
  ".kube",
  ".lighthouseci",
  ".mypy_cache",
  ".next",
  ".nyc_output",
  ".output",
  ".parcel-cache",
  ".pytest_cache",
  ".ruff_cache",
  ".ssh",
  ".swc",
  ".temp",
  ".turbo",
  ".vercel",
  ".venv",
  "__pycache__",
  "blob-report",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
  "venv",
]);

const SECRET_FILE_NAMES = new Set([
  ".dockercfg",
  ".git-credentials",
  ".netrc",
  ".npmrc",
  ".pypirc",
  "credentials.json",
  "kubeconfig",
]);

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function isSecretEnvFile(name) {
  if (name.endsWith(".example")) return false;
  return name === ".env" || name.startsWith(".env.") || name.endsWith(".env");
}

function isSecretLikeFile(relativePath, name) {
  const lowerPath = relativePath.toLowerCase();
  const lowerName = name.toLowerCase();
  if (SECRET_FILE_NAMES.has(lowerName)) return true;
  if (/^service-account.*\.json$/i.test(name)) return true;
  if (/^id_(?:rsa|dsa|ecdsa|ed25519)$/i.test(name)) return true;
  if (/\.(?:key|p12|pem|pfx)$/i.test(name)) return true;
  return (
    /(?:^|\/)\.docker\/config\.json$/.test(lowerPath) ||
    /(?:^|\/)\.aws\/(?:config|credentials)$/.test(lowerPath) ||
    /(?:^|\/)\.kube\/config$/.test(lowerPath) ||
    /(?:^|\/)\.ssh\/config$/.test(lowerPath)
  );
}

function isBlockedFile(relativePath, name) {
  if (name === ".DS_Store" || name === ".dev-ports.json" || name === ".git") {
    return true;
  }
  if (
    name.endsWith(".tsbuildinfo") ||
    name.endsWith(".log") ||
    /\.py[cod]$/i.test(name) ||
    isSecretEnvFile(name) ||
    isSecretLikeFile(relativePath, name)
  ) {
    return true;
  }
  return /(?:^|\/)tests\/e2e\/_.*\.spec\.ts$/.test(relativePath);
}

export async function findPublicationResidue(rootPath) {
  const root = path.resolve(rootPath);
  const findings = [];

  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const relativePath = normalize(
        relativeDirectory
          ? path.join(relativeDirectory, entry.name)
          : entry.name,
      );

      if (entry.isDirectory()) {
        if (BLOCKED_DIRECTORY_NAMES.has(entry.name)) {
          findings.push(`${relativePath}/`);
          continue;
        }
        await walk(path.join(directory, entry.name), relativePath);
        continue;
      }

      if (entry.isSymbolicLink()) {
        findings.push(`${relativePath} (symlink)`);
        continue;
      }

      if (isBlockedFile(relativePath, entry.name)) findings.push(relativePath);
    }
  }

  await walk(root);
  return findings;
}

export async function verifyPublicationClean(rootPath = process.cwd()) {
  const findings = await findPublicationResidue(rootPath);
  if (findings.length > 0) {
    throw new Error(
      `Publication tree contains generated, secret-bearing, or unsafe residue:\n${findings
        .map((finding) => `- ${finding}`)
        .join("\n")}`,
    );
  }
  return { root: path.resolve(rootPath), findings: 0 };
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  try {
    const result = await verifyPublicationClean(
      process.argv[2] ?? process.cwd(),
    );
    console.log(`Publication tree clean: ${result.root}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
