'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { USHeatMap, type StateData } from '@/components/maps/USHeatMap'
import { MetricLegend } from '@/components/maps/MetricLegend'
import { MetricSelector } from '@/components/filters/MetricSelector'
import { LoanTypeFilter } from '@/components/filters/LoanTypeFilter'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { DataPreviewSheet } from '@/components/data-viewer/DataPreviewSheet'
import { getLoans, getSnapshots, getStateMetricsData } from '@/data/loans'
import { getStateName, US_STATES } from '@/data/states'
import { SEGMENT_IDS } from '@/data/segments'
import type { MetricType } from '@/lib/colors'
import type { LoanSegment } from '@/types'
import { formatPercent, formatCurrency, formatCompactNumber } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

export default function GeographicPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('pd')
  const [selectedSegments, setSelectedSegments] = useState<LoanSegment[]>(SEGMENT_IDS)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [showDataPreview, setShowDataPreview] = useState(false)

  // Get synthetic data
  const loans = useMemo(() => getLoans(), [])
  const stateMetricsData = useMemo(() => getStateMetricsData(), [])

  // Aggregate state data for heat map
  const stateData: StateData[] = useMemo(() => {
    const filteredLoans = loans.filter(
      (loan) => selectedSegments.length === 0 || selectedSegments.includes(loan.segment)
    )

    const stateAggregates: Record<
      string,
      { pds: number[]; lgds: number[]; eads: number[]; count: number }
    > = {}

    filteredLoans.forEach((loan) => {
      if (!stateAggregates[loan.state]) {
        stateAggregates[loan.state] = { pds: [], lgds: [], eads: [], count: 0 }
      }
      // Use mock PD/LGD based on segment
      const pd = Math.random() * 0.1 + 0.01
      const lgd = Math.random() * 0.4 + 0.2
      stateAggregates[loan.state].pds.push(pd)
      stateAggregates[loan.state].lgds.push(lgd)
      stateAggregates[loan.state].eads.push(loan.currentBalance)
      stateAggregates[loan.state].count++
    })

    return Object.entries(stateAggregates).map(([stateCode, data]) => ({
      stateCode,
      pd: data.pds.reduce((a, b) => a + b, 0) / data.pds.length,
      lgd: data.lgds.reduce((a, b) => a + b, 0) / data.lgds.length,
      ead: data.eads.reduce((a, b) => a + b, 0),
      loanCount: data.count,
    }))
  }, [loans, selectedSegments])

  // Get historical data for selected state
  const stateHistoricalData = useMemo(() => {
    if (!selectedState) return []
    return stateMetricsData[selectedState] || []
  }, [selectedState, stateMetricsData])

  // Get current state metrics
  const currentStateMetrics = useMemo(() => {
    return stateData.find((s) => s.stateCode === selectedState)
  }, [stateData, selectedState])

  // Data for preview sheet
  const previewData = useMemo(() => {
    return stateData.map((s) => ({
      state: getStateName(s.stateCode),
      stateCode: s.stateCode,
      pd: s.pd,
      lgd: s.lgd,
      ead: s.ead,
      loanCount: s.loanCount,
      expectedLoss: s.pd * s.lgd * s.ead,
    }))
  }, [stateData])

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="Geographic Analysis"
        subtitle="View credit risk metrics by state with historical trends"
        onViewData={() => setShowDataPreview(true)}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <MetricSelector value={selectedMetric} onChange={setSelectedMetric} />
          <LoanTypeFilter value={selectedSegments} onChange={setSelectedSegments} />
          {selectedState && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedState(null)}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Selection: {getStateName(selectedState)}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heat Map */}
          <div className="lg:col-span-2">
            <Card glass className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>
                  {selectedMetric.toUpperCase()} by State
                </CardTitle>
                <CardDescription>
                  Click a state to view historical trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <USHeatMap
                    data={stateData}
                    metric={selectedMetric}
                    onStateClick={setSelectedState}
                    selectedState={selectedState}
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <MetricLegend metric={selectedMetric} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* State Detail Panel */}
          <div className="space-y-4">
            {selectedState ? (
              <>
                <Card glass>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {getStateName(selectedState)}
                      <span className="text-2xl font-bold text-primary">
                        {selectedState}
                      </span>
                    </CardTitle>
                    <CardDescription>Current Quarter Metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentStateMetrics && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-xs">Avg PD</span>
                          </div>
                          <p className="text-xl font-bold mt-1 metric-pd">
                            {formatPercent(currentStateMetrics.pd)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-xs">Avg LGD</span>
                          </div>
                          <p className="text-xl font-bold mt-1 metric-lgd">
                            {formatPercent(currentStateMetrics.lgd)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs">Total EAD</span>
                          </div>
                          <p className="text-xl font-bold mt-1 metric-ead">
                            {formatCompactNumber(currentStateMetrics.ead)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="text-xs">Loan Count</span>
                          </div>
                          <p className="text-xl font-bold mt-1">
                            {currentStateMetrics.loanCount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card glass>
                  <CardHeader>
                    <CardTitle className="text-base">5-Year Historical Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stateHistoricalData.length > 0 ? (
                      <TimeSeriesChart
                        data={stateHistoricalData}
                        metrics={['pd', 'lgd']}
                        height={250}
                      />
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No historical data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card glass className="h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Select a State</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any state in the map to view detailed metrics and
                    historical trends
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary by State</CardTitle>
            <CardDescription>
              Aggregated metrics across all states (sorted by exposure)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="data-table">
                  <thead className="sticky top-0">
                    <tr>
                      <th>State</th>
                      <th className="text-right">PD</th>
                      <th className="text-right">LGD</th>
                      <th className="text-right">EAD</th>
                      <th className="text-right">Expected Loss</th>
                      <th className="text-right">Loans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateData
                      .sort((a, b) => b.ead - a.ead)
                      .slice(0, 20)
                      .map((state) => (
                        <tr
                          key={state.stateCode}
                          className={
                            selectedState === state.stateCode
                              ? 'bg-primary/10'
                              : ''
                          }
                          onClick={() => setSelectedState(state.stateCode)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="font-medium">
                            {getStateName(state.stateCode)}
                          </td>
                          <td className="text-right font-mono metric-pd">
                            {formatPercent(state.pd)}
                          </td>
                          <td className="text-right font-mono metric-lgd">
                            {formatPercent(state.lgd)}
                          </td>
                          <td className="text-right font-mono metric-ead">
                            {formatCurrency(state.ead)}
                          </td>
                          <td className="text-right font-mono">
                            {formatCurrency(state.pd * state.lgd * state.ead)}
                          </td>
                          <td className="text-right">
                            {state.loanCount.toLocaleString()}
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
        title="State Metrics Data"
        description="Underlying data for the geographic heat map visualization"
        data={previewData}
        columns={[
          { key: 'state', label: 'State', format: 'text' },
          { key: 'stateCode', label: 'Code', format: 'text' },
          { key: 'pd', label: 'Avg PD', format: 'percent' },
          { key: 'lgd', label: 'Avg LGD', format: 'percent' },
          { key: 'ead', label: 'Total EAD', format: 'currency' },
          { key: 'expectedLoss', label: 'Expected Loss', format: 'currency' },
          { key: 'loanCount', label: 'Loans', format: 'number' },
        ]}
      />
    </div>
  )
}
