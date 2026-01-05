'use client'

import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Database, Download } from 'lucide-react'

interface HeaderProps {
  onViewData?: () => void
  title?: string
  subtitle?: string
}

export function Header({ onViewData, title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onViewData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewData}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              View Data
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
