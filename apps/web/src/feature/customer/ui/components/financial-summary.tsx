import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Wallet, AlertTriangle, Receipt, PiggyBank } from "lucide-react"
import { useCurrency } from "@/shared/org/use-currency"
import type { CustomerFinancialSummary } from "@repo/contracts"

interface FinancialSummaryProps {
  summary: CustomerFinancialSummary
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
  const { format } = useCurrency()

  const items = [
    {
      label: "Outstanding",
      value: summary.outstandingMinor,
      icon: Wallet,
      className: "text-destructive",
      accent: "from-destructive/10 to-transparent",
    },
    {
      label: "Overdue",
      value: summary.overdueMinor,
      icon: AlertTriangle,
      className: "text-amber-600",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      label: "Total billed",
      value: summary.totalBilledMinor,
      icon: Receipt,
      className: "text-primary",
      accent: "from-primary/10 to-transparent",
    },
    {
      label: "Credit remaining",
      value: summary.creditRemainingMinor,
      icon: PiggyBank,
      className: "text-emerald-600",
      accent: "from-emerald-500/10 to-transparent",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className="relative overflow-hidden border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm"
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-br",
              item.accent
            )}
          />
          <CardHeader className="relative pb-1">
            <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
              <item.icon className={cn("h-3.5 w-3.5", item.className)} />
              {item.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <CardTitle
              className={cn(
                "text-2xl font-black tabular-nums tracking-tight",
                item.className
              )}
            >
              {format(item.value ?? "0")}
            </CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
