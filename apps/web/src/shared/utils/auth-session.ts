import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

const AUTH_API_URL = process.env.VITE_API_URL ?? "http://localhost:3000"

export interface ServerSession {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  session: {
    id: string
    token: string
    expiresAt: string
  }
}

export const getServerSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerSession | null> => {
    const request = getRequest()
    const res = await fetch(`${AUTH_API_URL}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    })
    if (!res.ok) return null
    return (await res.json()) as ServerSession | null
  }
)
