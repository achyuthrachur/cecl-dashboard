'use client'

import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Map,
  GitCompare,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { formatPercent, formatCurrency, formatCompactNumber } from '@/lib/utils'

// Mock summary data
const summaryMetrics = {
  totalExposure: 2450000000,
  portfolioCount: 5000,
  avgPD: 0.042,
  avgLGD: 0.38,
  totalExpectedLoss: 39690000,
  pdChange: 0.003,
  lgdChange: -0.02,
  chargeOffRate: 0.018,
}

const riskSegments = [
  { name: 'CRE Non-Owner', pd: 0.045, lgd: 0.42, exposure: 520000000, status: 'warning' },
  { name: '1-4 Family', pd: 0.018, lgd: 0.28, exposure: 680000000, status: 'good' },
  { name: 'C&I', pd: 0.058, lgd: 0.52, exposure: 380000000, status: 'warning' },
  { name: 'Consumer', pd: 0.092, lgd: 0.58, exposure: 210000000, status: 'alert' },
  { name: 'Construction', pd: 0.072, lgd: 0.55, exposure: 190000000, status: 'alert' },
  { name: 'Auto', pd: 0.038, lgd: 0.42, exposure: 180000000, status: 'good' },
]

const recentAlerts = [
  { message: 'Construction PD increased 15% in Q4', severity: 'high' },
  { message: 'CRE NOO concentration exceeds 300% of capital', severity: 'medium' },
  { message: 'Consumer segment loss rate trending upward', severity: 'medium' },
]

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  change?: string
  changeLabel?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card glass className="metric-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
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
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLinkCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="CECL Dashboard Overview"
        subtitle="Current Expected Credit Losses monitoring and analysis"
      />

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Exposure (EAD)"
            value={formatCurrency(summaryMetrics.totalExposure)}
            icon={TrendingUp}
          />
          <MetricCard
            title="Portfolio Average PD"
            value={formatPercent(summaryMetrics.avgPD)}
            change={`+${formatPercent(summaryMetrics.pdChange)}`}
            changeLabel="vs last quarter"
            icon={AlertTriangle}
            trend="up"
          />
          <MetricCard
            title="Portfolio Average LGD"
            value={formatPercent(summaryMetrics.avgLGD)}
            change={formatPercent(summaryMetrics.lgdChange)}
            changeLabel="vs last quarter"
            icon={TrendingDown}
            trend="down"
          />
          <MetricCard
            title="Expected Credit Loss"
            value={formatCurrency(summaryMetrics.totalExpectedLoss)}
            icon={CheckCircle}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk by Segment */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Risk Metrics by Segment</CardTitle>
              <CardDescription>Current quarter PD, LGD, and exposure by loan segment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskSegments.map((segment) => (
                  <div
                    key={segment.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          segment.status === 'good'
                            ? 'bg-success'
                            : segment.status === 'warning'
                            ? 'bg-warning'
                            : 'bg-danger'
                        }`}
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
                        <span className="font-mono metric-ead">{formatCompactNumber(segment.exposure)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'high'
                        ? 'risk-high'
                        : alert.severity === 'medium'
                        ? 'risk-medium'
                        : 'risk-low'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Analysis Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickLinkCard
              href="/geographic"
              icon={Map}
              title="Geographic Analysis"
              description="View PD/LGD/EAD heat maps by state"
            />
            <QuickLinkCard
              href="/macro"
              icon={TrendingUp}
              title="Macro Correlations"
              description="Credit metrics vs economic indicators"
            />
            <QuickLinkCard
              href="/backtesting"
              icon={GitCompare}
              title="Backtesting"
              description="Predicted vs actual loss comparison"
            />
            <QuickLinkCard
              href="/reports"
              icon={FileText}
              title="AI Reports"
              description="Generate automated analysis reports"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
