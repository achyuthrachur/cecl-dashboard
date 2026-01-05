export interface StateInfo {
  code: string
  name: string
  fips: string
  region: 'Northeast' | 'Midwest' | 'South' | 'West'
}

export const US_STATES: StateInfo[] = [
  { code: 'AL', name: 'Alabama', fips: '01', region: 'South' },
  { code: 'AK', name: 'Alaska', fips: '02', region: 'West' },
  { code: 'AZ', name: 'Arizona', fips: '04', region: 'West' },
  { code: 'AR', name: 'Arkansas', fips: '05', region: 'South' },
  { code: 'CA', name: 'California', fips: '06', region: 'West' },
  { code: 'CO', name: 'Colorado', fips: '08', region: 'West' },
  { code: 'CT', name: 'Connecticut', fips: '09', region: 'Northeast' },
  { code: 'DE', name: 'Delaware', fips: '10', region: 'South' },
  { code: 'FL', name: 'Florida', fips: '12', region: 'South' },
  { code: 'GA', name: 'Georgia', fips: '13', region: 'South' },
  { code: 'HI', name: 'Hawaii', fips: '15', region: 'West' },
  { code: 'ID', name: 'Idaho', fips: '16', region: 'West' },
  { code: 'IL', name: 'Illinois', fips: '17', region: 'Midwest' },
  { code: 'IN', name: 'Indiana', fips: '18', region: 'Midwest' },
  { code: 'IA', name: 'Iowa', fips: '19', region: 'Midwest' },
  { code: 'KS', name: 'Kansas', fips: '20', region: 'Midwest' },
  { code: 'KY', name: 'Kentucky', fips: '21', region: 'South' },
  { code: 'LA', name: 'Louisiana', fips: '22', region: 'South' },
  { code: 'ME', name: 'Maine', fips: '23', region: 'Northeast' },
  { code: 'MD', name: 'Maryland', fips: '24', region: 'South' },
  { code: 'MA', name: 'Massachusetts', fips: '25', region: 'Northeast' },
  { code: 'MI', name: 'Michigan', fips: '26', region: 'Midwest' },
  { code: 'MN', name: 'Minnesota', fips: '27', region: 'Midwest' },
  { code: 'MS', name: 'Mississippi', fips: '28', region: 'South' },
  { code: 'MO', name: 'Missouri', fips: '29', region: 'Midwest' },
  { code: 'MT', name: 'Montana', fips: '30', region: 'West' },
  { code: 'NE', name: 'Nebraska', fips: '31', region: 'Midwest' },
  { code: 'NV', name: 'Nevada', fips: '32', region: 'West' },
  { code: 'NH', name: 'New Hampshire', fips: '33', region: 'Northeast' },
  { code: 'NJ', name: 'New Jersey', fips: '34', region: 'Northeast' },
  { code: 'NM', name: 'New Mexico', fips: '35', region: 'West' },
  { code: 'NY', name: 'New York', fips: '36', region: 'Northeast' },
  { code: 'NC', name: 'North Carolina', fips: '37', region: 'South' },
  { code: 'ND', name: 'North Dakota', fips: '38', region: 'Midwest' },
  { code: 'OH', name: 'Ohio', fips: '39', region: 'Midwest' },
  { code: 'OK', name: 'Oklahoma', fips: '40', region: 'South' },
  { code: 'OR', name: 'Oregon', fips: '41', region: 'West' },
  { code: 'PA', name: 'Pennsylvania', fips: '42', region: 'Northeast' },
  { code: 'RI', name: 'Rhode Island', fips: '44', region: 'Northeast' },
  { code: 'SC', name: 'South Carolina', fips: '45', region: 'South' },
  { code: 'SD', name: 'South Dakota', fips: '46', region: 'Midwest' },
  { code: 'TN', name: 'Tennessee', fips: '47', region: 'South' },
  { code: 'TX', name: 'Texas', fips: '48', region: 'South' },
  { code: 'UT', name: 'Utah', fips: '49', region: 'West' },
  { code: 'VT', name: 'Vermont', fips: '50', region: 'Northeast' },
  { code: 'VA', name: 'Virginia', fips: '51', region: 'South' },
  { code: 'WA', name: 'Washington', fips: '53', region: 'West' },
  { code: 'WV', name: 'West Virginia', fips: '54', region: 'South' },
  { code: 'WI', name: 'Wisconsin', fips: '55', region: 'Midwest' },
  { code: 'WY', name: 'Wyoming', fips: '56', region: 'West' },
  { code: 'DC', name: 'District of Columbia', fips: '11', region: 'South' },
]

export const STATE_BY_CODE = Object.fromEntries(
  US_STATES.map((s) => [s.code, s])
) as Record<string, StateInfo>

export const STATE_BY_FIPS = Object.fromEntries(
  US_STATES.map((s) => [s.fips, s])
) as Record<string, StateInfo>

export function getStateName(code: string): string {
  return STATE_BY_CODE[code]?.name ?? code
}

export function getStateFips(code: string): string {
  return STATE_BY_CODE[code]?.fips ?? '00'
}

// Population weights for realistic loan distribution
export const STATE_POPULATION_WEIGHTS: Record<string, number> = {
  CA: 0.118,
  TX: 0.088,
  FL: 0.066,
  NY: 0.059,
  PA: 0.039,
  IL: 0.038,
  OH: 0.035,
  GA: 0.032,
  NC: 0.032,
  MI: 0.030,
  NJ: 0.028,
  VA: 0.026,
  WA: 0.023,
  AZ: 0.022,
  MA: 0.021,
  TN: 0.021,
  IN: 0.020,
  MD: 0.019,
  MO: 0.019,
  WI: 0.018,
  CO: 0.018,
  MN: 0.017,
  SC: 0.016,
  AL: 0.015,
  LA: 0.014,
  KY: 0.014,
  OR: 0.013,
  OK: 0.012,
  CT: 0.011,
  UT: 0.010,
  IA: 0.010,
  NV: 0.010,
  AR: 0.009,
  MS: 0.009,
  KS: 0.009,
  NM: 0.006,
  NE: 0.006,
  ID: 0.006,
  WV: 0.005,
  HI: 0.004,
  NH: 0.004,
  ME: 0.004,
  MT: 0.003,
  RI: 0.003,
  DE: 0.003,
  SD: 0.003,
  ND: 0.002,
  AK: 0.002,
  DC: 0.002,
  VT: 0.002,
  WY: 0.002,
}
