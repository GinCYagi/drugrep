import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// tsconfig の `@/*`（プロジェクトルート基準）を vitest でも解決できるようにする。
const root = fileURLToPath(new URL(".", import.meta.url))
  .replace(/\\/g, "/")
  .replace(/\/$/, "");

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "node",
  },
});
