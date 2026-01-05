export type MacroIndicator =
  | 'GDPC1'        // Real GDP
  | 'CPIAUCSL'     // CPI
  | 'UNRATE'       // Unemployment Rate
  | 'FEDFUNDS'     // Federal Funds Rate
  | 'GS10'         // 10-Year Treasury
  | 'MORTGAGE30US' // 30-Year Mortgage Rate

export interface MacroDataPoint {
  date: string
  value: number
  indicator: MacroIndicator
}

export interface MacroTimeSeries {
  indicator: MacroIndicator
  data: MacroDataPoint[]
  metadata: {
    seriesId: string
    title: string
    units: string
    frequency: string
    lastUpdated: string
  }
}

export interface MacroCorrelation {
  indicator: MacroIndicator
  segment: string
  metric: 'pd' | 'lgd' | 'ead'
  correlation: number
  pValue: number
  lagMonths: number
}

export const MACRO_INDICATOR_INFO: Record<MacroIndicator, { name: string; units: string; description: string }> = {
  GDPC1: {
    name: 'Real GDP',
    units: 'Billions of Chained 2017 Dollars',
    description: 'Real Gross Domestic Product',
  },
  CPIAUCSL: {
    name: 'CPI',
    units: 'Index 1982-1984=100',
    description: 'Consumer Price Index for All Urban Consumers',
  },
  UNRATE: {
    name: 'Unemployment Rate',
    units: 'Percent',
    description: 'Civilian Unemployment Rate',
  },
  FEDFUNDS: {
    name: 'Fed Funds Rate',
    units: 'Percent',
    description: 'Effective Federal Funds Rate',
  },
  GS10: {
    name: '10-Year Treasury',
    units: 'Percent',
    description: '10-Year Treasury Constant Maturity Rate',
  },
  MORTGAGE30US: {
    name: '30-Year Mortgage',
    units: 'Percent',
    description: '30-Year Fixed Rate Mortgage Average',
  },
}
