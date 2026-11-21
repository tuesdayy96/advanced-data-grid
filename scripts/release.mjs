import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import console from "node:console";
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const directory = new URL("../packages/react-data-grid/", import.meta.url);
const { name, version } = JSON.parse(
  readFileSync(new URL("package.json", directory)),
);
const registry = "https://registry.npmjs.org";
const baseline = "0.1.1";
const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const [command, requested, argument] = process.argv.slice(2);

function newer(left, right) {
  const parts = right.split(".").map(BigInt);
  for (const [index, part] of left.split(".").map(BigInt).entries()) {
    if (part !== parts[index]) return part > parts[index];
  }
  return false;
}

async function registryVersion(specifier, missingAllowed = false) {
  const response = await globalThis.fetch(
    `${registry}/${encodeURIComponent(name)}/${specifier}`,
    { signal: globalThis.AbortSignal.timeout(15000) },
  );
  if (response.status === 404 && missingAllowed) return null;
  assert(
    response.ok,
    `npm registry check failed for ${specifier}: HTTP ${response.status}`,
  );
  const metadata = await response.json();
  assert.equal(metadata.name, name);
  assert(stable.test(metadata.version), "Expected a stable npm version");
  if (specifier !== "latest") assert.equal(metadata.version, specifier);
  return metadata;
}

if (command === "version-pr") {
  const latest = await registryVersion("latest");
  assert(
    version === latest.version || newer(version, latest.version),
    `Workspace version ${version} is behind npm latest ${latest.version}`,
  );
  // Wait for the approved publication before accumulating another version bump.
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `ready=${version === latest.version}\n`,
  );
} else {
  assert.equal(
    requested,
    version,
    "Requested version must match the package manifest",
  );
  assert(
    stable.test(version) && newer(version, baseline),
    `Expected a stable version above ${baseline}`,
  );
  const changelog = readFileSync(new URL("CHANGELOG.md", directory), "utf8");
  const heading = `## ${version}`;
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex((line) => line === heading);
  assert(start >= 0, `Missing changelog section for ${version}`);

  if (command === "notes") {
    const end = lines.findIndex(
      (line, index) => index > start && line.startsWith("## "),
    );
    const notes = lines
      .slice(start + 1, end === -1 ? undefined : end)
      .join("\n")
      .trim();
    assert(notes, `Empty changelog section for ${version}`);
    writeFileSync(
      argument,
      `${notes}

- [npm package](https://www.npmjs.com/package/${name}/v/${version})
- [Playground](https://advanced-data-grid-ten.vercel.app/)
- [English docs](https://advanced-data-grid-ten.vercel.app/docs/en)
- [한국어 문서](https://advanced-data-grid-ten.vercel.app/docs/ko)
`,
    );
  } else if (command === "check") {
    const latest = await registryVersion("latest");
    assert(
      !(await registryVersion(version, true)),
      `${name}@${version} is already published`,
    );
    assert(
      newer(version, latest.version),
      `Expected a version above npm latest ${latest.version}`,
    );
    const { GITHUB_API_URL, GITHUB_REPOSITORY, GH_TOKEN } = process.env;
    const release = await globalThis.fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/releases/tags/v${version}`,
      {
        headers: { Authorization: `Bearer ${GH_TOKEN}` },
        signal: globalThis.AbortSignal.timeout(15000),
      },
    );
    assert(!release.ok, `GitHub Release v${version} already exists`);
    assert.equal(release.status, 404, "GitHub Release lookup failed");
  } else if (command === "publish") {
    const integrity = `sha512-${createHash("sha512").update(readFileSync(argument)).digest("base64")}`;
    const latest = await registryVersion("latest");
    const existing = await registryVersion(version, true);
    if (!existing) {
      assert(
        newer(version, latest.version),
        `Expected a version above npm latest ${latest.version}`,
      );
      execFileSync(
        "npm",
        [
          "publish",
          argument,
          "--registry",
          registry,
          "--access",
          "public",
          "--ignore-scripts",
        ],
        {
          stdio: "inherit",
        },
      );
    } else {
      assert.equal(
        existing.dist.integrity,
        integrity,
        "Existing npm tarball differs from the approved artifact",
      );
      console.log(
        `${name}@${version} is already published with the approved tarball integrity.`,
      );
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const published = await registryVersion(version, true);
      if (published) {
        assert.equal(
          published.dist.integrity,
          integrity,
          "Published npm tarball does not match the approved artifact",
        );
        console.log(`Verified ${name}@${version}: ${integrity}`);
        process.exit(0);
      }
      await new Promise((resolve) => globalThis.setTimeout(resolve, 5000));
    }
    throw new Error(
      "Published version is not visible yet. Re-run failed jobs after checking npm.",
    );
  } else {
    throw new Error(`Unknown release command: ${command}`);
  }
}
