'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SEGMENTS, type SegmentConfig } from '@/data/segments'
import type { LoanSegment } from '@/types'

interface LoanTypeFilterProps {
  value: LoanSegment[]
  onChange: (segments: LoanSegment[]) => void
  multiSelect?: boolean
}

export function LoanTypeFilter({
  value,
  onChange,
  multiSelect = true,
}: LoanTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSegment = (segmentId: LoanSegment) => {
    if (multiSelect) {
      if (value.includes(segmentId)) {
        onChange(value.filter((s) => s !== segmentId))
      } else {
        onChange([...value, segmentId])
      }
    } else {
      onChange([segmentId])
      setIsOpen(false)
    }
  }

  const selectAll = () => {
    onChange(SEGMENTS.map((s) => s.id))
  }

  const clearAll = () => {
    onChange([])
  }

  const getLabel = () => {
    if (value.length === 0) return 'All Segments'
    if (value.length === SEGMENTS.length) return 'All Segments'
    if (value.length === 1) {
      return SEGMENTS.find((s) => s.id === value[0])?.shortLabel || value[0]
    }
    return `${value.length} Segments`
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[180px] justify-between"
      >
        <span>{getLabel()}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg">
            {multiSelect && (
              <div className="flex justify-between px-2 py-1 mb-1 border-b">
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto">
              {SEGMENTS.map((segment) => (
                <button
                  key={segment.id}
                  onClick={() => toggleSegment(segment.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md',
                    'hover:bg-accent transition-colors',
                    value.includes(segment.id) && 'bg-accent'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      value.includes(segment.id)
                        ? 'bg-primary border-primary'
                        : 'border-input'
                    )}
                  >
                    {value.includes(segment.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span>{segment.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
