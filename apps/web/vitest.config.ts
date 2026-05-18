import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    alias: {
      "@gamepulse/database": path.resolve(__dirname, "../../packages/database/src/index.ts"),
      "@gamepulse/config": path.resolve(__dirname, "../../packages/config/src/index.ts"),
      "@/": path.resolve(__dirname, "./src/"),
    },
  },
});
