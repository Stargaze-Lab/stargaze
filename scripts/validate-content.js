import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = ["slug", "title", "summary", "description", "tools", "date", "accent"];
const supportedAccents = new Set(["amber", "violet", "blue", "sage", "aqua"]);
const builtInSketches = new Set(["orbit"]);
const errors = [];
const slugs = new Set();

async function load(folder, kind) {
  const source = resolve(root, "content", folder);
  const files = (await readdir(source)).filter((file) => file.endsWith(".json"));
  return Promise.all(files.map(async (file) => {
    const path = resolve(source, file);
    try {
      return { file: `${folder}/${file}`, kind, data: JSON.parse(await readFile(path, "utf8")) };
    } catch (error) {
      errors.push(`${folder}/${file}: invalid JSON (${error.message})`);
      return null;
    }
  }));
}

const items = (await Promise.all([load("projects", "project"), load("sketches", "sketch")])).flat().filter(Boolean);

for (const { file, kind, data } of items) {
  for (const field of required) if (data[field] === undefined || data[field] === "") errors.push(`${file}: missing ${field}`);
  if (slugs.has(data.slug)) errors.push(`${file}: duplicate slug ${data.slug}`);
  slugs.add(data.slug);
  if (!supportedAccents.has(data.accent)) errors.push(`${file}: unsupported accent ${data.accent}`);
  if (!Array.isArray(data.tools)) errors.push(`${file}: tools must be an array`);

  if (kind === "sketch") {
    if (!new Set(["live", "planned"]).has(data.status)) errors.push(`${file}: status must be live or planned`);
    if (data.status === "live" && !data.sketch) errors.push(`${file}: live sketches need a sketch module name`);
    if (data.status === "live" && data.sketch && !builtInSketches.has(data.sketch)) {
      const modulePath = resolve(root, "src", "sketches", `${data.sketch}.js`);
      try {
        await access(modulePath, constants.R_OK);
      } catch {
        errors.push(`${file}: missing module src/sketches/${data.sketch}.js`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Validated ${items.length} content entries.`);
