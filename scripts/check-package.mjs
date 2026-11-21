import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import console from "node:console";
import { readFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";

const directory = new URL("../packages/react-data-grid/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("package.json", directory)));
const destination = process.argv[2];
const args = [
  "pack",
  "--json",
  "--ignore-scripts",
  ...(destination ? [] : ["--dry-run"]),
];
const options = {
  cwd: directory,
  encoding: "utf8",
  env: destination
    ? { ...process.env, npm_config_pack_destination: destination }
    : process.env,
};
const output =
  process.platform === "win32"
    ? execFileSync(`npm.cmd ${args.join(" ")}`, { ...options, shell: true })
    : execFileSync("npm", args, options);
const result = JSON.parse(output);
const pack = Array.isArray(result) ? result[0] : result[manifest.name];

function targets(value) {
  return typeof value === "string"
    ? [value]
    : Object.values(value).flatMap(targets);
}

assert.equal(
  pack?.name,
  manifest.name,
  "Expected npm pack metadata for the library",
);
assert.equal(pack.version, manifest.version);
const files = new Set(pack.files.map(({ path }) => path));
assert(manifest.exports["./styles.css"]?.default, "Missing CSS export");
assert(manifest.exports["./styles.css"]?.types, "Missing CSS type export");
for (const target of [
  manifest.main,
  manifest.types,
  ...targets(manifest.exports),
]) {
  assert(
    files.has(target.replace(/^\.\//, "")),
    `Missing package target: ${target}`,
  );
}
for (const filename of ["README.md", "LICENSE", "CHANGELOG.md"]) {
  assert(files.has(filename), `Missing package file: ${filename}`);
}

console.log(`${pack.id}: ${pack.entryCount} files, ${pack.integrity}`);
