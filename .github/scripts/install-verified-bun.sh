#!/usr/bin/env bash
set -euo pipefail

BUN_VERSION="1.3.10"
BUN_LINUX_X64_SHA256="f57bc0187e39623de716ba3a389fda5486b2d7be7131a980ba54dc7b733d2e08"
BUN_ARCHIVE_URL="https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64.zip"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "Verified Bun bootstrap supports only the pinned Linux x86_64 runner."
  exit 1
fi
if [[ -z "${RUNNER_TEMP:-}" || -z "${GITHUB_PATH:-}" ]]; then
  echo "RUNNER_TEMP and GITHUB_PATH are required."
  exit 1
fi

archive_path="${RUNNER_TEMP}/bun-linux-x64-${BUN_VERSION}.zip"
install_root="${RUNNER_TEMP}/bun-${BUN_VERSION}-verified"
bun_directory="${install_root}/bun-linux-x64"
bun_binary="${bun_directory}/bun"

curl \
  --fail \
  --location \
  --proto '=https' \
  --retry 3 \
  --show-error \
  --silent \
  --tlsv1.2 \
  "${BUN_ARCHIVE_URL}" \
  --output "${archive_path}"
printf '%s  %s\n' "${BUN_LINUX_X64_SHA256}" "${archive_path}" |
  sha256sum --check --strict -
unzip -q -o "${archive_path}" -d "${install_root}"

if [[ ! -f "${bun_binary}" || -L "${bun_binary}" ]]; then
  echo "Verified Bun archive did not produce the expected regular binary."
  exit 1
fi
if [[ "$("${bun_binary}" --version)" != "${BUN_VERSION}" ]]; then
  echo "Verified Bun binary reported an unexpected version."
  exit 1
fi

printf '%s\n' "${bun_directory}" >> "${GITHUB_PATH}"
