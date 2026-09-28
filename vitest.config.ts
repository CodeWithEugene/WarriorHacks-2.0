import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/conformance/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["lib/heat/**", "lib/rules/**", "lib/conditions/**"],
    },
  },
})
