import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    auth: "src/auth.ts",
    client: "src/client.ts",
    roles: "src/admin-access-control/roles.ts",
  },
  format: ["esm"],
  clean: true,
})
