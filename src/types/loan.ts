export type LoanSegment =
  | 'CRE_NON_OWNER'
  | 'CRE_OWNER'
  | 'CONSUMER'
  | 'RESIDENTIAL_1_4'
  | 'MULTIFAMILY'
  | 'AUTO'
  | 'C_AND_I'
  | 'CONSTRUCTION'

export interface Loan {
  loanId: string
  originationDate: string
  maturityDate: string
  originalBalance: number
  currentBalance: number
  segment: LoanSegment
  state: string
  cbsa?: string
  interestRate: number
  term: number
  collateralType?: string
  borrowerCreditScore?: number
  isChargedOff: boolean
  chargeOffDate?: string
  chargeOffAmount?: number
}

export interface LoanMetricsSnapshot {
  loanId: string
  snapshotDate: string
  pd: number
  lgd: number
  portfolioValue: number
  expectedLoss: number
}

export interface ChargeOffLoanHistory {
  loanId: string
  segment: LoanSegment
  chargeOffDate: string
  chargeOffAmount: number
  monthlySnapshots: {
    monthsBeforeChargeOff: number
    date: string
    pd: number
    lgd: number
    portfolioValue: number
    paymentStatus: 'current' | 'delinquent_30' | 'delinquent_60' | 'delinquent_90'
  }[]
}
