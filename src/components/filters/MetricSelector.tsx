'use client'

import { cn } from '@/lib/utils'
import type { MetricType } from '@/lib/colors'

interface MetricSelectorProps {
  value: MetricType
  onChange: (metric: MetricType) => void
}

const metrics: { value: MetricType; label: string; description: string }[] = [
  { value: 'pd', label: 'PD', description: 'Probability of Default' },
  { value: 'lgd', label: 'LGD', description: 'Loss Given Default' },
  { value: 'portfolioValue', label: 'Portfolio Value', description: 'Total Portfolio Value' },
]

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      {metrics.map((metric) => (
        <button
          key={metric.value}
          onClick={() => onChange(metric.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            value === metric.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={metric.description}
        >
          {metric.label}
        </button>
      ))}
    </div>
  )
}
