'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { formatPercent, formatCurrency, formatCompactNumber } from '@/lib/utils'
import { getLoans, getSnapshots } from '@/data/loans'
import { SEGMENT_CONFIG, type SegmentConfig } from '@/data/segments'
import type { LoanSegment, Loan, LoanMetricsSnapshot, MacroIndicator, MacroTimeSeries } from '@/types'
import { MACRO_INDICATOR_INFO } from '@/types/macro'
import { generateAllMacroData } from '@/lib/fred'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const RISK_COLORS = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
}

export default function SegmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const segmentId = params.id as LoanSegment

  const [macroData, setMacroData] = useState<Record<MacroIndicator, MacroTimeSeries> | null>(null)
  const [isLiveData, setIsLiveData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch macro data
  useEffect(() => {
    async function fetchMacroData() {
      try {
        const response = await fetch('/api/macro-data')
        const result = await response.json()
        setMacroData(result.data)
        setIsLiveData(result.isLiveData)
      } catch (error) {
        console.error('Error fetching macro data:', error)
        setMacroData(generateAllMacroData())
        setIsLiveData(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMacroData()
  }, [])

  // Get segment config
  const segmentConfig = SEGMENT_CONFIG[segmentId]

  // Get loan and snapshot data
  const loans = useMemo(() => getLoans(), [])
  const snapshots = useMemo(() => getSnapshots(), [])

  // Filter loans for this segment
  const segmentLoans = useMemo(() => {
    return loans.filter(loan => loan.segment === segmentId)
  }, [loans, segmentId])

  // Get latest snapshots for segment loans
  const latestSnapshots = useMemo(() => {
    const snapshotMap = new Map<string, LoanMetricsSnapshot>()
    snapshots.forEach(snapshot => {
      const loan = segmentLoans.find(l => l.loanId === snapshot.loanId)
      if (loan) {
        const existing = snapshotMap.get(snapshot.loanId)
        if (!existing || snapshot.snapshotDate > existing.snapshotDate) {
          snapshotMap.set(snapshot.loanId, snapshot)
        }
      }
    })
    return Array.from(snapshotMap.values())
  }, [snapshots, segmentLoans])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalExposure = segmentLoans.reduce((sum, loan) => sum + loan.currentBalance, 0)
    const loanCount = segmentLoans.length
    const avgPD = latestSnapshots.length > 0
      ? latestSnapshots.reduce((sum, s) => sum + s.pd, 0) / latestSnapshots.length
      : segmentConfig?.pd.avg || 0
    const avgLGD = latestSnapshots.length > 0
      ? latestSnapshots.reduce((sum, s) => sum + s.lgd, 0) / latestSnapshots.length
      : segmentConfig?.lgd.avg || 0
    const totalECL = latestSnapshots.reduce((sum, s) => sum + s.expectedLoss, 0)
    const chargedOff = segmentLoans.filter(l => l.isChargedOff).length

    return {
      totalExposure,
      loanCount,
      avgPD,
      avgLGD,
      totalECL,
      chargedOff,
      chargeOffRate: loanCount > 0 ? chargedOff / loanCount : 0,
    }
  }, [segmentLoans, latestSnapshots, segmentConfig])

  // Generate historical PD/LGD data (simulated quarters)
  const historicalData = useMemo(() => {
    const quarters = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i) * 3)
      return date
    })

    const basePD = segmentConfig?.pd.avg || 0.04
    const baseLGD = segmentConfig?.lgd.avg || 0.40

    return quarters.map((date, idx) => {
      // Add realistic variation and trend
      const cycleEffect = idx >= 6 && idx <= 9 ? 1.3 : 1.0
      const trend = Math.sin(idx / 3) * 0.005
      const noise = (Math.random() - 0.5) * 0.01

      return {
        period: `Q${Math.ceil((date.getMonth() + 1) / 3)} '${date.getFullYear().toString().slice(-2)}`,
        date: date.toISOString().split('T')[0],
        pd: Math.max(0.001, (basePD + trend + noise) * cycleEffect),
        lgd: Math.max(0.1, baseLGD + (Math.random() - 0.5) * 0.05),
        ecl: Math.max(0, summaryMetrics.totalExposure * (basePD + trend) * baseLGD * cycleEffect / 12),
      }
    })
  }, [segmentConfig, summaryMetrics.totalExposure])

  // Calculate macro correlations for this segment
  const macroCorrelations = useMemo(() => {
    if (!macroData) return []

    const indicators: MacroIndicator[] = ['UNRATE', 'FEDFUNDS', 'GS10', 'MORTGAGE30US', 'CPIAUCSL', 'GDPC1']

    // Segment-specific correlation adjustments
    const segmentCorrelations: Record<string, Record<MacroIndicator, number>> = {
      RESIDENTIAL_1_4: { UNRATE: 0.65, FEDFUNDS: 0.35, GS10: 0.40, MORTGAGE30US: 0.72, CPIAUCSL: 0.25, GDPC1: -0.55 },
      CRE_NON_OWNER: { UNRATE: 0.78, FEDFUNDS: 0.55, GS10: 0.48, MORTGAGE30US: 0.45, CPIAUCSL: 0.35, GDPC1: -0.62 },
      CRE_OWNER: { UNRATE: 0.70, FEDFUNDS: 0.50, GS10: 0.42, MORTGAGE30US: 0.40, CPIAUCSL: 0.30, GDPC1: -0.58 },
      C_AND_I: { UNRATE: 0.82, FEDFUNDS: 0.60, GS10: 0.45, MORTGAGE30US: 0.30, CPIAUCSL: 0.40, GDPC1: -0.70 },
      CONSUMER: { UNRATE: 0.85, FEDFUNDS: 0.45, GS10: 0.35, MORTGAGE30US: 0.35, CPIAUCSL: 0.50, GDPC1: -0.65 },
      AUTO: { UNRATE: 0.75, FEDFUNDS: 0.48, GS10: 0.38, MORTGAGE30US: 0.32, CPIAUCSL: 0.42, GDPC1: -0.60 },
      MULTIFAMILY: { UNRATE: 0.60, FEDFUNDS: 0.52, GS10: 0.55, MORTGAGE30US: 0.58, CPIAUCSL: 0.28, GDPC1: -0.50 },
      CONSTRUCTION: { UNRATE: 0.88, FEDFUNDS: 0.65, GS10: 0.52, MORTGAGE30US: 0.55, CPIAUCSL: 0.38, GDPC1: -0.75 },
    }

    const baseCorrelations = segmentCorrelations[segmentId] || segmentCorrelations.CRE_NON_OWNER

    return indicators.map(indicator => ({
      indicator,
      name: MACRO_INDICATOR_INFO[indicator].name,
      correlation: baseCorrelations[indicator] + (Math.random() - 0.5) * 0.08,
      currentValue: macroData[indicator]?.data.slice(-1)[0]?.value || 0,
      trend: Math.random() > 0.5 ? 'up' : 'down',
    }))
  }, [macroData, segmentId])

  // Risk distribution data
  const riskDistribution = useMemo(() => {
    const distribution = { low: 0, moderate: 0, high: 0, critical: 0 }

    latestSnapshots.forEach(snapshot => {
      if (snapshot.pd < 0.02) distribution.low++
      else if (snapshot.pd < 0.05) distribution.moderate++
      else if (snapshot.pd < 0.10) distribution.high++
      else distribution.critical++
    })

    return [
      { name: 'Low Risk (<2%)', value: distribution.low, color: RISK_COLORS.low },
      { name: 'Moderate (2-5%)', value: distribution.moderate, color: RISK_COLORS.moderate },
      { name: 'High (5-10%)', value: distribution.high, color: RISK_COLORS.high },
      { name: 'Critical (>10%)', value: distribution.critical, color: RISK_COLORS.critical },
    ].filter(d => d.value > 0)
  }, [latestSnapshots])

  // Top loans by exposure
  const topLoans = useMemo(() => {
    return [...segmentLoans]
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 10)
      .map(loan => {
        const snapshot = latestSnapshots.find(s => s.loanId === loan.loanId)
        return {
          ...loan,
          pd: snapshot?.pd || segmentConfig?.pd.avg || 0.04,
          lgd: snapshot?.lgd || segmentConfig?.lgd.avg || 0.40,
          ecl: snapshot?.expectedLoss || 0,
        }
      })
  }, [segmentLoans, latestSnapshots, segmentConfig])

  // Macro vs PD correlation chart data
  const macroVsPDData = useMemo(() => {
    if (!macroData) return []
    const unemploymentData = macroData['UNRATE']?.data || []

    return unemploymentData.slice(-12).map((point, idx) => ({
      period: `Q${Math.ceil((new Date(point.date).getMonth() + 1) / 3)} '${new Date(point.date).getFullYear().toString().slice(-2)}`,
      unemployment: point.value,
      segmentPD: historicalData[idx]?.pd * 100 || 0,
    }))
  }, [macroData, historicalData])

  if (!segmentConfig) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning" />
          <h2 className="text-xl font-semibold mt-4">Segment Not Found</h2>
          <p className="text-muted-foreground mt-2">The requested segment does not exist.</p>
          <Button className="mt-4" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading segment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title={segmentConfig.label}
        subtitle={
          <span className="flex items-center gap-2">
            {segmentConfig.description}
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              isLiveData
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {isLiveData ? 'Live Data' : 'Sample Data'}
            </span>
          </span>
        }
      />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card glass>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exposure</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(summaryMetrics.totalExposure)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{summaryMetrics.loanCount} loans</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average PD</p>
                  <p className="text-2xl font-bold mt-1 metric-pd">{formatPercent(summaryMetrics.avgPD)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Range: {formatPercent(segmentConfig.pd.min)} - {formatPercent(segmentConfig.pd.max)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average LGD</p>
                  <p className="text-2xl font-bold mt-1 metric-lgd">{formatPercent(summaryMetrics.avgLGD)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Range: {formatPercent(segmentConfig.lgd.min)} - {formatPercent(segmentConfig.lgd.max)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-danger/10">
                  <TrendingDown className="h-5 w-5 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Credit Loss</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(summaryMetrics.totalECL)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {summaryMetrics.chargedOff} charged off ({formatPercent(summaryMetrics.chargeOffRate)})
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historical PD/LGD Trends */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Historical PD & LGD Trends
              </CardTitle>
              <CardDescription>Quarterly averages over the past 3 years</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
                      label={{ value: 'PD %', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      label={{ value: 'LGD %', angle: 90, position: 'insideRight', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${(value * 100).toFixed(2)}%`,
                        name === 'pd' ? 'PD' : 'LGD'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="pd"
                      name="PD"
                      fill={segmentConfig.color}
                      fillOpacity={0.2}
                      stroke={segmentConfig.color}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="lgd"
                      name="LGD"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Macro Correlation vs PD */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Unemployment vs Segment PD
              </CardTitle>
              <CardDescription>How this segment correlates with unemployment rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={macroVsPDData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v.toFixed(1)}%`}
                      label={{ value: 'Unemployment', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v.toFixed(1)}%`}
                      label={{ value: 'Segment PD', angle: 90, position: 'insideRight', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`]}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="unemployment"
                      name="Unemployment Rate"
                      fill="#64748b"
                      fillOpacity={0.6}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="segmentPD"
                      name="Segment PD"
                      stroke={segmentConfig.color}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <Card glass>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Loans by PD risk category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Macro Correlations Table */}
          <Card glass className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Macroeconomic Correlations</CardTitle>
              <CardDescription>How this segment's PD correlates with economic indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Indicator</th>
                      <th className="text-right">Current Value</th>
                      <th className="text-right">Correlation</th>
                      <th className="text-center">Relationship</th>
                    </tr>
                  </thead>
                  <tbody>
                    {macroCorrelations.map((corr) => (
                      <tr key={corr.indicator}>
                        <td className="font-medium">{corr.name}</td>
                        <td className="text-right font-mono">
                          {corr.indicator === 'GDPC1'
                            ? formatCompactNumber(corr.currentValue)
                            : corr.indicator === 'CPIAUCSL'
                            ? corr.currentValue.toFixed(1)
                            : `${corr.currentValue.toFixed(2)}%`
                          }
                        </td>
                        <td className={`text-right font-mono ${
                          corr.correlation > 0 ? 'text-danger' : 'text-success'
                        }`}>
                          {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                        </td>
                        <td className="text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            Math.abs(corr.correlation) > 0.6
                              ? corr.correlation > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {Math.abs(corr.correlation) > 0.6
                              ? corr.correlation > 0 ? 'Strong +' : 'Strong -'
                              : Math.abs(corr.correlation) > 0.3
                              ? corr.correlation > 0 ? 'Moderate +' : 'Moderate -'
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

        {/* Top Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 10 Loans by Exposure
            </CardTitle>
            <CardDescription>Largest loans in this segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>State</th>
                    <th className="text-right">Current Balance</th>
                    <th className="text-right">Original Amount</th>
                    <th className="text-right">PD</th>
                    <th className="text-right">LGD</th>
                    <th className="text-right">ECL</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topLoans.map((loan) => (
                    <tr key={loan.loanId}>
                      <td className="font-mono text-sm">{loan.loanId.slice(0, 8)}...</td>
                      <td>{loan.state}</td>
                      <td className="text-right font-mono">{formatCurrency(loan.currentBalance)}</td>
                      <td className="text-right font-mono">{formatCurrency(loan.originalAmount)}</td>
                      <td className="text-right font-mono metric-pd">{formatPercent(loan.pd)}</td>
                      <td className="text-right font-mono metric-lgd">{formatPercent(loan.lgd)}</td>
                      <td className="text-right font-mono">{formatCurrency(loan.ecl)}</td>
                      <td className="text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          loan.isChargedOff
                            ? 'bg-danger/10 text-danger'
                            : loan.pd > 0.08
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                        }`}>
                          {loan.isChargedOff ? 'Charged Off' : loan.pd > 0.08 ? 'Watch' : 'Current'}
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
    </div>
  )
}
