'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { formatPercent, formatCurrency } from '@/lib/utils'

interface Column {
  key: string
  label: string
  format?: 'percent' | 'currency' | 'number' | 'text'
}

interface DataPreviewSheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  data: any[]
  columns: Column[]
  onExport?: () => void
}

export function DataPreviewSheet({
  open,
  onClose,
  title,
  description,
  data,
  columns,
  onExport,
}: DataPreviewSheetProps) {
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-'
    switch (format) {
      case 'percent':
        return formatPercent(value)
      case 'currency':
        return formatCurrency(value)
      case 'number':
        return value.toLocaleString()
      default:
        return String(value)
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
      return
    }

    // Default CSV export
    const headers = columns.map((c) => c.label).join(',')
    const rows = data
      .map((row) => columns.map((c) => row[c.key] ?? '').join(','))
      .join('\n')
    const csv = `${headers}\n${rows}`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{title}</SheetTitle>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 100).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((col) => (
                        <td key={col.key} className="font-mono text-sm">
                          {formatValue(row[col.key], col.format)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.length > 100 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 100 of {data.length} records
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
