import { rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(here, "../../artifacts/screenshots");

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "entries"), { recursive: true });
console.log(`Prepared ${output}`);
