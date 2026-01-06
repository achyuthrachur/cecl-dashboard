'use client'

import { getColorSteps, type MetricType } from '@/lib/colors'
import { formatPercent, formatCurrency } from '@/lib/utils'

interface MetricLegendProps {
  metric: MetricType
}

export function MetricLegend({ metric }: MetricLegendProps) {
  const colorSteps = getColorSteps(metric, 5)

  const formatValue = (value: number) => {
    if (metric === 'portfolioValue') {
      // Portfolio Value is normalized 0-1, so show as percentage of max
      return `${(value * 100).toFixed(0)}%`
    }
    return formatPercent(value, 1)
  }

  const getLabel = () => {
    switch (metric) {
      case 'pd':
        return 'Probability of Default'
      case 'lgd':
        return 'Loss Given Default'
      case 'portfolioValue':
        return 'Portfolio Value Concentration'
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{getLabel()}</p>
      <div className="flex items-center gap-1">
        {colorSteps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className="w-8 h-4 rounded-sm"
              style={{ backgroundColor: step.color }}
            />
            <span className="text-xs text-muted-foreground mt-1">
              {formatValue(step.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Low Risk</span>
        <span>High Risk</span>
      </div>
    </div>
  )
}
