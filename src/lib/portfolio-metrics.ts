import { getLoans, getSnapshots } from '@/data/loans'
import { SEGMENT_CONFIG, SEGMENT_IDS } from '@/data/segments'
import type { Loan, LoanMetricsSnapshot, LoanSegment } from '@/types'
import { formatCompactNumber, formatPercent } from './utils'

export interface PortfolioMetrics {
  totalExposure: number
  totalExposureFormatted: string
  loanCount: number
  avgPD: number
  avgPDFormatted: string
  avgLGD: number
  avgLGDFormatted: string
  totalExpectedLoss: number
  totalExpectedLossFormatted: string
  chargeOffRate: number
  chargeOffRateFormatted: string
  chargedOffCount: number
}

export interface SegmentMetrics extends PortfolioMetrics {
  segmentId: LoanSegment
  segmentName: string
  segmentShortName: string
  percentOfPortfolio: number
}

export interface GeographicMetrics {
  state: string
  loanCount: number
  totalExposure: number
  avgPD: number
  avgLGD: number
  expectedLoss: number
}

// Get the latest snapshot for each loan
function getLatestSnapshots(snapshots: LoanMetricsSnapshot[]): Map<string, LoanMetricsSnapshot> {
  const latestSnapshots = new Map<string, LoanMetricsSnapshot>()
  snapshots.forEach(snapshot => {
    const existing = latestSnapshots.get(snapshot.loanId)
    if (!existing || snapshot.snapshotDate > existing.snapshotDate) {
      latestSnapshots.set(snapshot.loanId, snapshot)
    }
  })
  return latestSnapshots
}

// Calculate metrics for a subset of loans
export function calculateMetricsForLoans(
  loans: Loan[],
  snapshots: LoanMetricsSnapshot[]
): PortfolioMetrics {
  if (loans.length === 0) {
    return {
      totalExposure: 0,
      totalExposureFormatted: '$0',
      loanCount: 0,
      avgPD: 0,
      avgPDFormatted: '0.00%',
      avgLGD: 0,
      avgLGDFormatted: '0.00%',
      totalExpectedLoss: 0,
      totalExpectedLossFormatted: '$0',
      chargeOffRate: 0,
      chargeOffRateFormatted: '0.00%',
      chargedOffCount: 0,
    }
  }

  const loanIds = new Set(loans.map(l => l.loanId))
  const relevantSnapshots = snapshots.filter(s => loanIds.has(s.loanId))
  const latestSnapshots = getLatestSnapshots(relevantSnapshots)

  const totalExposure = loans.reduce((sum, loan) => sum + loan.currentBalance, 0)
  const loanCount = loans.length

  const snapshotValues = Array.from(latestSnapshots.values())
  const avgPD = snapshotValues.length > 0
    ? snapshotValues.reduce((sum, s) => sum + s.pd, 0) / snapshotValues.length
    : 0
  const avgLGD = snapshotValues.length > 0
    ? snapshotValues.reduce((sum, s) => sum + s.lgd, 0) / snapshotValues.length
    : 0
  const totalExpectedLoss = snapshotValues.reduce((sum, s) => sum + s.expectedLoss, 0)

  const chargedOffLoans = loans.filter(l => l.isChargedOff)
  const chargeOffRate = loans.length > 0 ? chargedOffLoans.length / loans.length : 0

  return {
    totalExposure,
    totalExposureFormatted: formatCompactNumber(totalExposure),
    loanCount,
    avgPD,
    avgPDFormatted: formatPercent(avgPD),
    avgLGD,
    avgLGDFormatted: formatPercent(avgLGD),
    totalExpectedLoss,
    totalExpectedLossFormatted: formatCompactNumber(totalExpectedLoss),
    chargeOffRate,
    chargeOffRateFormatted: formatPercent(chargeOffRate),
    chargedOffCount: chargedOffLoans.length,
  }
}

// Calculate metrics for the entire portfolio
export function getPortfolioMetrics(): PortfolioMetrics {
  const loans = getLoans()
  const snapshots = getSnapshots()
  return calculateMetricsForLoans(loans, snapshots)
}

// Calculate metrics for a specific segment
export function getSegmentMetrics(segmentId: LoanSegment): SegmentMetrics {
  const loans = getLoans()
  const snapshots = getSnapshots()
  const segmentLoans = loans.filter(l => l.segment === segmentId)
  const metrics = calculateMetricsForLoans(segmentLoans, snapshots)
  const totalPortfolioExposure = loans.reduce((sum, loan) => sum + loan.currentBalance, 0)
  const config = SEGMENT_CONFIG[segmentId]

  return {
    ...metrics,
    segmentId,
    segmentName: config.label,
    segmentShortName: config.shortLabel,
    percentOfPortfolio: totalPortfolioExposure > 0
      ? metrics.totalExposure / totalPortfolioExposure
      : 0,
  }
}

// Calculate metrics for all segments
export function getAllSegmentMetrics(): SegmentMetrics[] {
  return SEGMENT_IDS.map(segmentId => getSegmentMetrics(segmentId))
    .sort((a, b) => b.totalExposure - a.totalExposure)
}

// Calculate metrics by state
export function getGeographicMetrics(): GeographicMetrics[] {
  const loans = getLoans()
  const snapshots = getSnapshots()
  const latestSnapshots = getLatestSnapshots(snapshots)

  const stateMap = new Map<string, { loans: Loan[]; pds: number[]; lgds: number[]; expectedLosses: number[] }>()

  loans.forEach(loan => {
    if (!stateMap.has(loan.state)) {
      stateMap.set(loan.state, { loans: [], pds: [], lgds: [], expectedLosses: [] })
    }
    const stateData = stateMap.get(loan.state)!
    stateData.loans.push(loan)

    const snapshot = latestSnapshots.get(loan.loanId)
    if (snapshot) {
      stateData.pds.push(snapshot.pd)
      stateData.lgds.push(snapshot.lgd)
      stateData.expectedLosses.push(snapshot.expectedLoss)
    }
  })

  return Array.from(stateMap.entries()).map(([state, data]) => ({
    state,
    loanCount: data.loans.length,
    totalExposure: data.loans.reduce((sum, l) => sum + l.currentBalance, 0),
    avgPD: data.pds.length > 0 ? data.pds.reduce((a, b) => a + b, 0) / data.pds.length : 0,
    avgLGD: data.lgds.length > 0 ? data.lgds.reduce((a, b) => a + b, 0) / data.lgds.length : 0,
    expectedLoss: data.expectedLosses.reduce((a, b) => a + b, 0),
  })).sort((a, b) => b.totalExposure - a.totalExposure)
}

// Generate report data structure for AI reports
export interface ReportData {
  portfolio: PortfolioMetrics
  segments: SegmentMetrics[]
  geographic: {
    topStates: GeographicMetrics[]
    stateCount: number
    hhi: number // Herfindahl-Hirschman Index
    top3Concentration: number
  }
  selectedSegment?: SegmentMetrics
}

export function getReportData(segmentId?: LoanSegment): ReportData {
  const portfolio = getPortfolioMetrics()
  const segments = getAllSegmentMetrics()
  const geographic = getGeographicMetrics()

  // Calculate HHI (sum of squared market shares)
  const totalExposure = portfolio.totalExposure
  const hhi = geographic.reduce((sum, state) => {
    const share = (state.totalExposure / totalExposure) * 100
    return sum + share * share
  }, 0)

  // Calculate top 3 state concentration
  const top3Concentration = geographic.slice(0, 3).reduce(
    (sum, state) => sum + state.totalExposure / totalExposure,
    0
  )

  const reportData: ReportData = {
    portfolio,
    segments,
    geographic: {
      topStates: geographic.slice(0, 10),
      stateCount: geographic.length,
      hhi: Math.round(hhi),
      top3Concentration,
    },
  }

  if (segmentId) {
    reportData.selectedSegment = segments.find(s => s.segmentId === segmentId)
  }

  return reportData
}

// Format report data for AI prompts
export function formatReportDataForAI(data: ReportData, segmentId?: LoanSegment): Record<string, any> {
  const isSegmentReport = segmentId && data.selectedSegment

  const baseData = {
    reportScope: isSegmentReport ? 'segment' : 'portfolio',
    segmentName: isSegmentReport ? data.selectedSegment!.segmentName : 'Full Portfolio',
    portfolioSize: isSegmentReport ? data.selectedSegment!.loanCount : data.portfolio.loanCount,
    totalExposure: isSegmentReport ? data.selectedSegment!.totalExposureFormatted : data.portfolio.totalExposureFormatted,
    totalExposureRaw: isSegmentReport ? data.selectedSegment!.totalExposure : data.portfolio.totalExposure,
    avgPD: isSegmentReport ? data.selectedSegment!.avgPDFormatted : data.portfolio.avgPDFormatted,
    avgPDRaw: isSegmentReport ? data.selectedSegment!.avgPD : data.portfolio.avgPD,
    avgLGD: isSegmentReport ? data.selectedSegment!.avgLGDFormatted : data.portfolio.avgLGDFormatted,
    avgLGDRaw: isSegmentReport ? data.selectedSegment!.avgLGD : data.portfolio.avgLGD,
    expectedLoss: isSegmentReport ? data.selectedSegment!.totalExpectedLossFormatted : data.portfolio.totalExpectedLossFormatted,
    expectedLossRaw: isSegmentReport ? data.selectedSegment!.totalExpectedLoss : data.portfolio.totalExpectedLoss,
    chargeOffRate: isSegmentReport ? data.selectedSegment!.chargeOffRateFormatted : data.portfolio.chargeOffRateFormatted,
  }

  if (!isSegmentReport) {
    return {
      ...baseData,
      segments: data.segments.map(s => ({
        name: s.segmentName,
        shortName: s.segmentShortName,
        exposure: s.totalExposureFormatted,
        exposureRaw: s.totalExposure,
        percentOfPortfolio: formatPercent(s.percentOfPortfolio),
        avgPD: s.avgPDFormatted,
        avgLGD: s.avgLGDFormatted,
        expectedLoss: s.totalExpectedLossFormatted,
        loanCount: s.loanCount,
      })),
      geographic: {
        stateCount: data.geographic.stateCount,
        hhi: data.geographic.hhi,
        top3Concentration: formatPercent(data.geographic.top3Concentration),
        topStates: data.geographic.topStates.slice(0, 5).map(s => ({
          state: s.state,
          exposure: formatCompactNumber(s.totalExposure),
          percentOfPortfolio: formatPercent(s.totalExposure / data.portfolio.totalExposure),
          avgPD: formatPercent(s.avgPD),
          avgLGD: formatPercent(s.avgLGD),
          loanCount: s.loanCount,
        })),
      },
    }
  }

  // For segment reports, include segment-specific context
  return {
    ...baseData,
    percentOfTotalPortfolio: formatPercent(data.selectedSegment!.percentOfPortfolio),
    totalPortfolioExposure: data.portfolio.totalExposureFormatted,
    segmentRanking: data.segments.findIndex(s => s.segmentId === segmentId) + 1,
    totalSegments: data.segments.length,
    // Compare to portfolio averages
    pdVsPortfolio: data.selectedSegment!.avgPD - data.portfolio.avgPD,
    lgdVsPortfolio: data.selectedSegment!.avgLGD - data.portfolio.avgLGD,
  }
}
