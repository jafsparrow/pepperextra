import { createORPCClient } from "@orpc/client"
import type { ContractRouterClient } from "@orpc/contract"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { contracts } from "@repo/contracts"
import { OpenAPILink } from "@orpc/openapi-client/fetch"
import type { JsonifiedClient } from "@orpc/openapi-client"

import { authClient } from "@/lib/auth-client"

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

const link = new OpenAPILink(contracts, {
  url: baseURL,
  fetch: (request, init) => {
    const headers: Record<string, string> = {}
    const cookie = authClient.getCookie()
    if (cookie) {
      headers.Cookie = cookie
    }
    return fetch(request, { ...init, headers })
  },
})

export const client: JsonifiedClient<ContractRouterClient<typeof contracts>> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
