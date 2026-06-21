import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  tsconfig: "tsconfig.json",
  // package.json dependencies stay external (better-sqlite3, puppeteer-core, …)
});
