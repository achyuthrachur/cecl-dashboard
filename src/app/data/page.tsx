'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Database, FileSpreadsheet, TrendingUp, AlertCircle, Layers, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DataGrid, type Column } from '@/components/data-viewer'
import { generateLoans, generateLoanSnapshots, generateChargeOffHistories } from '@/data/loans'
import { SEGMENT_CONFIG, SEGMENT_IDS } from '@/data/segments'
import { US_STATES } from '@/data/states'
import type { Loan, LoanMetricsSnapshot, ChargeOffLoanHistory, LoanSegment } from '@/types'

const tabs = [
  { id: 'loans', label: 'Loans', icon: FileSpreadsheet, count: 5000 },
  { id: 'snapshots', label: 'Snapshots', icon: TrendingUp, count: 0 },
  { id: 'chargeoffs', label: 'Charge-Offs', icon: AlertCircle, count: 0 },
  { id: 'segments', label: 'Segments', icon: Layers, count: 8 },
  { id: 'states', label: 'States', icon: MapPin, count: 51 },
]

const loanColumns: Column<Loan>[] = [
  { key: 'loanId', header: 'Loan ID', width: 120 },
  { key: 'segment', header: 'Segment', width: 140 },
  { key: 'state', header: 'State', width: 80 },
  { key: 'originalBalance', header: 'Original Balance', format: 'currency', width: 140 },
  { key: 'currentBalance', header: 'Current Balance', format: 'currency', width: 140 },
  { key: 'interestRate', header: 'Interest Rate', format: 'percent', width: 110 },
  { key: 'term', header: 'Term (mo)', format: 'number', width: 90 },
  { key: 'originationDate', header: 'Originated', format: 'date', width: 120 },
  { key: 'maturityDate', header: 'Maturity', format: 'date', width: 120 },
  { key: 'borrowerCreditScore', header: 'Credit Score', format: 'number', width: 100 },
  {
    key: 'isChargedOff',
    header: 'Status',
    width: 100,
    render: (value: boolean) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}
      >
        {value ? 'Charged Off' : 'Active'}
      </span>
    ),
  },
]

const snapshotColumns: Column<LoanMetricsSnapshot>[] = [
  { key: 'loanId', header: 'Loan ID', width: 120 },
  { key: 'snapshotDate', header: 'Snapshot Date', format: 'date', width: 130 },
  { key: 'pd', header: 'PD', format: 'percent', width: 100 },
  { key: 'lgd', header: 'LGD', format: 'percent', width: 100 },
  { key: 'portfolioValue', header: 'Portfolio Value', format: 'currency', width: 140 },
  { key: 'expectedLoss', header: 'Expected Loss', format: 'currency', width: 140 },
]

interface SegmentRow {
  id: LoanSegment
  name: string
  pdMin: number
  pdMax: number
  lgdMin: number
  lgdMax: number
  portfolioValueMin: number
  portfolioValueMax: number
}

const segmentColumns: Column<SegmentRow>[] = [
  { key: 'id', header: 'Segment ID', width: 160 },
  { key: 'name', header: 'Segment Name', width: 200 },
  { key: 'pdMin', header: 'PD Min', format: 'percent', width: 90 },
  { key: 'pdMax', header: 'PD Max', format: 'percent', width: 90 },
  { key: 'lgdMin', header: 'LGD Min', format: 'percent', width: 90 },
  { key: 'lgdMax', header: 'LGD Max', format: 'percent', width: 90 },
  { key: 'portfolioValueMin', header: 'Portfolio Val Min', format: 'currency', width: 140 },
  { key: 'portfolioValueMax', header: 'Portfolio Val Max', format: 'currency', width: 140 },
]

interface StateRow {
  code: string
  name: string
}

const stateColumns: Column<StateRow>[] = [
  { key: 'code', header: 'State Code', width: 100 },
  { key: 'name', header: 'State Name', width: 200 },
]

interface ChargeOffRow {
  loanId: string
  segment: LoanSegment
  chargeOffDate: string
  chargeOffAmount: number
  monthsOfData: number
  finalPD: number
  finalLGD: number
}

const chargeOffColumns: Column<ChargeOffRow>[] = [
  { key: 'loanId', header: 'Loan ID', width: 120 },
  { key: 'segment', header: 'Segment', width: 140 },
  { key: 'chargeOffDate', header: 'Charge-Off Date', format: 'date', width: 140 },
  { key: 'chargeOffAmount', header: 'Charge-Off Amount', format: 'currency', width: 150 },
  { key: 'monthsOfData', header: 'Months Tracked', format: 'number', width: 130 },
  { key: 'finalPD', header: 'Final PD', format: 'percent', width: 100 },
  { key: 'finalLGD', header: 'Final LGD', format: 'percent', width: 100 },
]

export default function DataExplorerPage() {
  const [activeTab, setActiveTab] = useState('loans')

  // Generate data
  const loans = useMemo(() => generateLoans(5000), [])
  const snapshots = useMemo(() => generateLoanSnapshots(loans), [loans])
  const chargeOffHistories = useMemo(() => generateChargeOffHistories(loans), [loans])

  // Transform data for grids
  const segmentData: SegmentRow[] = useMemo(
    () =>
      SEGMENT_IDS.map((id) => {
        const config = SEGMENT_CONFIG[id]
        return {
          id,
          name: config.label,
          pdMin: config.pd.min,
          pdMax: config.pd.max,
          lgdMin: config.lgd.min,
          lgdMax: config.lgd.max,
          portfolioValueMin: config.portfolioValueRange.min,
          portfolioValueMax: config.portfolioValueRange.max,
        }
      }),
    []
  )

  const stateData: StateRow[] = useMemo(
    () =>
      US_STATES.map((state) => ({
        code: state.code,
        name: state.name,
      })),
    []
  )

  const chargeOffData: ChargeOffRow[] = useMemo(
    () =>
      chargeOffHistories.map((h) => ({
        loanId: h.loanId,
        segment: h.segment,
        chargeOffDate: h.chargeOffDate,
        chargeOffAmount: h.chargeOffAmount,
        monthsOfData: h.monthlySnapshots.length,
        finalPD: h.monthlySnapshots[h.monthlySnapshots.length - 1]?.pd ?? 0,
        finalLGD: h.monthlySnapshots[h.monthlySnapshots.length - 1]?.lgd ?? 0,
      })),
    [chargeOffHistories]
  )

  // Update tab counts
  const tabsWithCounts = useMemo(
    () =>
      tabs.map((tab) => ({
        ...tab,
        count:
          tab.id === 'loans'
            ? loans.length
            : tab.id === 'snapshots'
              ? snapshots.length
              : tab.id === 'chargeoffs'
                ? chargeOffHistories.length
                : tab.count,
      })),
    [loans.length, snapshots.length, chargeOffHistories.length]
  )

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold gradient-text-animated">Data Explorer</h1>
          </div>
          <p className="text-muted-foreground">
            Browse and export all synthetic CECL data used in this dashboard demo
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabsWithCounts.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                  ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-card hover:bg-accent border border-border'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs
                    ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}
                  `}
                >
                  {tab.count.toLocaleString()}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Data Grid */}
        <Card glass className="overflow-hidden">
          <CardContent className="p-0 h-[calc(100vh-280px)]">
            {activeTab === 'loans' && (
              <DataGrid
                data={loans}
                columns={loanColumns}
                title="All Loans"
                exportFilename="cecl-loans"
                pageSize={25}
              />
            )}
            {activeTab === 'snapshots' && (
              <DataGrid
                data={snapshots}
                columns={snapshotColumns}
                title="Quarterly Snapshots"
                exportFilename="cecl-snapshots"
                pageSize={25}
              />
            )}
            {activeTab === 'chargeoffs' && (
              <DataGrid
                data={chargeOffData}
                columns={chargeOffColumns}
                title="Charge-Off Histories"
                exportFilename="cecl-chargeoffs"
                pageSize={25}
              />
            )}
            {activeTab === 'segments' && (
              <DataGrid
                data={segmentData}
                columns={segmentColumns}
                title="Loan Segments Configuration"
                exportFilename="cecl-segments"
                pageSize={10}
              />
            )}
            {activeTab === 'states' && (
              <DataGrid
                data={stateData}
                columns={stateColumns}
                title="US States Reference"
                exportFilename="cecl-states"
                pageSize={25}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>All data is synthetically generated for demonstration purposes</span>
        </div>
      </motion.div>
    </div>
  )
}
