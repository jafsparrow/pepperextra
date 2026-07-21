// frontend/src/utils/orpc.ts
import { createORPCClient } from "@orpc/client"
import type { ContractRouterClient } from "@orpc/contract"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { contracts } from "@pepperextra/contracts" // Type-only import
import { OpenAPILink } from "@orpc/openapi-client/fetch"
import type { JsonifiedClient } from "@orpc/openapi-client"

// apps/web/src/lib/orpc.ts
const link = new OpenAPILink(contracts, {
  url: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  fetch: (request, init) =>
    fetch(request, {
      ...init,
      credentials: "include",
    }),
})

export const client: JsonifiedClient<ContractRouterClient<typeof contracts>> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)

// RPC link for orpc is different way of communication using only post request, OpenAPILink is the other way of connecting to support open Api

// 1. Establish the RPC client transport link
// const link = new RPCLink({
//   url: "http://localhost:3000/", // Your NestJS oRPC entrypoint URL
// })

// // 1. Convert the contract type to a client type, then annotate createORPCClient with it
// export const orpcClient: ContractRouterClient<typeof contracts> =
//   createORPCClient(link)
// // 2. Wrap client with TanStack Query utility builders
// export const orpcUtils = createTanstackQueryUtils(orpcClient)
