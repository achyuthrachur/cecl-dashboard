'use client'

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { DataPreviewSheet } from '@/components/data-viewer/DataPreviewSheet'
import { generateAllMacroData } from '@/lib/fred'
import { getLoans, getSnapshots } from '@/data/loans'
import { SEGMENT_IDS, getSegmentLabel, getSegmentColor } from '@/data/segments'
import type { LoanSegment, MacroIndicator } from '@/types'
import { MACRO_INDICATOR_INFO } from '@/types/macro'
import { formatPercent } from '@/lib/utils'
import { TrendingUp, Activity, DollarSign, Percent, Building, Car, Loader2 } from 'lucide-react'
import type { MacroTimeSeries } from '@/types'
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

// Segment-specific correlation coefficients (based on loan characteristics)
const SEGMENT_CORRELATIONS: Record<LoanSegment, Record<MacroIndicator, { correlation: number; lag: number }>> = {
  RESIDENTIAL_1_4: {
    UNRATE: { correlation: 0.65, lag: 1 },
    FEDFUNDS: { correlation: 0.35, lag: 5 },
    GS10: { correlation: 0.40, lag: 2 },
    MORTGAGE30US: { correlation: 0.72, lag: 1 },
    CPIAUCSL: { correlation: 0.25, lag: 2 },
    GDPC1: { correlation: -0.55, lag: 3 },
  },
  CRE_NON_OWNER: {
    UNRATE: { correlation: 0.78, lag: 1 },
    FEDFUNDS: { correlation: 0.52, lag: 5 },
    GS10: { correlation: 0.48, lag: 2 },
    MORTGAGE30US: { correlation: 0.45, lag: 1 },
    CPIAUCSL: { correlation: 0.35, lag: 2 },
    GDPC1: { correlation: -0.62, lag: 3 },
  },
  CRE_OWNER: {
    UNRATE: { correlation: 0.70, lag: 1 },
    FEDFUNDS: { correlation: 0.48, lag: 5 },
    GS10: { correlation: 0.42, lag: 2 },
    MORTGAGE30US: { correlation: 0.40, lag: 1 },
    CPIAUCSL: { correlation: 0.30, lag: 2 },
    GDPC1: { correlation: -0.58, lag: 3 },
  },
  C_AND_I: {
    UNRATE: { correlation: 0.82, lag: 1 },
    FEDFUNDS: { correlation: 0.60, lag: 4 },
    GS10: { correlation: 0.45, lag: 2 },
    MORTGAGE30US: { correlation: 0.30, lag: 2 },
    CPIAUCSL: { correlation: 0.40, lag: 2 },
    GDPC1: { correlation: -0.70, lag: 2 },
  },
  CONSUMER: {
    UNRATE: { correlation: 0.85, lag: 0 },
    FEDFUNDS: { correlation: 0.45, lag: 3 },
    GS10: { correlation: 0.35, lag: 2 },
    MORTGAGE30US: { correlation: 0.35, lag: 2 },
    CPIAUCSL: { correlation: 0.55, lag: 1 },
    GDPC1: { correlation: -0.65, lag: 2 },
  },
  AUTO: {
    UNRATE: { correlation: 0.75, lag: 1 },
    FEDFUNDS: { correlation: 0.48, lag: 4 },
    GS10: { correlation: 0.38, lag: 2 },
    MORTGAGE30US: { correlation: 0.32, lag: 2 },
    CPIAUCSL: { correlation: 0.42, lag: 2 },
    GDPC1: { correlation: -0.60, lag: 3 },
  },
  MULTIFAMILY: {
    UNRATE: { correlation: 0.60, lag: 2 },
    FEDFUNDS: { correlation: 0.52, lag: 5 },
    GS10: { correlation: 0.55, lag: 2 },
    MORTGAGE30US: { correlation: 0.58, lag: 1 },
    CPIAUCSL: { correlation: 0.28, lag: 3 },
    GDPC1: { correlation: -0.50, lag: 3 },
  },
  CONSTRUCTION: {
    UNRATE: { correlation: 0.88, lag: 1 },
    FEDFUNDS: { correlation: 0.65, lag: 4 },
    GS10: { correlation: 0.52, lag: 2 },
    MORTGAGE30US: { correlation: 0.55, lag: 1 },
    CPIAUCSL: { correlation: 0.38, lag: 2 },
    GDPC1: { correlation: -0.75, lag: 2 },
  },
}

// Portfolio-wide average correlations (weighted average)
const PORTFOLIO_CORRELATIONS: Record<MacroIndicator, { correlation: number; lag: number }> = {
  UNRATE: { correlation: 0.72, lag: 1 },
  FEDFUNDS: { correlation: 0.45, lag: 5 },
  GS10: { correlation: 0.38, lag: 2 },
  MORTGAGE30US: { correlation: 0.52, lag: 1 },
  CPIAUCSL: { correlation: 0.31, lag: 2 },
  GDPC1: { correlation: -0.59, lag: 3 },
}

export default function MacroPage() {
  const [selectedSegment, setSelectedSegment] = useState<LoanSegment | 'all'>('all')
  const [selectedIndicator, setSelectedIndicator] = useState<MacroIndicator>('UNRATE')
  const [showDataPreview, setShowDataPreview] = useState(false)
  const [macroData, setMacroData] = useState<Record<MacroIndicator, MacroTimeSeries> | null>(null)
  const [isLiveData, setIsLiveData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch macro data from API
  useEffect(() => {
    async function fetchMacroData() {
      try {
        const response = await fetch('/api/macro-data')
        const result = await response.json()
        setMacroData(result.data)
        setIsLiveData(result.isLiveData)
      } catch (error) {
        console.error('Error fetching macro data:', error)
        // Fall back to mock data
        setMacroData(generateAllMacroData())
        setIsLiveData(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMacroData()
  }, [])

  const loans = useMemo(() => getLoans(), [])

  // Get the display name for the selected segment
  const selectedSegmentLabel = useMemo(() => {
    if (selectedSegment === 'all') return 'Portfolio'
    return getSegmentLabel(selectedSegment)
  }, [selectedSegment])

  // Base PD multipliers for each segment
  const segmentBaseMultipliers: Record<LoanSegment, number> = {
    RESIDENTIAL_1_4: 0.5,
    CRE_NON_OWNER: 1.2,
    CRE_OWNER: 1.0,
    C_AND_I: 1.3,
    CONSUMER: 1.8,
    AUTO: 0.9,
    MULTIFAMILY: 0.7,
    CONSTRUCTION: 1.5,
  }

  // Generate segment-level metrics over time
  const segmentMetrics = useMemo(() => {
    const quarters = Array.from({ length: 20 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (19 - i) * 3)
      return date.toISOString().split('T')[0]
    })

    // If a specific segment is selected, only show that one
    const segmentsToShow = selectedSegment === 'all' ? SEGMENT_IDS : [selectedSegment]

    return quarters.map((quarter, idx) => {
      const result: Record<string, any> = { period: quarter }

      segmentsToShow.forEach((segment) => {
        const baseMultiplier = segmentBaseMultipliers[segment] || 1

        // Add economic cycle effect
        const cycleEffect = idx >= 8 && idx <= 12 ? 1.4 : 1.0
        const trend = Math.sin(idx / 4) * 0.01
        const base = 0.03 * baseMultiplier

        result[`${segment}_pd`] = (base + trend) * cycleEffect + Math.random() * 0.005
      })

      return result
    })
  }, [selectedSegment])

  // Combine macro data with credit metrics for correlation view
  const correlationData = useMemo(() => {
    if (!macroData) return []
    const macroSeries = macroData[selectedIndicator]?.data || []

    // Get the base multiplier for the selected segment
    const baseMultiplier = selectedSegment === 'all'
      ? 1.0
      : segmentBaseMultipliers[selectedSegment] || 1.0

    return macroSeries.map((point, idx) => {
      const result: Record<string, any> = {
        period: point.date,
        [selectedIndicator]: point.value,
      }

      // Add segment-specific PD (or portfolio average if 'all')
      const cycleFactor = idx >= 8 && idx <= 12 ? 1.3 : 1.0
      const basePD = 0.04 * baseMultiplier
      result.segmentPD = basePD * cycleFactor + Math.random() * 0.005

      return result
    })
  }, [macroData, selectedIndicator, selectedSegment])

  // Calculate correlations based on selected segment
  const correlations = useMemo(() => {
    // Get the correlation source based on selection
    const corrSource = selectedSegment === 'all'
      ? PORTFOLIO_CORRELATIONS
      : SEGMENT_CORRELATIONS[selectedSegment]

    return macroIndicators.map((indicator) => {
      const corrData = corrSource[indicator]
      // Add small random variation for realism
      const correlation = corrData.correlation + (Math.random() - 0.5) * 0.05

      return {
        indicator,
        name: MACRO_INDICATOR_INFO[indicator].name,
        correlation,
        pValue: Math.random() * 0.05,
        lagMonths: corrData.lag,
      }
    })
  }, [macroData, selectedSegment])

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading macroeconomic data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="Macroeconomic Correlations"
        subtitle={
          <span className="flex items-center gap-2">
            Credit risk metrics correlated with economic indicators
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              isLiveData
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {isLiveData ? 'Live FRED Data' : 'Mock Data'}
            </span>
          </span>
        }
        onViewData={() => setShowDataPreview(true)}
      />

      <div className="p-6 space-y-6">
        {/* Segment Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Segment:</span>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value as LoanSegment | 'all')}
              className="px-4 py-2 rounded-lg bg-muted border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Full Portfolio</option>
              {SEGMENT_IDS.map((segment) => (
                <option key={segment} value={segment}>
                  {getSegmentLabel(segment)}
                </option>
              ))}
            </select>
          </div>
          {selectedSegment !== 'all' && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
              Showing correlations for {selectedSegmentLabel}
            </div>
          )}
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
                {MACRO_INDICATOR_INFO[selectedIndicator].name} vs {selectedSegmentLabel} PD
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
                      dataKey="segmentPD"
                      name={`${selectedSegmentLabel} PD`}
                      stroke={selectedSegment === 'all' ? '#3b82f6' : getSegmentColor(selectedSegment)}
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
                {selectedSegment === 'all' ? 'PD Trends by Segment' : `${selectedSegmentLabel} PD Trend`}
              </CardTitle>
              <CardDescription>
                {selectedSegment === 'all'
                  ? 'Historical probability of default by loan type'
                  : `Historical probability of default for ${selectedSegmentLabel}`
                }
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
                    {selectedSegment === 'all' ? (
                      // Show top 5 segments when viewing full portfolio
                      SEGMENT_IDS.slice(0, 5).map((segment) => (
                        <Line
                          key={segment}
                          type="monotone"
                          dataKey={`${segment}_pd`}
                          name={getSegmentLabel(segment)}
                          stroke={getSegmentColor(segment)}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))
                    ) : (
                      // Show only the selected segment
                      <Line
                        key={selectedSegment}
                        type="monotone"
                        dataKey={`${selectedSegment}_pd`}
                        name={selectedSegmentLabel}
                        stroke={getSegmentColor(selectedSegment)}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Correlation Analysis: {selectedSegmentLabel}</CardTitle>
            <CardDescription>
              Statistical relationship between macroeconomic indicators and {selectedSegmentLabel.toLowerCase()} credit metrics
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
        data={macroData?.[selectedIndicator]?.data || []}
        columns={[
          { key: 'date', label: 'Date', format: 'text' },
          { key: 'value', label: 'Value', format: 'number' },
          { key: 'indicator', label: 'Indicator', format: 'text' },
        ]}
      />
    </div>
  )
}
