import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildStandaloneSvg } from "../lib/symbolPrimitives.js";
import { symbols } from "../lib/symbols.js";

const outputDir = path.resolve(process.cwd(), "public", "symbols");

await mkdir(outputDir, { recursive: true });

await Promise.all(
  symbols.map(async (symbol) => {
    const svg = buildStandaloneSvg(symbol, 160);
    await writeFile(path.join(outputDir, `${symbol.id}.svg`), `${svg}\n`, "utf8");
  })
);

await writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(
    symbols.map((symbol) => ({
      id: symbol.id,
      label: symbol.label,
      category: symbol.category,
      file: `/symbols/${symbol.id}.svg`
    })),
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Generated ${symbols.length} symbols in ${outputDir}`);
