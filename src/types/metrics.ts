import type { LoanSegment } from './loan'

// MetricType is defined in @/lib/colors to keep it colocated with color functions
// Re-export it here for convenience when importing from @/types
export type { MetricType } from '@/lib/colors'

export interface SegmentMetrics {
  pd: {
    average: number
    min: number
    max: number
    median: number
  }
  lgd: {
    average: number
    min: number
    max: number
    median: number
  }
  portfolioValue: {
    total: number
    average: number
  }
  loanCount: number
  expectedLoss: number
}

export interface StateMetrics {
  stateCode: string
  stateName: string
  fipsCode: string
  metrics: {
    pd: {
      average: number
      min: number
      max: number
      median: number
    }
    lgd: {
      average: number
      min: number
      max: number
      median: number
    }
    ead: {
      total: number
      average: number
    }
  }
  loanCount: number
  totalExposure: number
  bySegment: Partial<Record<LoanSegment, SegmentMetrics>>
}

export interface HistoricalStateMetrics {
  stateCode: string
  quarterly: {
    period: string
    pd: number
    lgd: number
    portfolioValue: number
    loanCount: number
    expectedLoss: number
  }[]
}

export interface BacktestingResult {
  period: string
  predictedLoss: number
  actualLoss: number
  variance: number
  variancePercent: number
}

export interface BacktestingMetrics {
  mae: number
  rmse: number
  mape: number
  accuracy: number
  bias: number
  periodResults: BacktestingResult[]
}

export interface ReserveRecord {
  loanId: string
  period: string
  predictedPD: number
  predictedLGD: number
  predictedPortfolioValue: number
  predictedLoss: number
  reserveAmount: number
}

export interface ChargeOffRecord {
  loanId: string
  chargeOffDate: string
  chargeOffAmount: number
  recoveryAmount: number
  netLoss: number
}

export interface CohortAnalysis {
  segment: LoanSegment
  cohortSize: number
  averagePDTrend: {
    monthsBeforeChargeOff: number
    averagePD: number
  }[]
  averageLGDTrend: {
    monthsBeforeChargeOff: number
    averageLGD: number
  }[]
  warningSignals: {
    monthsBeforeChargeOff: number
    signalType: string
    prevalence: number
  }[]
}
