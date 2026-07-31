import { createFileRoute, Link } from "@tanstack/react-router"
import { useAdminContext } from "./route"
import {
  Package,
  Layers,
  Truck,
  Users,
  ArrowRight,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export const Route = createFileRoute("/_app/org/admin/")({
  component: AdminHub,
})

const sections = [
  {
    title: "Products",
    description: "Manage catalog products, SKUs, pricing and units.",
    to: "/org/admin/products",
    icon: Package,
    accent: "bg-primary/10 text-primary",
  },
  {
    title: "Categories",
    description: "Group products by spec name and set brand priorities.",
    to: "/org/admin/categories",
    icon: Layers,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Suppliers",
    description: "Manage vendors and their payment terms.",
    to: "/org/admin/suppliers",
    icon: Truck,
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "Customers",
    description: "Manage retail, account and contractor customers.",
    to: "/org/admin/customers",
    icon: Users,
    accent: "bg-amber-500/10 text-amber-600",
  },
] as const

function AdminHub() {
  const { orgId } = useAdminContext()
  void orgId

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Manage your business</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a section below to start managing your catalog and accounts.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                section.accent
              )}
            >
              <section.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {section.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  )
}
