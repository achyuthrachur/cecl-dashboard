'use client'

import { useState, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { Tooltip } from '@/components/ui/tooltip'
import { getMetricColor, type MetricType } from '@/lib/colors'
import { formatPercent, formatCurrency } from '@/lib/utils'
import { getStateName, STATE_BY_FIPS } from '@/data/states'

// TopoJSON for US states - will be loaded from public folder
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

export interface StateData {
  stateCode: string
  pd: number
  lgd: number
  ead: number
  loanCount: number
}

interface USHeatMapProps {
  data: StateData[]
  metric: MetricType
  onStateClick?: (stateCode: string) => void
  selectedState?: string | null
}

export function USHeatMap({
  data,
  metric,
  onStateClick,
  selectedState,
}: USHeatMapProps) {
  const [tooltipContent, setTooltipContent] = useState<string>('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)

  // Create lookup map for state data by FIPS code
  const stateDataMap = useMemo(() => {
    const map = new Map<string, StateData>()
    data.forEach((d) => {
      const state = Object.values(STATE_BY_FIPS).find(
        (s) => s.code === d.stateCode
      )
      if (state) {
        map.set(state.fips, d)
      }
    })
    return map
  }, [data])

  const handleMouseEnter = (
    geo: any,
    event: React.MouseEvent<SVGPathElement>
  ) => {
    const fips = geo.id
    const stateInfo = STATE_BY_FIPS[fips]
    const stateData = stateDataMap.get(fips)

    if (stateInfo && stateData) {
      const metricValue =
        metric === 'pd'
          ? formatPercent(stateData.pd)
          : metric === 'lgd'
          ? formatPercent(stateData.lgd)
          : formatCurrency(stateData.ead)

      setTooltipContent(
        `${stateInfo.name}\n${metric.toUpperCase()}: ${metricValue}\nLoans: ${stateData.loanCount}`
      )
      setTooltipPosition({ x: event.clientX, y: event.clientY })
      setShowTooltip(true)
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const handleClick = (geo: any) => {
    const fips = geo.id
    const stateInfo = STATE_BY_FIPS[fips]
    if (stateInfo && onStateClick) {
      onStateClick(stateInfo.code)
    }
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{
          scale: 1000,
        }}
        className="w-full h-full"
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = geo.id
                const stateData = stateDataMap.get(fips)
                const stateInfo = STATE_BY_FIPS[fips]
                const isSelected = stateInfo?.code === selectedState

                let fillColor = '#e5e7eb' // default gray
                if (stateData) {
                  const value =
                    metric === 'pd'
                      ? stateData.pd
                      : metric === 'lgd'
                      ? stateData.lgd
                      : stateData.ead / 100000000 // Normalize EAD
                  fillColor = getMetricColor(metric, value)
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) => handleMouseEnter(geo, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(geo)}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: isSelected ? '#3b82f6' : '#fff',
                        strokeWidth: isSelected ? 2 : 0.5,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      },
                      hover: {
                        fill: fillColor,
                        stroke: '#3b82f6',
                        strokeWidth: 1.5,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: fillColor,
                        stroke: '#3b82f6',
                        strokeWidth: 2,
                        outline: 'none',
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Custom Tooltip */}
      {showTooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-popover text-popover-foreground rounded-lg shadow-lg border border-border pointer-events-none whitespace-pre-line"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  )
}
