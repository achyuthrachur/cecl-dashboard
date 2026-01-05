import type { LoanSegment } from '@/types'

export interface SegmentConfig {
  id: LoanSegment
  label: string
  shortLabel: string
  description: string
  pd: { min: number; max: number; avg: number }
  lgd: { min: number; max: number; avg: number }
  eadRange: { min: number; max: number }
  typicalTerm: { min: number; max: number }
  color: string
}

export const SEGMENT_CONFIG: Record<LoanSegment, SegmentConfig> = {
  RESIDENTIAL_1_4: {
    id: 'RESIDENTIAL_1_4',
    label: '1-4 Family Residential',
    shortLabel: '1-4 Family',
    description: 'Residential mortgages secured by 1-4 family properties',
    pd: { min: 0.005, max: 0.03, avg: 0.015 },
    lgd: { min: 0.20, max: 0.40, avg: 0.30 },
    eadRange: { min: 100000, max: 1500000 },
    typicalTerm: { min: 180, max: 360 },
    color: '#3b82f6', // blue
  },
  CONSUMER: {
    id: 'CONSUMER',
    label: 'Consumer',
    shortLabel: 'Consumer',
    description: 'Unsecured consumer loans and credit cards',
    pd: { min: 0.05, max: 0.15, avg: 0.08 },
    lgd: { min: 0.40, max: 0.70, avg: 0.55 },
    eadRange: { min: 5000, max: 100000 },
    typicalTerm: { min: 12, max: 84 },
    color: '#8b5cf6', // purple
  },
  CRE_NON_OWNER: {
    id: 'CRE_NON_OWNER',
    label: 'CRE Non-Owner Occupied',
    shortLabel: 'CRE NOO',
    description: 'Commercial real estate loans where borrower does not occupy the property',
    pd: { min: 0.01, max: 0.08, avg: 0.035 },
    lgd: { min: 0.30, max: 0.50, avg: 0.40 },
    eadRange: { min: 500000, max: 25000000 },
    typicalTerm: { min: 60, max: 120 },
    color: '#f59e0b', // amber
  },
  CRE_OWNER: {
    id: 'CRE_OWNER',
    label: 'CRE Owner Occupied',
    shortLabel: 'CRE OO',
    description: 'Commercial real estate loans where borrower occupies the property',
    pd: { min: 0.01, max: 0.06, avg: 0.03 },
    lgd: { min: 0.25, max: 0.45, avg: 0.35 },
    eadRange: { min: 250000, max: 15000000 },
    typicalTerm: { min: 60, max: 180 },
    color: '#10b981', // emerald
  },
  C_AND_I: {
    id: 'C_AND_I',
    label: 'Commercial & Industrial',
    shortLabel: 'C&I',
    description: 'Business loans for working capital, equipment, or other business purposes',
    pd: { min: 0.02, max: 0.10, avg: 0.05 },
    lgd: { min: 0.40, max: 0.60, avg: 0.50 },
    eadRange: { min: 50000, max: 10000000 },
    typicalTerm: { min: 12, max: 84 },
    color: '#ec4899', // pink
  },
  AUTO: {
    id: 'AUTO',
    label: 'Auto',
    shortLabel: 'Auto',
    description: 'Vehicle financing loans',
    pd: { min: 0.02, max: 0.08, avg: 0.04 },
    lgd: { min: 0.35, max: 0.55, avg: 0.45 },
    eadRange: { min: 10000, max: 100000 },
    typicalTerm: { min: 36, max: 84 },
    color: '#06b6d4', // cyan
  },
  MULTIFAMILY: {
    id: 'MULTIFAMILY',
    label: 'Multifamily',
    shortLabel: 'Multifamily',
    description: 'Loans secured by residential properties with 5+ units',
    pd: { min: 0.01, max: 0.05, avg: 0.025 },
    lgd: { min: 0.25, max: 0.45, avg: 0.35 },
    eadRange: { min: 1000000, max: 50000000 },
    typicalTerm: { min: 60, max: 120 },
    color: '#84cc16', // lime
  },
  CONSTRUCTION: {
    id: 'CONSTRUCTION',
    label: 'Construction/Land Development',
    shortLabel: 'Construction',
    description: 'Loans for construction projects and land development',
    pd: { min: 0.03, max: 0.12, avg: 0.065 },
    lgd: { min: 0.40, max: 0.65, avg: 0.52 },
    eadRange: { min: 500000, max: 30000000 },
    typicalTerm: { min: 12, max: 36 },
    color: '#f97316', // orange
  },
}

export const SEGMENTS = Object.values(SEGMENT_CONFIG)
export const SEGMENT_IDS = Object.keys(SEGMENT_CONFIG) as LoanSegment[]

export function getSegmentLabel(segment: LoanSegment): string {
  return SEGMENT_CONFIG[segment]?.label ?? segment
}

export function getSegmentColor(segment: LoanSegment): string {
  return SEGMENT_CONFIG[segment]?.color ?? '#6b7280'
}
