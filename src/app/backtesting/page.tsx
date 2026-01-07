'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataPreviewSheet } from '@/components/data-viewer/DataPreviewSheet'
import { SEGMENT_IDS, getSegmentLabel, getSegmentColor } from '@/data/segments'
import type { LoanSegment } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

// Segment-specific base loss amounts and model accuracy characteristics
const SEGMENT_BACKTEST_CONFIG: Record<LoanSegment, {
  baseLoss: number
  portfolioSize: number
  modelAccuracy: number // 0-1, how accurate the model is for this segment
  volatility: number // How volatile the actual losses are
  stressSensitivity: number // How much stress periods affect this segment
}> = {
  RESIDENTIAL_1_4: {
    baseLoss: 800000,
    portfolioSize: 150000000,
    modelAccuracy: 0.92,
    volatility: 0.15,
    stressSensitivity: 1.2,
  },
  CRE_NON_OWNER: {
    baseLoss: 1200000,
    portfolioSize: 180000000,
    modelAccuracy: 0.78,
    volatility: 0.35,
    stressSensitivity: 1.5,
  },
  CRE_OWNER: {
    baseLoss: 600000,
    portfolioSize: 120000000,
    modelAccuracy: 0.82,
    volatility: 0.28,
    stressSensitivity: 1.4,
  },
  C_AND_I: {
    baseLoss: 900000,
    portfolioSize: 140000000,
    modelAccuracy: 0.75,
    volatility: 0.40,
    stressSensitivity: 1.6,
  },
  CONSUMER: {
    baseLoss: 400000,
    portfolioSize: 60000000,
    modelAccuracy: 0.88,
    volatility: 0.20,
    stressSensitivity: 1.3,
  },
  AUTO: {
    baseLoss: 350000,
    portfolioSize: 55000000,
    modelAccuracy: 0.90,
    volatility: 0.18,
    stressSensitivity: 1.25,
  },
  MULTIFAMILY: {
    baseLoss: 500000,
    portfolioSize: 100000000,
    modelAccuracy: 0.85,
    volatility: 0.22,
    stressSensitivity: 1.2,
  },
  CONSTRUCTION: {
    baseLoss: 700000,
    portfolioSize: 80000000,
    modelAccuracy: 0.70,
    volatility: 0.45,
    stressSensitivity: 1.8,
  },
}

// Portfolio-wide config (weighted average)
const PORTFOLIO_BACKTEST_CONFIG = {
  baseLoss: 2500000,
  portfolioSize: 50000000,
  modelAccuracy: 0.82,
  volatility: 0.25,
  stressSensitivity: 1.3,
}

// Generate synthetic backtesting data
function generateBacktestingData(segment: LoanSegment | 'all') {
  const config = segment === 'all'
    ? PORTFOLIO_BACKTEST_CONFIG
    : SEGMENT_BACKTEST_CONFIG[segment]

  const quarters = []
  for (let year = 2020; year <= 2024; year++) {
    for (let q = 1; q <= 4; q++) {
      if (year === 2024 && q > 3) break
      quarters.push(`${year}-Q${q}`)
    }
  }

  // Use a seeded random for consistency per segment
  let seed = segment === 'all' ? 42 : SEGMENT_IDS.indexOf(segment as LoanSegment) * 100 + 42
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  return quarters.map((period, idx) => {
    // Base predicted loss with seasonal variation
    const seasonalFactor = 1 + Math.sin(idx / 2) * 0.2
    const basePredicted = config.baseLoss * seasonalFactor

    // Actual losses with segment-specific volatility
    const stressFactor = idx >= 8 && idx <= 12 ? config.stressSensitivity : 1.0
    const modelError = (seededRandom() - 0.5) * 2 * config.volatility
    const accuracyFactor = config.modelAccuracy + (1 - config.modelAccuracy) * modelError
    const baseActual = basePredicted * stressFactor * accuracyFactor

    const predicted = Math.round(basePredicted)
    const actual = Math.round(baseActual)
    const variance = actual - predicted
    const variancePercent = ((actual - predicted) / predicted) * 100

    return {
      period,
      predicted,
      actual,
      variance,
      variancePercent,
      reserveRatio: predicted / (config.portfolioSize + idx * 2000000),
      chargeOffRate: actual / (config.portfolioSize + idx * 2000000),
    }
  })
}

// Calculate backtesting metrics
function calculateMetrics(data: ReturnType<typeof generateBacktestingData>) {
  const n = data.length
  const errors = data.map((d) => d.actual - d.predicted)
  const absErrors = errors.map(Math.abs)
  const squaredErrors = errors.map((e) => e * e)

  const mae = absErrors.reduce((a, b) => a + b, 0) / n
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / n)
  const mape =
    data.reduce((sum, d) => sum + Math.abs(d.variancePercent), 0) / n
  const bias = errors.reduce((a, b) => a + b, 0) / n

  // Accuracy: % of quarters within 20% of actual
  const accurateCount = data.filter(
    (d) => Math.abs(d.variancePercent) <= 20
  ).length
  const accuracy = (accurateCount / n) * 100

  return { mae, rmse, mape, accuracy, bias }
}

export default function BacktestingPage() {
  const [showDataPreview, setShowDataPreview] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<LoanSegment | 'all'>('all')

  // Generate data based on selected segment
  const backtestData = useMemo(() => generateBacktestingData(selectedSegment), [selectedSegment])
  const metrics = useMemo(() => calculateMetrics(backtestData), [backtestData])

  // Get display name for current selection
  const segmentDisplayName = selectedSegment === 'all'
    ? 'Full Portfolio'
    : getSegmentLabel(selectedSegment)

  // Summary stats
  const totalPredicted = backtestData.reduce((sum, d) => sum + d.predicted, 0)
  const totalActual = backtestData.reduce((sum, d) => sum + d.actual, 0)
  const avgVariance = (totalActual - totalPredicted) / totalPredicted * 100

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="Backtesting Analysis"
        subtitle="Compare predicted credit losses against actual charge-offs"
        onViewData={() => setShowDataPreview(true)}
      />

      <div className="p-6 space-y-6">
        {/* Segment Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Segment:</span>
            <Select
              value={selectedSegment}
              onValueChange={(value) => setSelectedSegment(value as LoanSegment | 'all')}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Full Portfolio</SelectItem>
                {SEGMENT_IDS.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {getSegmentLabel(segment)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedSegment !== 'all' && (
            <div className="text-sm text-muted-foreground">
              Model accuracy for this segment:{' '}
              <span className="font-medium">
                {(SEGMENT_BACKTEST_CONFIG[selectedSegment].modelAccuracy * 100).toFixed(0)}%
              </span>
              {' · '}
              Volatility:{' '}
              <span className="font-medium">
                {(SEGMENT_BACKTEST_CONFIG[selectedSegment].volatility * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-xs">Accuracy</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${metrics.accuracy >= 80 ? 'text-success' : metrics.accuracy >= 60 ? 'text-warning' : 'text-danger'}`}>
                {metrics.accuracy.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">within 20% of actual</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">MAE</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(metrics.mae)}
              </p>
              <p className="text-xs text-muted-foreground">mean absolute error</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs">RMSE</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(metrics.rmse)}
              </p>
              <p className="text-xs text-muted-foreground">root mean sq error</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">MAPE</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {metrics.mape.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">mean abs % error</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                {metrics.bias > 0 ? (
                  <TrendingUp className="h-4 w-4 text-danger" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success" />
                )}
                <span className="text-xs">Model Bias</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${metrics.bias > 0 ? 'text-danger' : 'text-success'}`}>
                {metrics.bias > 0 ? '+' : ''}{formatCurrency(metrics.bias)}
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.bias > 0 ? 'under-predicts' : 'over-predicts'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card glass>
          <CardHeader>
            <CardTitle>Predicted vs Actual Losses — {segmentDisplayName}</CardTitle>
            <CardDescription>
              Quarterly comparison of model predictions against realized charge-offs for {segmentDisplayName.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={backtestData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="predicted"
                    name="Predicted Loss"
                    fill="#3b82f6"
                    opacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Loss"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variance Chart */}
          <Card glass>
            <CardHeader>
              <CardTitle>Prediction Variance — {segmentDisplayName}</CardTitle>
              <CardDescription>
                Percentage difference between predicted and actual for {segmentDisplayName.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={backtestData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v.toFixed(0)}%`}
                      domain={[-50, 50]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Variance']}
                    />
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                    <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={-20} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                    <Bar
                      dataKey="variancePercent"
                      name="Variance %"
                      radius={[4, 4, 4, 4]}
                    >
                      {backtestData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.variancePercent > 0 ? '#ef4444' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card glass>
            <CardHeader>
              <CardTitle>Cumulative Performance — {segmentDisplayName}</CardTitle>
              <CardDescription>
                Overall model performance across the backtesting period for {segmentDisplayName.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Predicted</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(totalPredicted)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Actual</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(totalActual)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cumulative Variance</p>
                    <p className={`text-2xl font-bold ${avgVariance > 0 ? 'text-danger' : 'text-success'}`}>
                      {avgVariance > 0 ? '+' : ''}{avgVariance.toFixed(1)}%
                    </p>
                  </div>
                  {Math.abs(avgVariance) <= 10 ? (
                    <CheckCircle className="h-10 w-10 text-success" />
                  ) : Math.abs(avgVariance) <= 20 ? (
                    <AlertTriangle className="h-10 w-10 text-warning" />
                  ) : (
                    <XCircle className="h-10 w-10 text-danger" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.abs(avgVariance) <= 10
                    ? 'Model performance is within acceptable range'
                    : Math.abs(avgVariance) <= 20
                    ? 'Model may require calibration adjustment'
                    : 'Model requires significant recalibration'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quarters within ±20%</span>
                  <span className="font-medium">
                    {backtestData.filter((d) => Math.abs(d.variancePercent) <= 20).length} / {backtestData.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Under-prediction quarters</span>
                  <span className="font-medium text-danger">
                    {backtestData.filter((d) => d.variancePercent > 0).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Over-prediction quarters</span>
                  <span className="font-medium text-success">
                    {backtestData.filter((d) => d.variancePercent < 0).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Detail — {segmentDisplayName}</CardTitle>
            <CardDescription>
              Period-by-period backtesting results for {segmentDisplayName.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="data-table">
                  <thead className="sticky top-0">
                    <tr>
                      <th>Period</th>
                      <th className="text-right">Predicted Loss</th>
                      <th className="text-right">Actual Loss</th>
                      <th className="text-right">Variance ($)</th>
                      <th className="text-right">Variance (%)</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestData.map((row) => (
                      <tr key={row.period}>
                        <td className="font-medium">{row.period}</td>
                        <td className="text-right font-mono">{formatCurrency(row.predicted)}</td>
                        <td className="text-right font-mono">{formatCurrency(row.actual)}</td>
                        <td className={`text-right font-mono ${row.variance > 0 ? 'text-danger' : 'text-success'}`}>
                          {row.variance > 0 ? '+' : ''}{formatCurrency(row.variance)}
                        </td>
                        <td className={`text-right font-mono ${row.variancePercent > 0 ? 'text-danger' : 'text-success'}`}>
                          {row.variancePercent > 0 ? '+' : ''}{row.variancePercent.toFixed(1)}%
                        </td>
                        <td className="text-center">
                          {Math.abs(row.variancePercent) <= 20 ? (
                            <CheckCircle className="h-4 w-4 text-success inline" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview Sheet */}
      <DataPreviewSheet
        open={showDataPreview}
        onClose={() => setShowDataPreview(false)}
        title={`Backtesting Data — ${segmentDisplayName}`}
        description={`Predicted vs actual loss comparison by quarter for ${segmentDisplayName.toLowerCase()}`}
        data={backtestData}
        columns={[
          { key: 'period', label: 'Period', format: 'text' },
          { key: 'predicted', label: 'Predicted', format: 'currency' },
          { key: 'actual', label: 'Actual', format: 'currency' },
          { key: 'variance', label: 'Variance ($)', format: 'currency' },
          { key: 'variancePercent', label: 'Variance (%)', format: 'percent' },
        ]}
      />
    </div>
  )
}
