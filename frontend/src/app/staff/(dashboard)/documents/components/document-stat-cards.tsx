import { Files, Image as ImageIcon, FileSignature, HardDrive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ClinicDocument } from "@/types/document"

interface DocumentStatCardsProps {
  documents: ClinicDocument[]
}

export function DocumentStatCards({ documents }: DocumentStatCardsProps) {
  const total = documents.length
  const imaging = documents.filter((d) => d.category === "imaging").length
  const consentForms = documents.filter((d) => d.category === "consent_form").length
  const totalSizeKb = documents.reduce((sum, d) => sum + d.file_size_kb, 0)
  const storageUsed =
    totalSizeKb >= 1024
      ? `${(totalSizeKb / 1024).toFixed(1)} MB`
      : `${totalSizeKb} KB`

  const metrics = [
    { title: "Total Documents", value: total, icon: Files },
    { title: "Imaging Files", value: imaging, icon: ImageIcon },
    { title: "Consent Forms", value: consentForms, icon: FileSignature },
    { title: "Storage Used", value: storageUsed, icon: HardDrive },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border">
          <CardContent className="space-y-3">
            <metric.icon className="text-muted-foreground size-6" />
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm font-medium">
                {metric.title}
              </p>
              <div className="text-2xl font-bold">{metric.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}