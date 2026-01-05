'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataPreviewSheet } from '@/components/data-viewer/DataPreviewSheet'
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
} from 'recharts'

// Generate synthetic backtesting data
function generateBacktestingData() {
  const quarters = []
  for (let year = 2020; year <= 2024; year++) {
    for (let q = 1; q <= 4; q++) {
      if (year === 2024 && q > 3) break
      quarters.push(`${year}-Q${q}`)
    }
  }

  return quarters.map((period, idx) => {
    // Base predicted loss with seasonal variation
    const basePredicted = 2500000 + Math.sin(idx / 2) * 500000

    // Actual losses with more volatility
    const stressFactor = idx >= 8 && idx <= 12 ? 1.3 : 1.0
    const baseActual = basePredicted * stressFactor * (0.85 + Math.random() * 0.3)

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
      reserveRatio: predicted / (50000000 + idx * 2000000),
      chargeOffRate: actual / (50000000 + idx * 2000000),
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

  // Generate data
  const backtestData = useMemo(() => generateBacktestingData(), [])
  const metrics = useMemo(() => calculateMetrics(backtestData), [backtestData])

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
            <CardTitle>Predicted vs Actual Losses</CardTitle>
            <CardDescription>
              Quarterly comparison of model predictions against realized charge-offs
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
              <CardTitle>Prediction Variance</CardTitle>
              <CardDescription>
                Percentage difference between predicted and actual
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
                      fill={(entry: any) =>
                        entry.variancePercent > 0 ? '#ef4444' : '#10b981'
                      }
                      radius={[4, 4, 4, 4]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card glass>
            <CardHeader>
              <CardTitle>Cumulative Performance</CardTitle>
              <CardDescription>
                Overall model performance across the backtesting period
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
            <CardTitle>Quarterly Detail</CardTitle>
            <CardDescription>
              Period-by-period backtesting results
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
        title="Backtesting Data"
        description="Predicted vs actual loss comparison by quarter"
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
