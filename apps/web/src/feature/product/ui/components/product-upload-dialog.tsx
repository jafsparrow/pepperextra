import { useRef, useState } from "react"
import type { ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { PRODUCT_QUERY_KEYS } from "../../constants"
import type { ProductUploadReport } from "@repo/contracts"

const TEMPLATE_HEADERS =
  "name,sku_code,spec_code,brand_tag,base_price,unit,aliases,reorder_threshold,group,category"
const TEMPLATE_SAMPLE =
  "Ordinary Portland Cement 50kg,CEM-OPC-50,OPC 42.5N,Royal Omani,3.250,bag,cement|اسمنت,100,Cement & Gypsum,Cement"

interface ProductUploadDialogProps {
  orgId: string
  children?: ReactNode
}

export function ProductUploadDialog({
  orgId,
  children,
}: ProductUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [report, setReport] = useState<ProductUploadReport | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (value) {
      setReport(null)
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const content = `${TEMPLATE_HEADERS}\n${TEMPLATE_SAMPLE}`
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "product-import-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file")
      return
    }
    setUploading(true)
    setReport(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000"
      const res = await fetch(
        `${apiUrl}/organizations/${orgId}/products/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.message ?? "Upload failed")
        return
      }

      setReport(body)
      queryClient.invalidateQueries({
        queryKey: PRODUCT_QUERY_KEYS.lists(),
      })
      toast.success(
        body.failed === 0
          ? `${body.inserted} of ${body.total} products imported`
          : `${body.inserted} of ${body.total} products imported (${body.failed} errors)`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            Import products from CSV
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import products from CSV</DialogTitle>
          <DialogDescription>
            Download the template, fill it in, then upload to add products to
            your catalog in bulk. Group and category columns match by name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onFileChange}
            />
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Choose a CSV file</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expected columns: name, sku_code, base_price, group, category and
              more.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Choose CSV file"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Product import template</p>
              <p className="text-xs text-muted-foreground">
                Starter CSV with the expected columns and a sample row.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          {report && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Total rows
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {report.total}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-emerald-500/10 p-3 text-center">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Imported
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-lg font-bold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {report.inserted}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-destructive/10 p-3 text-center">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Failed
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-lg font-bold text-destructive">
                    <XCircle className="h-4 w-4" />
                    {report.failed}
                  </p>
                </div>
              </div>

              {report.errors.length > 0 && (
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                  {report.errors.map((error) => (
                    <p
                      key={error.row}
                      className="flex items-start gap-1.5 px-1 py-0.5 text-xs text-foreground"
                    >
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span>
                        <span className="font-semibold">Row {error.row}:</span>{" "}
                        {error.message}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
