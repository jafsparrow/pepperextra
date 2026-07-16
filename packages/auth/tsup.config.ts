import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    auth: "src/auth.ts",
    client: "src/client.ts",
  },
  format: ["esm"],
  clean: true,
})
