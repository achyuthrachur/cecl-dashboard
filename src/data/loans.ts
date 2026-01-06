import type { Loan, LoanMetricsSnapshot, LoanSegment, ChargeOffLoanHistory } from '@/types'
import { SEGMENT_CONFIG, SEGMENT_IDS } from './segments'
import { US_STATES, STATE_POPULATION_WEIGHTS } from './states'

// Seeded random number generator for reproducible synthetic data
let seed = 42
function seededRandom(): number {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

function resetSeed(newSeed: number = 42) {
  seed = newSeed
}

function randomBetween(min: number, max: number): number {
  return min + seededRandom() * (max - min)
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = seededRandom() * totalWeight
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(seededRandom() * items.length)]
}

function generateLoanId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = 'LN-'
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(seededRandom() * chars.length)]
  }
  return id
}

function generatePD(segment: LoanSegment, isStressed: boolean = false): number {
  const config = SEGMENT_CONFIG[segment]
  const base = randomBetween(config.pd.min, config.pd.max)
  return isStressed ? Math.min(base * 1.5, 0.25) : base
}

function generateLGD(segment: LoanSegment, isStressed: boolean = false): number {
  const config = SEGMENT_CONFIG[segment]
  const base = randomBetween(config.lgd.min, config.lgd.max)
  return isStressed ? Math.min(base * 1.2, 0.85) : base
}

function generatePortfolioValue(segment: LoanSegment): number {
  const config = SEGMENT_CONFIG[segment]
  return randomBetween(config.portfolioValueRange.min, config.portfolioValueRange.max)
}

function pickState(): string {
  const states = Object.keys(STATE_POPULATION_WEIGHTS)
  const weights = Object.values(STATE_POPULATION_WEIGHTS)
  return pickWeighted(states, weights)
}

function generateOriginationDate(yearsBack: number = 5): Date {
  const now = new Date()
  const daysBack = Math.floor(seededRandom() * yearsBack * 365)
  const date = new Date(now)
  date.setDate(date.getDate() - daysBack)
  return date
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function generateLoans(count: number = 5000): Loan[] {
  resetSeed(42)
  const loans: Loan[] = []

  // Segment distribution weights (more residential and CRE)
  const segmentWeights: Record<LoanSegment, number> = {
    RESIDENTIAL_1_4: 0.25,
    CRE_NON_OWNER: 0.15,
    CRE_OWNER: 0.12,
    C_AND_I: 0.15,
    CONSUMER: 0.10,
    AUTO: 0.10,
    MULTIFAMILY: 0.08,
    CONSTRUCTION: 0.05,
  }

  for (let i = 0; i < count; i++) {
    const segment = pickWeighted(
      SEGMENT_IDS,
      SEGMENT_IDS.map((s) => segmentWeights[s])
    )
    const config = SEGMENT_CONFIG[segment]
    const portfolioValue = generatePortfolioValue(segment)
    const term = randomInt(config.typicalTerm.min, config.typicalTerm.max)
    const originationDate = generateOriginationDate(5)
    const maturityDate = new Date(originationDate)
    maturityDate.setMonth(maturityDate.getMonth() + term)

    // ~4% charge-off rate
    const isChargedOff = seededRandom() < 0.04
    let chargeOffDate: string | undefined
    let chargeOffAmount: number | undefined

    if (isChargedOff) {
      const chargeOffDateObj = new Date(originationDate)
      chargeOffDateObj.setMonth(
        chargeOffDateObj.getMonth() + randomInt(6, Math.min(term, 48))
      )
      if (chargeOffDateObj < new Date()) {
        chargeOffDate = formatDate(chargeOffDateObj)
        chargeOffAmount = portfolioValue * randomBetween(0.3, 0.8)
      }
    }

    loans.push({
      loanId: generateLoanId(),
      originationDate: formatDate(originationDate),
      maturityDate: formatDate(maturityDate),
      originalBalance: portfolioValue,
      currentBalance: portfolioValue * randomBetween(0.7, 1.0),
      segment,
      state: pickState(),
      interestRate: randomBetween(0.03, 0.12),
      term,
      borrowerCreditScore: randomInt(580, 850),
      isChargedOff: !!chargeOffDate,
      chargeOffDate,
      chargeOffAmount,
    })
  }

  return loans
}

// Generate quarterly snapshots for all loans over 5 years
export function generateLoanSnapshots(loans: Loan[]): LoanMetricsSnapshot[] {
  resetSeed(123)
  const snapshots: LoanMetricsSnapshot[] = []
  const quarters = generateQuarters(20) // 5 years of quarters

  for (const loan of loans) {
    const originationDate = new Date(loan.originationDate)

    for (const quarter of quarters) {
      const quarterDate = new Date(quarter)
      if (quarterDate < originationDate) continue
      if (loan.chargeOffDate && quarterDate > new Date(loan.chargeOffDate)) continue

      // Add some time-based variation
      const quarterIndex = quarters.indexOf(quarter)
      const economicStress = quarterIndex >= 8 && quarterIndex <= 12 // Simulate stressed period

      const pd = generatePD(loan.segment, economicStress)
      const lgd = generateLGD(loan.segment, economicStress)
      const portfolioValue = loan.currentBalance * randomBetween(0.95, 1.05)

      snapshots.push({
        loanId: loan.loanId,
        snapshotDate: quarter,
        pd,
        lgd,
        portfolioValue,
        expectedLoss: pd * lgd * portfolioValue,
      })
    }
  }

  return snapshots
}

// Generate quarters for the past N quarters
export function generateQuarters(count: number): string[] {
  const quarters: string[] = []
  const now = new Date()
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
  const currentYear = now.getFullYear()

  for (let i = count - 1; i >= 0; i--) {
    let q = currentQuarter - (i % 4)
    let y = currentYear - Math.floor(i / 4)
    if (q <= 0) {
      q += 4
      y -= 1
    }
    const month = (q - 1) * 3
    const date = new Date(y, month + 2, 28) // End of quarter
    quarters.push(formatDate(date))
  }

  return quarters
}

// Generate 36-month history for charged-off loans
export function generateChargeOffHistories(
  loans: Loan[]
): ChargeOffLoanHistory[] {
  resetSeed(456)
  const histories: ChargeOffLoanHistory[] = []

  const chargedOffLoans = loans.filter((l) => l.isChargedOff && l.chargeOffDate)

  for (const loan of chargedOffLoans.slice(0, 200)) {
    const chargeOffDate = new Date(loan.chargeOffDate!)
    const monthlySnapshots: ChargeOffLoanHistory['monthlySnapshots'] = []

    for (let monthsBefore = 36; monthsBefore >= 0; monthsBefore--) {
      const snapshotDate = new Date(chargeOffDate)
      snapshotDate.setMonth(snapshotDate.getMonth() - monthsBefore)

      // PD and LGD increase as we approach charge-off
      const progressToChargeOff = 1 - monthsBefore / 36
      const basePD = SEGMENT_CONFIG[loan.segment].pd.avg
      const baseLGD = SEGMENT_CONFIG[loan.segment].lgd.avg

      // Exponential increase in risk metrics
      const pdMultiplier = 1 + Math.pow(progressToChargeOff, 2) * 4
      const lgdMultiplier = 1 + progressToChargeOff * 0.5

      const pd = Math.min(basePD * pdMultiplier * randomBetween(0.8, 1.2), 0.95)
      const lgd = Math.min(baseLGD * lgdMultiplier * randomBetween(0.9, 1.1), 0.90)
      const portfolioValue = loan.currentBalance * randomBetween(0.95, 1.02)

      // Payment status deteriorates
      let paymentStatus: 'current' | 'delinquent_30' | 'delinquent_60' | 'delinquent_90' = 'current'
      if (monthsBefore <= 3) paymentStatus = 'delinquent_90'
      else if (monthsBefore <= 6) paymentStatus = 'delinquent_60'
      else if (monthsBefore <= 12) paymentStatus = seededRandom() < 0.7 ? 'delinquent_30' : 'current'

      monthlySnapshots.push({
        monthsBeforeChargeOff: -monthsBefore,
        date: formatDate(snapshotDate),
        pd,
        lgd,
        portfolioValue,
        paymentStatus,
      })
    }

    histories.push({
      loanId: loan.loanId,
      segment: loan.segment,
      chargeOffDate: loan.chargeOffDate!,
      chargeOffAmount: loan.chargeOffAmount!,
      monthlySnapshots,
    })
  }

  return histories
}

// Generate state-level aggregated metrics by quarter
export function generateStateMetrics(
  loans: Loan[],
  snapshots: LoanMetricsSnapshot[]
) {
  const quarters = generateQuarters(20)
  const stateQuarterlyMetrics: Record<
    string,
    Record<string, { pd: number[]; lgd: number[]; portfolioValue: number[]; count: number }>
  > = {}

  // Initialize
  for (const state of US_STATES) {
    stateQuarterlyMetrics[state.code] = {}
    for (const quarter of quarters) {
      stateQuarterlyMetrics[state.code][quarter] = {
        pd: [],
        lgd: [],
        portfolioValue: [],
        count: 0,
      }
    }
  }

  // Create loan lookup
  const loanLookup = Object.fromEntries(loans.map((l) => [l.loanId, l]))

  // Aggregate
  for (const snapshot of snapshots) {
    const loan = loanLookup[snapshot.loanId]
    if (!loan) continue

    const stateData = stateQuarterlyMetrics[loan.state]?.[snapshot.snapshotDate]
    if (!stateData) continue

    stateData.pd.push(snapshot.pd)
    stateData.lgd.push(snapshot.lgd)
    stateData.portfolioValue.push(snapshot.portfolioValue)
    stateData.count++
  }

  // Calculate averages
  const result: Record<
    string,
    { period: string; pd: number; lgd: number; portfolioValue: number; loanCount: number }[]
  > = {}

  for (const [stateCode, quarterData] of Object.entries(stateQuarterlyMetrics)) {
    result[stateCode] = []
    for (const [quarter, data] of Object.entries(quarterData)) {
      if (data.count === 0) continue
      result[stateCode].push({
        period: quarter,
        pd: data.pd.reduce((a, b) => a + b, 0) / data.pd.length,
        lgd: data.lgd.reduce((a, b) => a + b, 0) / data.lgd.length,
        portfolioValue: data.portfolioValue.reduce((a, b) => a + b, 0),
        loanCount: data.count,
      })
    }
  }

  return result
}

// Pre-generate and export data
let _cachedLoans: Loan[] | null = null
let _cachedSnapshots: LoanMetricsSnapshot[] | null = null
let _cachedChargeOffHistories: ChargeOffLoanHistory[] | null = null

export function getLoans(): Loan[] {
  if (!_cachedLoans) {
    _cachedLoans = generateLoans(5000)
  }
  return _cachedLoans
}

export function getSnapshots(): LoanMetricsSnapshot[] {
  if (!_cachedSnapshots) {
    _cachedSnapshots = generateLoanSnapshots(getLoans())
  }
  return _cachedSnapshots
}

export function getChargeOffHistories(): ChargeOffLoanHistory[] {
  if (!_cachedChargeOffHistories) {
    _cachedChargeOffHistories = generateChargeOffHistories(getLoans())
  }
  return _cachedChargeOffHistories
}

export function getStateMetricsData() {
  return generateStateMetrics(getLoans(), getSnapshots())
}
