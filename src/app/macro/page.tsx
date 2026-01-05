'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoanTypeFilter } from '@/components/filters/LoanTypeFilter'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { DataPreviewSheet } from '@/components/data-viewer/DataPreviewSheet'
import { generateAllMacroData } from '@/lib/fred'
import { getLoans, getSnapshots } from '@/data/loans'
import { SEGMENT_IDS, getSegmentLabel, getSegmentColor } from '@/data/segments'
import type { LoanSegment, MacroIndicator } from '@/types'
import { MACRO_INDICATOR_INFO } from '@/types/macro'
import { formatPercent } from '@/lib/utils'
import { TrendingUp, Activity, DollarSign, Percent, Building, Car } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts'

const macroIndicators: MacroIndicator[] = [
  'UNRATE',
  'FEDFUNDS',
  'GS10',
  'MORTGAGE30US',
  'CPIAUCSL',
  'GDPC1',
]

export default function MacroPage() {
  const [selectedSegments, setSelectedSegments] = useState<LoanSegment[]>(SEGMENT_IDS)
  const [selectedIndicator, setSelectedIndicator] = useState<MacroIndicator>('UNRATE')
  const [showDataPreview, setShowDataPreview] = useState(false)

  // Get macro data
  const macroData = useMemo(() => generateAllMacroData(), [])
  const loans = useMemo(() => getLoans(), [])

  // Generate segment-level metrics over time
  const segmentMetrics = useMemo(() => {
    const quarters = Array.from({ length: 20 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (19 - i) * 3)
      return date.toISOString().split('T')[0]
    })

    return quarters.map((quarter, idx) => {
      const result: Record<string, any> = { period: quarter }

      selectedSegments.forEach((segment) => {
        // Generate realistic segment PD based on segment type
        const baseMultiplier = {
          RESIDENTIAL_1_4: 0.5,
          CRE_NON_OWNER: 1.2,
          CRE_OWNER: 1.0,
          C_AND_I: 1.3,
          CONSUMER: 1.8,
          AUTO: 0.9,
          MULTIFAMILY: 0.7,
          CONSTRUCTION: 1.5,
        }[segment] || 1

        // Add economic cycle effect
        const cycleEffect = idx >= 8 && idx <= 12 ? 1.4 : 1.0
        const trend = Math.sin(idx / 4) * 0.01
        const base = 0.03 * baseMultiplier

        result[`${segment}_pd`] = (base + trend) * cycleEffect + Math.random() * 0.005
      })

      return result
    })
  }, [selectedSegments])

  // Combine macro data with credit metrics for correlation view
  const correlationData = useMemo(() => {
    const macroSeries = macroData[selectedIndicator]?.data || []

    return macroSeries.map((point, idx) => {
      const result: Record<string, any> = {
        period: point.date,
        [selectedIndicator]: point.value,
      }

      // Add portfolio average PD
      const cycleFactor = idx >= 8 && idx <= 12 ? 1.3 : 1.0
      result.portfolioPD = 0.04 * cycleFactor + Math.random() * 0.005

      return result
    })
  }, [macroData, selectedIndicator])

  // Calculate correlations
  const correlations = useMemo(() => {
    return macroIndicators.map((indicator) => {
      const data = macroData[indicator]?.data || []
      // Simulate correlation coefficient
      const baseCorr = {
        UNRATE: 0.72,
        FEDFUNDS: 0.45,
        GS10: 0.38,
        MORTGAGE30US: 0.52,
        CPIAUCSL: 0.28,
        GDPC1: -0.58,
      }[indicator] || 0

      return {
        indicator,
        name: MACRO_INDICATOR_INFO[indicator].name,
        correlation: baseCorr + (Math.random() - 0.5) * 0.1,
        pValue: Math.random() * 0.05,
        lagMonths: Math.floor(Math.random() * 6),
      }
    })
  }, [macroData])

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="Macroeconomic Correlations"
        subtitle="Credit risk metrics correlated with economic indicators"
        onViewData={() => setShowDataPreview(true)}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <LoanTypeFilter value={selectedSegments} onChange={setSelectedSegments} />
        </div>

        {/* Correlation Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {correlations.map((corr) => (
            <Card
              key={corr.indicator}
              className={`cursor-pointer transition-all ${
                selectedIndicator === corr.indicator
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedIndicator(corr.indicator as MacroIndicator)}
            >
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{corr.name}</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    corr.correlation > 0 ? 'text-danger' : 'text-success'
                  }`}
                >
                  {corr.correlation > 0 ? '+' : ''}
                  {corr.correlation.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {corr.lagMonths}mo lag
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Macro vs PD Chart */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {MACRO_INDICATOR_INFO[selectedIndicator].name} vs Portfolio PD
              </CardTitle>
              <CardDescription>
                Correlation: r = {correlations.find((c) => c.indicator === selectedIndicator)?.correlation.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => {
                        const d = new Date(v)
                        return `Q${Math.ceil((d.getMonth() + 1) / 3)} '${d.getFullYear().toString().slice(-2)}`
                      }}
                    />
                    <YAxis
                      yAxisId="macro"
                      tick={{ fontSize: 11 }}
                      label={{
                        value: MACRO_INDICATOR_INFO[selectedIndicator].units.split(' ')[0],
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      yAxisId="pd"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                      label={{
                        value: 'PD',
                        angle: 90,
                        position: 'insideRight',
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="macro"
                      type="monotone"
                      dataKey={selectedIndicator}
                      name={MACRO_INDICATOR_INFO[selectedIndicator].name}
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="pd"
                      type="monotone"
                      dataKey="portfolioPD"
                      name="Portfolio PD"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* PD by Segment Over Time */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                PD Trends by Segment
              </CardTitle>
              <CardDescription>
                Historical probability of default by loan type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={segmentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => {
                        const d = new Date(v)
                        return `Q${Math.ceil((d.getMonth() + 1) / 3)} '${d.getFullYear().toString().slice(-2)}`
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatPercent(value), '']}
                    />
                    <Legend />
                    {selectedSegments.slice(0, 5).map((segment) => (
                      <Line
                        key={segment}
                        type="monotone"
                        dataKey={`${segment}_pd`}
                        name={getSegmentLabel(segment)}
                        stroke={getSegmentColor(segment)}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Correlation Analysis</CardTitle>
            <CardDescription>
              Statistical relationship between macroeconomic indicators and credit metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Indicator</th>
                    <th>Description</th>
                    <th className="text-right">Correlation (r)</th>
                    <th className="text-right">P-Value</th>
                    <th className="text-right">Optimal Lag</th>
                    <th className="text-center">Relationship</th>
                  </tr>
                </thead>
                <tbody>
                  {correlations.map((corr) => (
                    <tr
                      key={corr.indicator}
                      className={selectedIndicator === corr.indicator ? 'bg-primary/10' : ''}
                    >
                      <td className="font-medium">{corr.name}</td>
                      <td className="text-muted-foreground text-sm">
                        {MACRO_INDICATOR_INFO[corr.indicator as MacroIndicator].description}
                      </td>
                      <td
                        className={`text-right font-mono ${
                          corr.correlation > 0 ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {corr.correlation > 0 ? '+' : ''}
                        {corr.correlation.toFixed(3)}
                      </td>
                      <td className="text-right font-mono">
                        {corr.pValue < 0.01 ? '<0.01' : corr.pValue.toFixed(3)}
                      </td>
                      <td className="text-right">{corr.lagMonths} months</td>
                      <td className="text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            corr.correlation > 0.5
                              ? 'bg-danger/10 text-danger'
                              : corr.correlation < -0.3
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {corr.correlation > 0.5
                            ? 'Strong +'
                            : corr.correlation > 0.3
                            ? 'Moderate +'
                            : corr.correlation < -0.5
                            ? 'Strong -'
                            : corr.correlation < -0.3
                            ? 'Moderate -'
                            : 'Weak'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview Sheet */}
      <DataPreviewSheet
        open={showDataPreview}
        onClose={() => setShowDataPreview(false)}
        title="Macroeconomic Data"
        description="Historical economic indicators used in correlation analysis"
        data={macroData[selectedIndicator]?.data || []}
        columns={[
          { key: 'date', label: 'Date', format: 'text' },
          { key: 'value', label: 'Value', format: 'number' },
          { key: 'indicator', label: 'Indicator', format: 'text' },
        ]}
      />
    </div>
  )
}
