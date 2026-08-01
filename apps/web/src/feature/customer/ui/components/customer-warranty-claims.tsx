import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { ShieldCheck } from "lucide-react"
import { orpc } from "@/shared/utils/orpc"

const CLAIM_TYPE_LABELS: Record<string, string> = {
  replacement: "Replacement",
  service: "Service",
  refund: "Refund",
}

const RESOLUTION_LABELS: Record<string, string> = {
  replaced_same_brand: "Replaced same brand",
  replaced_alternative_brand: "Replaced alternative brand",
  refund_issued: "Refund issued",
  sent_for_service: "Sent for service",
  rejected: "Rejected",
}

interface CustomerWarrantyClaimsProps {
  orgId: string
  customerId: string
}

export function CustomerWarrantyClaims({
  orgId,
  customerId,
}: CustomerWarrantyClaimsProps) {
  const { data: claims, isLoading } = useQuery(
    orpc.customer.listWarrantyClaims.queryOptions({
      input: { organizationId: orgId, id: customerId },
      enabled: !!orgId && !!customerId,
    })
  )

  return (
    <Card className="border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Warranty claims
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading warranty claims..."
            : `${claims?.length ?? 0} warranty claim(s) for this customer.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/60" />
        ) : !claims || claims.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            No warranty claims recorded.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(claim.claimDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {CLAIM_TYPE_LABELS[claim.claimType] ?? claim.claimType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {claim.productName ?? claim.warrantyName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {claim.serialNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {claim.resolution
                      ? RESOLUTION_LABELS[claim.resolution] ?? claim.resolution
                      : claim.serviceStatus ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
