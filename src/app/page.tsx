'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Map,
  GitCompare,
  FileText,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { formatPercent, formatCurrency, formatCompactNumber } from '@/lib/utils'
import { AnimatedNumber, StaggeredContainer, StaggeredItem } from '@/components/animations'
import { getLoans, getSnapshots } from '@/data/loans'
import { SEGMENT_CONFIG } from '@/data/segments'
import type { LoanSegment } from '@/types'

const recentAlerts = [
  { message: 'Construction PD increased 15% in Q4', severity: 'high' },
  { message: 'CRE NOO concentration exceeds 300% of capital', severity: 'medium' },
  { message: 'Consumer segment loss rate trending upward', severity: 'medium' },
]

function MetricCard({
  title,
  value,
  rawValue,
  format,
  change,
  changeLabel,
  icon: Icon,
  trend,
  delay = 0,
}: {
  title: string
  value: string
  rawValue?: number
  format?: 'currency' | 'percent' | 'number'
  change?: string
  changeLabel?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 100 }}
    >
      <Card glass className="metric-card card-interactive">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <div className="text-2xl font-bold mt-1 tabular-nums">
                {rawValue !== undefined && format ? (
                  <AnimatedNumber value={rawValue} format={format} duration={1.5} delay={delay + 0.3} />
                ) : (
                  value
                )}
              </div>
              {change && (
                <div className="flex items-center gap-1 mt-2">
                  {trend === 'up' && <TrendingUp className="h-4 w-4 text-danger" />}
                  {trend === 'down' && <TrendingDown className="h-4 w-4 text-success" />}
                  <span
                    className={`text-sm ${
                      trend === 'up' ? 'text-danger' : trend === 'down' ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {change}
                  </span>
                  {changeLabel && (
                    <span className="text-sm text-muted-foreground">{changeLabel}</span>
                  )}
                </div>
              )}
            </div>
            <motion.div
              className="p-3 rounded-lg bg-primary/10"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Icon className="h-5 w-5 text-primary" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function QuickLinkCard({
  href,
  icon: Icon,
  title,
  description,
  index = 0,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
    >
      <Link href={href}>
        <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 cursor-pointer card-interactive">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <motion.div
                className="p-3 rounded-lg bg-primary/10"
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                <Icon className="h-6 w-6 text-primary" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function DashboardPage() {
  // Get actual loan data
  const loans = useMemo(() => getLoans(), [])
  const snapshots = useMemo(() => getSnapshots(), [])

  // Calculate summary metrics from actual data
  const summaryMetrics = useMemo(() => {
    const totalExposure = loans.reduce((sum, loan) => sum + loan.currentBalance, 0)
    const portfolioCount = loans.length

    // Get latest snapshots for each loan to calculate averages
    const latestSnapshots = new Map<string, typeof snapshots[0]>()
    snapshots.forEach(snapshot => {
      const existing = latestSnapshots.get(snapshot.loanId)
      if (!existing || snapshot.snapshotDate > existing.snapshotDate) {
        latestSnapshots.set(snapshot.loanId, snapshot)
      }
    })

    const snapshotValues = Array.from(latestSnapshots.values())
    const avgPD = snapshotValues.length > 0
      ? snapshotValues.reduce((sum, s) => sum + s.pd, 0) / snapshotValues.length
      : 0
    const avgLGD = snapshotValues.length > 0
      ? snapshotValues.reduce((sum, s) => sum + s.lgd, 0) / snapshotValues.length
      : 0
    const totalExpectedLoss = snapshotValues.reduce((sum, s) => sum + s.expectedLoss, 0)

    const chargedOffLoans = loans.filter(l => l.isChargedOff)
    const chargeOffRate = loans.length > 0 ? chargedOffLoans.length / loans.length : 0

    return {
      totalExposure,
      portfolioCount,
      avgPD,
      avgLGD,
      totalExpectedLoss,
      pdChange: 0.003, // Would need historical comparison
      lgdChange: -0.02, // Would need historical comparison
      chargeOffRate,
    }
  }, [loans, snapshots])

  // Calculate segment-level metrics from actual data
  const riskSegments = useMemo(() => {
    const segmentMap = new Map<LoanSegment, { loans: typeof loans; pds: number[]; lgds: number[] }>()

    // Get latest snapshot PD/LGD for each loan
    const latestSnapshots = new Map<string, typeof snapshots[0]>()
    snapshots.forEach(snapshot => {
      const existing = latestSnapshots.get(snapshot.loanId)
      if (!existing || snapshot.snapshotDate > existing.snapshotDate) {
        latestSnapshots.set(snapshot.loanId, snapshot)
      }
    })

    // Group loans by segment
    loans.forEach(loan => {
      if (!segmentMap.has(loan.segment)) {
        segmentMap.set(loan.segment, { loans: [], pds: [], lgds: [] })
      }
      const segmentData = segmentMap.get(loan.segment)!
      segmentData.loans.push(loan)

      const snapshot = latestSnapshots.get(loan.loanId)
      if (snapshot) {
        segmentData.pds.push(snapshot.pd)
        segmentData.lgds.push(snapshot.lgd)
      }
    })

    // Calculate metrics for each segment
    return Array.from(segmentMap.entries())
      .map(([segment, data]) => {
        const config = SEGMENT_CONFIG[segment]
        const exposure = data.loans.reduce((sum, loan) => sum + loan.currentBalance, 0)
        const avgPD = data.pds.length > 0 ? data.pds.reduce((a, b) => a + b, 0) / data.pds.length : config.pd.avg
        const avgLGD = data.lgds.length > 0 ? data.lgds.reduce((a, b) => a + b, 0) / data.lgds.length : config.lgd.avg

        // Determine risk status based on PD
        let status: 'good' | 'warning' | 'alert' = 'good'
        if (avgPD > 0.06) status = 'alert'
        else if (avgPD > 0.04) status = 'warning'

        return {
          name: config.label,
          pd: avgPD,
          lgd: avgLGD,
          exposure,
          status,
        }
      })
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 6) // Top 6 segments by exposure
  }, [loans, snapshots])

  return (
    <div className="min-h-screen">
      <Header
        title="CECL Dashboard Overview"
        subtitle="Current Expected Credit Losses monitoring and analysis"
      />

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-6 border border-primary/20"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Portfolio Health Dashboard</span>
            </div>
            <h2 className="text-xl font-bold gradient-text-animated">
              Welcome to CECL Monitoring
            </h2>
            <p className="text-muted-foreground mt-1">
              Real-time credit risk analytics and regulatory compliance insights
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Portfolio Value"
            value={formatCurrency(summaryMetrics.totalExposure)}
            rawValue={summaryMetrics.totalExposure}
            format="currency"
            icon={TrendingUp}
            delay={0}
          />
          <MetricCard
            title="Portfolio Average PD"
            value={formatPercent(summaryMetrics.avgPD)}
            rawValue={summaryMetrics.avgPD}
            format="percent"
            change={`+${formatPercent(summaryMetrics.pdChange)}`}
            changeLabel="vs last quarter"
            icon={AlertTriangle}
            trend="up"
            delay={0.1}
          />
          <MetricCard
            title="Portfolio Average LGD"
            value={formatPercent(summaryMetrics.avgLGD)}
            rawValue={summaryMetrics.avgLGD}
            format="percent"
            change={formatPercent(summaryMetrics.lgdChange)}
            changeLabel="vs last quarter"
            icon={TrendingDown}
            trend="down"
            delay={0.2}
          />
          <MetricCard
            title="Expected Credit Loss"
            value={formatCurrency(summaryMetrics.totalExpectedLoss)}
            rawValue={summaryMetrics.totalExpectedLoss}
            format="currency"
            icon={CheckCircle}
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk by Segment */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card glass>
              <CardHeader>
                <CardTitle>Risk Metrics by Segment</CardTitle>
                <CardDescription>Current quarter PD, LGD, and exposure by loan segment</CardDescription>
              </CardHeader>
              <CardContent>
                <StaggeredContainer className="space-y-3">
                  {riskSegments.map((segment) => (
                    <StaggeredItem key={segment.name}>
                      <motion.div
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={`w-2 h-2 rounded-full ${
                              segment.status === 'good'
                                ? 'bg-success'
                                : segment.status === 'warning'
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}
                            animate={segment.status === 'alert' ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="font-medium">{segment.name}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">PD: </span>
                            <span className="font-mono metric-pd">{formatPercent(segment.pd)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">LGD: </span>
                            <span className="font-mono metric-lgd">{formatPercent(segment.lgd)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exposure: </span>
                            <span className="font-mono metric-portfolio-value">{formatCompactNumber(segment.exposure)}</span>
                          </div>
                        </div>
                      </motion.div>
                    </StaggeredItem>
                  ))}
                </StaggeredContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card glass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Recent Alerts
                  <motion.span
                    className="inline-flex h-2 w-2 rounded-full bg-danger"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <StaggeredContainer className="space-y-3">
                  {recentAlerts.map((alert, index) => (
                    <StaggeredItem key={index}>
                      <motion.div
                        className={`p-3 rounded-lg border ${
                          alert.severity === 'high'
                            ? 'risk-high'
                            : alert.severity === 'medium'
                            ? 'risk-medium'
                            : 'risk-low'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start gap-2">
                          <motion.div
                            animate={alert.severity === 'high' ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                          >
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          </motion.div>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                      </motion.div>
                    </StaggeredItem>
                  ))}
                </StaggeredContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Links */}
        <div>
          <motion.h2
            className="text-lg font-semibold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Analysis Modules
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickLinkCard
              href="/geographic"
              icon={Map}
              title="Geographic Analysis"
              description="View risk metrics and portfolio value by state"
              index={0}
            />
            <QuickLinkCard
              href="/macro"
              icon={TrendingUp}
              title="Macro Correlations"
              description="Credit metrics vs economic indicators"
              index={1}
            />
            <QuickLinkCard
              href="/backtesting"
              icon={GitCompare}
              title="Backtesting"
              description="Predicted vs actual loss comparison"
              index={2}
            />
            <QuickLinkCard
              href="/reports"
              icon={FileText}
              title="AI Reports"
              description="Generate automated analysis reports"
              index={3}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
