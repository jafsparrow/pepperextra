import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Command } from "lucide-react"

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    // 1. Grid structure: 1 full column on mobile, 2 columns split on desktop screens (lg)
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[34px_34px] opacity-10" /> */}
      {/* LEFT COLUMN: The Interactive Form Container */}
      <div className="flex flex-col justify-between bg-background p-6 sm:p-10">
        {/* Upper Brand Mark */}
        <div className="flex items-center gap-2 font-medium tracking-tight">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Command className="h-4 w-4" />
          </div>
          <span>ThirdExtra Private Limited.</span>
        </div>

        {/* Center Target Box: Renders /login or /signup forms dynamically */}
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-12">
          <Outlet />
        </div>

        {/* Lower Legal Disclaimer Context */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* RIGHT COLUMN: The Visual Marketing Panel (Hidden entirely on small viewports) */}
      <div className="relative hidden bg-muted lg:block">
        {/* Dark subtle grid decorative overlay overlaying a dark background tint */}
        <div className="absolute inset-0 flex flex-col justify-between bg-neutral-950 p-10 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[34px_34px] opacity-10" />

          <div className="relative z-20 flex items-center text-lg font-medium">
            <span className="rounded-full border border-primary/30 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              v2.0 Active
            </span>
          </div>

          <div className="mt-auto text-5xl font-bold tracking-tight">
            PepperExtra Ordering App
          </div>

          {/* Testimonial callout block */}
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg font-normal tracking-tight text-neutral-200">
                &ldquo;This toolkit saved our engineering department hundreds of
                layout configuration hours. The routing speed alone is worth the
                subscription cost.&rdquo;
              </p>
              <footer className="text-sm font-light text-neutral-400">
                — Alex Rivera, CTO at Vanguard Analytics
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
