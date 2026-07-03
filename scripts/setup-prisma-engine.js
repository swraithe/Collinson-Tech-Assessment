import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function findLibQueryEngine(dir: string): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findLibQueryEngine(full);
      if (found) return found;
    } else if (entry.name === "libquery-engine" && statSync(full).size > 1_000_000) {
      return full;
    }
  }
  return null;
}

const engine = findLibQueryEngine(join(process.cwd(), "node_modules", "@prisma", "engines"));
const targetDir = join(process.cwd(), "node_modules", ".prisma", "client");
const target = join(targetDir, "query_engine-windows.dll.node");

if (engine && !existsSync(target)) {
  mkdirSync(targetDir, { recursive: true });
  copyFileSync(engine, target);
  console.log("Copied Prisma query engine for Windows");
}
