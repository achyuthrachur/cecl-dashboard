import type { MacroIndicator, MacroDataPoint, MacroTimeSeries } from '@/types'

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations'

export async function fetchFREDSeries(
  seriesId: MacroIndicator,
  startDate: string,
  endDate: string
): Promise<MacroTimeSeries> {
  const apiKey = process.env.FRED_API_KEY

  if (!apiKey) {
    // Return mock data if no API key
    return generateMockMacroData(seriesId, startDate, endDate)
  }

  try {
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      observation_start: startDate,
      observation_end: endDate,
    })

    const response = await fetch(`${FRED_BASE_URL}?${params}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      indicator: seriesId,
      data: data.observations
        .filter((obs: any) => obs.value !== '.')
        .map((obs: any) => ({
          date: obs.date,
          value: parseFloat(obs.value),
          indicator: seriesId,
        })),
      metadata: {
        seriesId,
        title: getSeriesTitle(seriesId),
        units: getSeriesUnits(seriesId),
        frequency: 'Quarterly',
        lastUpdated: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Error fetching FRED data:', error)
    return generateMockMacroData(seriesId, startDate, endDate)
  }
}

function getSeriesTitle(seriesId: MacroIndicator): string {
  const titles: Record<MacroIndicator, string> = {
    GDPC1: 'Real Gross Domestic Product',
    CPIAUCSL: 'Consumer Price Index for All Urban Consumers',
    UNRATE: 'Unemployment Rate',
    FEDFUNDS: 'Effective Federal Funds Rate',
    GS10: '10-Year Treasury Constant Maturity Rate',
    MORTGAGE30US: '30-Year Fixed Rate Mortgage Average',
  }
  return titles[seriesId]
}

function getSeriesUnits(seriesId: MacroIndicator): string {
  const units: Record<MacroIndicator, string> = {
    GDPC1: 'Billions of Chained 2017 Dollars',
    CPIAUCSL: 'Index 1982-1984=100',
    UNRATE: 'Percent',
    FEDFUNDS: 'Percent',
    GS10: 'Percent',
    MORTGAGE30US: 'Percent',
  }
  return units[seriesId]
}

// Generate mock data when FRED API is not available
function generateMockMacroData(
  seriesId: MacroIndicator,
  startDate: string,
  endDate: string
): MacroTimeSeries {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const data: MacroDataPoint[] = []

  // Base values and volatility for each series
  const config: Record<MacroIndicator, { base: number; volatility: number; trend: number }> = {
    GDPC1: { base: 20000, volatility: 500, trend: 100 },
    CPIAUCSL: { base: 280, volatility: 5, trend: 2 },
    UNRATE: { base: 4.5, volatility: 1, trend: 0 },
    FEDFUNDS: { base: 4.0, volatility: 0.5, trend: 0.1 },
    GS10: { base: 4.0, volatility: 0.3, trend: 0 },
    MORTGAGE30US: { base: 6.5, volatility: 0.4, trend: 0 },
  }

  const { base, volatility, trend } = config[seriesId]

  let current = new Date(start)
  let value = base
  let index = 0

  while (current <= end) {
    // Add some realistic variation
    const noise = (Math.random() - 0.5) * volatility
    const trendEffect = trend * (index / 20)
    value = base + trendEffect + noise

    // Add economic cycle effects (recession around Q8-Q12)
    if (index >= 8 && index <= 12) {
      if (seriesId === 'UNRATE') value += 2
      if (seriesId === 'GDPC1') value *= 0.98
      if (seriesId === 'FEDFUNDS') value *= 0.5
    }

    data.push({
      date: current.toISOString().split('T')[0],
      value: Math.max(0, value),
      indicator: seriesId,
    })

    // Move to next quarter
    current.setMonth(current.getMonth() + 3)
    index++
  }

  return {
    indicator: seriesId,
    data,
    metadata: {
      seriesId,
      title: getSeriesTitle(seriesId),
      units: getSeriesUnits(seriesId),
      frequency: 'Quarterly',
      lastUpdated: new Date().toISOString(),
    },
  }
}

// Generate all macro data for the dashboard
export function generateAllMacroData(): Record<MacroIndicator, MacroTimeSeries> {
  const startDate = '2019-01-01'
  const endDate = '2024-12-31'
  const indicators: MacroIndicator[] = [
    'GDPC1',
    'CPIAUCSL',
    'UNRATE',
    'FEDFUNDS',
    'GS10',
    'MORTGAGE30US',
  ]

  const result: Record<string, MacroTimeSeries> = {}
  for (const indicator of indicators) {
    result[indicator] = generateMockMacroData(indicator, startDate, endDate)
  }

  return result as Record<MacroIndicator, MacroTimeSeries>
}
