'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoanTypeFilter } from '@/components/filters/LoanTypeFilter'
import { DataPreviewSheet } from '@/components/data-viewer/DataPreviewSheet'
import { getChargeOffHistories } from '@/data/loans'
import { SEGMENT_IDS, getSegmentLabel, getSegmentColor } from '@/data/segments'
import type { LoanSegment, ChargeOffLoanHistory } from '@/types'
import { formatPercent, formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingUp, Clock, Users, Activity } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

// Generate cohort analysis data
function generateCohortData(histories: ChargeOffLoanHistory[], segment: LoanSegment | 'all') {
  const filtered = segment === 'all'
    ? histories
    : histories.filter((h) => h.segment === segment)

  if (filtered.length === 0) return []

  // Aggregate by months before charge-off
  const aggregated: Record<number, { pds: number[]; lgds: number[] }> = {}

  for (let m = -36; m <= 0; m++) {
    aggregated[m] = { pds: [], lgds: [] }
  }

  filtered.forEach((history) => {
    history.monthlySnapshots.forEach((snap) => {
      if (aggregated[snap.monthsBeforeChargeOff]) {
        aggregated[snap.monthsBeforeChargeOff].pds.push(snap.pd)
        aggregated[snap.monthsBeforeChargeOff].lgds.push(snap.lgd)
      }
    })
  })

  return Object.entries(aggregated)
    .map(([month, data]) => ({
      month: parseInt(month),
      avgPD: data.pds.length > 0 ? data.pds.reduce((a, b) => a + b, 0) / data.pds.length : 0,
      avgLGD: data.lgds.length > 0 ? data.lgds.reduce((a, b) => a + b, 0) / data.lgds.length : 0,
      minPD: data.pds.length > 0 ? Math.min(...data.pds) : 0,
      maxPD: data.pds.length > 0 ? Math.max(...data.pds) : 0,
      count: data.pds.length,
    }))
    .sort((a, b) => a.month - b.month)
}

// Generate warning signals
function generateWarningSignals(histories: ChargeOffLoanHistory[]) {
  return [
    {
      signal: 'PD exceeds 2x baseline',
      avgMonthsBefore: 18,
      prevalence: 78,
      segment: 'All',
    },
    {
      signal: 'First 30+ DPD occurrence',
      avgMonthsBefore: 15,
      prevalence: 85,
      segment: 'All',
    },
    {
      signal: 'LGD increase >20%',
      avgMonthsBefore: 12,
      prevalence: 62,
      segment: 'CRE',
    },
    {
      signal: 'Payment pattern change',
      avgMonthsBefore: 12,
      prevalence: 71,
      segment: 'Consumer',
    },
    {
      signal: 'PD exceeds 10%',
      avgMonthsBefore: 9,
      prevalence: 92,
      segment: 'All',
    },
    {
      signal: 'Consecutive missed payments',
      avgMonthsBefore: 6,
      prevalence: 88,
      segment: 'All',
    },
  ]
}

export default function PreChargeOffPage() {
  const [selectedSegments, setSelectedSegments] = useState<LoanSegment[]>(SEGMENT_IDS)
  const [selectedSegment, setSelectedSegment] = useState<LoanSegment | 'all'>('all')
  const [showDataPreview, setShowDataPreview] = useState(false)

  // Get charge-off histories
  const histories = useMemo(() => getChargeOffHistories(), [])

  // Generate cohort data for selected segment
  const cohortData = useMemo(
    () => generateCohortData(histories, selectedSegment),
    [histories, selectedSegment]
  )

  // Warning signals
  const warningSignals = useMemo(() => generateWarningSignals(histories), [histories])

  // Segment comparison data
  const segmentComparison = useMemo(() => {
    return SEGMENT_IDS.map((segment) => {
      const segmentHistories = histories.filter((h) => h.segment === segment)
      if (segmentHistories.length === 0) return null

      const month12 = segmentHistories
        .flatMap((h) => h.monthlySnapshots)
        .filter((s) => s.monthsBeforeChargeOff === -12)

      const month6 = segmentHistories
        .flatMap((h) => h.monthlySnapshots)
        .filter((s) => s.monthsBeforeChargeOff === -6)

      const month0 = segmentHistories
        .flatMap((h) => h.monthlySnapshots)
        .filter((s) => s.monthsBeforeChargeOff === 0)

      return {
        segment,
        label: getSegmentLabel(segment),
        count: segmentHistories.length,
        pd12: month12.length > 0 ? month12.reduce((sum, s) => sum + s.pd, 0) / month12.length : 0,
        pd6: month6.length > 0 ? month6.reduce((sum, s) => sum + s.pd, 0) / month6.length : 0,
        pd0: month0.length > 0 ? month0.reduce((sum, s) => sum + s.pd, 0) / month0.length : 0,
        avgChargeOff: segmentHistories.reduce((sum, h) => sum + h.chargeOffAmount, 0) / segmentHistories.length,
      }
    }).filter(Boolean)
  }, [histories])

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="Pre-Charge-Off Analysis"
        subtitle="Behavior patterns of loans in the 36 months before charge-off"
        onViewData={() => setShowDataPreview(true)}
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs">Analyzed Loans</span>
              </div>
              <p className="text-2xl font-bold mt-1">{histories.length}</p>
              <p className="text-xs text-muted-foreground">charged-off loans</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Avg Warning Lead</span>
              </div>
              <p className="text-2xl font-bold mt-1">18</p>
              <p className="text-xs text-muted-foreground">months before charge-off</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Avg PD at -12mo</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-warning">
                {formatPercent(cohortData.find((d) => d.month === -12)?.avgPD || 0)}
              </p>
              <p className="text-xs text-muted-foreground">12 months prior</p>
            </CardContent>
          </Card>

          <Card glass className="metric-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Peak PD</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-danger">
                {formatPercent(cohortData.find((d) => d.month === 0)?.avgPD || 0)}
              </p>
              <p className="text-xs text-muted-foreground">at charge-off</p>
            </CardContent>
          </Card>
        </div>

        {/* Segment Selector */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSegment('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSegment === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            All Segments
          </button>
          {SEGMENT_IDS.map((segment) => (
            <button
              key={segment}
              onClick={() => setSelectedSegment(segment)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSegment === segment
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {getSegmentLabel(segment)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PD Trajectory Chart */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                PD Trajectory Before Charge-Off
              </CardTitle>
              <CardDescription>
                Average probability of default over 36 months prior to charge-off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cohortData}>
                    <defs>
                      <linearGradient id="pdGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}mo`}
                      label={{
                        value: 'Months Before Charge-Off',
                        position: 'insideBottom',
                        offset: -5,
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatPercent(value), 'Avg PD']}
                      labelFormatter={(v) => `${v} months before charge-off`}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgPD"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#pdGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="maxPD"
                      stroke="#f97316"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="Max PD"
                    />
                    <Line
                      type="monotone"
                      dataKey="minPD"
                      stroke="#10b981"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="Min PD"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Warning Signals */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Early Warning Signals
              </CardTitle>
              <CardDescription>
                Common indicators observed before charge-off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {warningSignals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-warning">
                        -{signal.avgMonthsBefore}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{signal.signal}</p>
                      <p className="text-sm text-muted-foreground">
                        {signal.segment !== 'All' && `${signal.segment} - `}
                        {signal.prevalence}% of charged-off loans
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warning rounded-full"
                          style={{ width: `${signal.prevalence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segment Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Comparison</CardTitle>
            <CardDescription>
              PD progression by loan segment at key time points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th className="text-center">Loans</th>
                    <th className="text-right">PD at -12mo</th>
                    <th className="text-right">PD at -6mo</th>
                    <th className="text-right">PD at Charge-Off</th>
                    <th className="text-right">Avg Charge-Off</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentComparison.map((row: any) => (
                    <tr key={row.segment}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSegmentColor(row.segment) }}
                          />
                          <span className="font-medium">{row.label}</span>
                        </div>
                      </td>
                      <td className="text-center">{row.count}</td>
                      <td className="text-right font-mono text-warning">
                        {formatPercent(row.pd12)}
                      </td>
                      <td className="text-right font-mono text-warning">
                        {formatPercent(row.pd6)}
                      </td>
                      <td className="text-right font-mono text-danger">
                        {formatPercent(row.pd0)}
                      </td>
                      <td className="text-right font-mono">
                        {formatCurrency(row.avgChargeOff)}
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
        title="Pre-Charge-Off Data"
        description="36-month lookback data for charged-off loans"
        data={cohortData}
        columns={[
          { key: 'month', label: 'Months Before', format: 'number' },
          { key: 'avgPD', label: 'Avg PD', format: 'percent' },
          { key: 'avgLGD', label: 'Avg LGD', format: 'percent' },
          { key: 'minPD', label: 'Min PD', format: 'percent' },
          { key: 'maxPD', label: 'Max PD', format: 'percent' },
          { key: 'count', label: 'Sample Size', format: 'number' },
        ]}
      />
    </div>
  )
}
