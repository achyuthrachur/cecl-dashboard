'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatPercent, formatCurrency } from '@/lib/utils'
import { CHART_COLORS } from '@/lib/colors'

interface DataPoint {
  period: string
  pd?: number
  lgd?: number
  ead?: number
  [key: string]: any
}

interface TimeSeriesChartProps {
  data: DataPoint[]
  metrics?: ('pd' | 'lgd' | 'ead')[]
  height?: number
  showGrid?: boolean
  title?: string
}

export function TimeSeriesChart({
  data,
  metrics = ['pd', 'lgd', 'ead'],
  height = 300,
  showGrid = true,
  title,
}: TimeSeriesChartProps) {
  const formatYAxis = (value: number, metric: string) => {
    if (metric === 'ead') {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `${(value * 100).toFixed(1)}%`
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name.toLowerCase() === 'ead') {
      return formatCurrency(value)
    }
    return formatPercent(value)
  }

  // Calculate if we need dual Y-axes (for EAD vs PD/LGD)
  const hasEAD = metrics.includes('ead')
  const hasPercentMetrics = metrics.some((m) => m === 'pd' || m === 'lgd')

  return (
    <div className="w-full" style={{ height }}>
      {title && (
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              opacity={0.5}
            />
          )}
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => {
              // Format as Q1 '21
              const date = new Date(value)
              const q = Math.ceil((date.getMonth() + 1) / 3)
              const year = date.getFullYear().toString().slice(-2)
              return `Q${q} '${year}`
            }}
          />
          {hasPercentMetrics && (
            <YAxis
              yAxisId="percent"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              domain={[0, 'auto']}
            />
          )}
          {hasEAD && (
            <YAxis
              yAxisId="ead"
              orientation="right"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
              domain={[0, 'auto']}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              formatTooltipValue(value, name),
              name.toUpperCase(),
            ]}
            labelFormatter={(label) => {
              const date = new Date(label)
              const q = Math.ceil((date.getMonth() + 1) / 3)
              return `Q${q} ${date.getFullYear()}`
            }}
          />
          <Legend />
          {metrics.includes('pd') && (
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="pd"
              name="PD"
              stroke={CHART_COLORS.pd}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
          {metrics.includes('lgd') && (
            <Line
              yAxisId="percent"
              type="monotone"
              dataKey="lgd"
              name="LGD"
              stroke={CHART_COLORS.lgd}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
          {metrics.includes('ead') && (
            <Line
              yAxisId="ead"
              type="monotone"
              dataKey="ead"
              name="EAD"
              stroke={CHART_COLORS.ead}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
