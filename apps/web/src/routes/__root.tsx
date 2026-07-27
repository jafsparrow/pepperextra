import type { QueryClient } from "@tanstack/react-query"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import appCss from "@workspace/ui/globals.css?url"
import { Toaster } from "@workspace/ui/components/sonner"
import { seo } from "@/shared/utils/seo"
import { DefaultCatchBoundary } from "@/shared/components/default-catch-boundary"
import { NotFound } from "@/shared/components/not-found"
import { ThemeProvider } from "@workspace/ui/lib/theme-provider"

import { deploymentModeQueryOptions } from "@/shared/utils/deployment-mode"
import { authClient } from "@pepperextra/auth/client"

interface MyRouterContext {
  queryClient: QueryClient
  deploymentMode?: "local" | "cloud"
}
export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const mode = await queryClient.ensureQueryData(deploymentModeQueryOptions)

    if (location.pathname !== "/reset-password") {
      const { data } = await authClient.getSession()
      if (data?.user?.passwordResetRequired) {
        throw redirect({ to: "/reset-password" })
      }
    }

    return {
      deploymentMode: mode,
    }
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title:
          "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          {children}{" "}
        </ThemeProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
