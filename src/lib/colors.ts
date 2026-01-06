import { scaleSequential, scaleLinear } from 'd3-scale'
import { interpolateRdYlGn, interpolateYlOrRd, interpolateBlues } from 'd3-scale-chromatic'

export type MetricType = 'pd' | 'lgd' | 'portfolioValue'

// Color scales for different metrics
// PD: Higher is worse (red), lower is better (green)
export const pdColorScale = scaleSequential(interpolateYlOrRd).domain([0, 0.15])

// LGD: Higher is worse (red), lower is better (green)
export const lgdColorScale = scaleSequential(interpolateYlOrRd).domain([0.2, 0.7])

// Portfolio Value: Neutral (blue scale) - just showing concentration
export const portfolioValueColorScale = scaleSequential(interpolateBlues).domain([0, 1])

export function getMetricColor(metric: MetricType, value: number): string {
  switch (metric) {
    case 'pd':
      return pdColorScale(value)
    case 'lgd':
      return lgdColorScale(value)
    case 'portfolioValue':
      return portfolioValueColorScale(value)
    default:
      return '#6b7280'
  }
}

// Create a discrete color scale for legend
export function getColorSteps(metric: MetricType, steps: number = 5): { value: number; color: string }[] {
  const result: { value: number; color: string }[] = []

  let domain: [number, number]
  switch (metric) {
    case 'pd':
      domain = [0, 0.15]
      break
    case 'lgd':
      domain = [0.2, 0.7]
      break
    case 'portfolioValue':
      domain = [0, 1]
      break
  }

  for (let i = 0; i < steps; i++) {
    const value = domain[0] + (domain[1] - domain[0]) * (i / (steps - 1))
    result.push({
      value,
      color: getMetricColor(metric, value),
    })
  }

  return result
}

// Risk level color based on thresholds
export function getRiskLevelColor(pd: number): string {
  if (pd < 0.03) return 'var(--success)'
  if (pd < 0.06) return 'var(--warning)'
  return 'var(--danger)'
}

export function getRiskLevel(pd: number): 'low' | 'medium' | 'high' {
  if (pd < 0.03) return 'low'
  if (pd < 0.06) return 'medium'
  return 'high'
}

// Chart colors for consistent styling
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  pd: '#3b82f6',
  lgd: '#f59e0b',
  portfolioValue: '#10b981',
  grid: '#e5e7eb',
  gridDark: '#374151',
  text: '#6b7280',
  textDark: '#9ca3af',
}

// Segment colors
export const SEGMENT_COLORS: Record<string, string> = {
  RESIDENTIAL_1_4: '#3b82f6',
  CRE_NON_OWNER: '#f59e0b',
  CRE_OWNER: '#10b981',
  C_AND_I: '#ec4899',
  CONSUMER: '#8b5cf6',
  AUTO: '#06b6d4',
  MULTIFAMILY: '#84cc16',
  CONSTRUCTION: '#f97316',
}
