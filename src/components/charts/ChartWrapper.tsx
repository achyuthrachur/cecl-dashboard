'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ChartInsight {
  type: 'info' | 'warning' | 'success' | 'tip'
  text: string
}

interface ChartWrapperProps {
  title: string
  description?: string
  insights?: ChartInsight[]
  children: React.ReactNode
  className?: string
  glass?: boolean
  animated?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
}

const insightIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  tip: Lightbulb,
}

const insightStyles = {
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  tip: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
}

export function ChartWrapper({
  title,
  description,
  insights,
  children,
  className,
  glass = true,
  animated = true,
  collapsible = false,
  defaultExpanded = true,
}: ChartWrapperProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showInsights, setShowInsights] = useState(true)

  const CardComponent = animated ? motion.div : 'div'
  const cardMotionProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' },
      }
    : {}

  return (
    <CardComponent {...cardMotionProps}>
      <Card glass={glass} className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {collapsible && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 hover:bg-accent rounded-md transition-colors"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            {insights && insights.length > 0 && (
              <button
                onClick={() => setShowInsights(!showInsights)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  showInsights
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted hover:bg-accent text-muted-foreground'
                )}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Insights</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-xs">
                  {insights.length}
                </span>
              </button>
            )}
          </div>

          {/* Insights Panel */}
          <AnimatePresence>
            {showInsights && insights && insights.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-3">
                  {insights.map((insight, index) => {
                    const Icon = insightIcons[insight.type]
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border',
                          insightStyles[insight.type]
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{insight.text}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>{children}</CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </CardComponent>
  )
}

// Pre-defined chart descriptions for consistency
export const CHART_DESCRIPTIONS = {
  geographic: {
    heatMap: {
      title: 'Geographic Risk Distribution',
      description: 'Visualizes credit risk metrics across US states. Darker colors indicate higher risk concentrations.',
      insights: [
        { type: 'info' as const, text: 'Click on any state to view detailed trend data' },
        { type: 'tip' as const, text: 'Use the metric selector to switch between PD, LGD, and Portfolio Value' },
      ],
    },
    trendChart: {
      title: 'Historical Trend Analysis',
      description: '5-year historical trend showing PD, LGD, and Portfolio Value over time for the selected geography.',
      insights: [
        { type: 'info' as const, text: 'Hover over data points to see exact values' },
      ],
    },
  },
  macro: {
    correlation: {
      title: 'Economic Correlation Analysis',
      description: 'Shows the relationship between macroeconomic indicators and portfolio default rates over time.',
      insights: [
        { type: 'info' as const, text: 'Positive correlation with unemployment typically indicates economic sensitivity' },
        { type: 'tip' as const, text: 'Use these correlations for Q-factor adjustments in CECL modeling' },
      ],
    },
    pdBySegment: {
      title: 'PD by Loan Segment',
      description: 'Probability of Default trends by loan segment, highlighting relative risk levels across the portfolio.',
      insights: [
        { type: 'warning' as const, text: 'Construction and CRE Non-Owner segments typically show higher volatility' },
      ],
    },
  },
  backtesting: {
    predictedActual: {
      title: 'Predicted vs Actual Losses',
      description: 'Compares model predictions against realized losses to assess forecast accuracy.',
      insights: [
        { type: 'info' as const, text: 'Bars represent predicted values, line shows actual losses' },
        { type: 'success' as const, text: 'Close alignment indicates good model calibration' },
      ],
    },
    variance: {
      title: 'Prediction Variance Analysis',
      description: 'Shows over and under-prediction patterns across different time periods.',
      insights: [
        { type: 'warning' as const, text: 'Red bars = under-prediction (actual > predicted)' },
        { type: 'success' as const, text: 'Green bars = over-prediction (actual < predicted)' },
        { type: 'tip' as const, text: 'Consistent under-prediction may require model recalibration' },
      ],
    },
  },
  preChargeoff: {
    pdTrajectory: {
      title: 'Pre-Charge-Off PD Trajectory',
      description: 'Average PD path for loans that charged off, tracking the 36 months before default.',
      insights: [
        { type: 'info' as const, text: 'PD typically accelerates in the final 12 months before charge-off' },
        { type: 'tip' as const, text: 'Use these patterns to set early warning indicator thresholds' },
      ],
    },
    lgdTrajectory: {
      title: 'Pre-Charge-Off LGD Trajectory',
      description: 'Loss Given Default progression for loans approaching charge-off.',
      insights: [
        { type: 'warning' as const, text: 'LGD often spikes in the final 6 months as collateral values decline' },
      ],
    },
  },
}
