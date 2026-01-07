'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type AIReportRequest, type AIReportResponse } from '@/lib/ai'
import { getReportData, formatReportDataForAI, getAllSegmentMetrics, getPortfolioMetrics } from '@/lib/portfolio-metrics'
import { SEGMENT_CONFIG, SEGMENT_IDS } from '@/data/segments'
import type { LoanSegment } from '@/types'
import {
  FileText,
  Map,
  TrendingUp,
  GitCompare,
  AlertTriangle,
  Sparkles,
  Download,
  Copy,
  Check,
  Loader2,
  Layers,
  Building2,
} from 'lucide-react'

type Module = 'geographic' | 'macro' | 'backtesting' | 'pre-chargeoff'
type ReportType = 'executive_summary' | 'pattern_analysis' | 'recommendations'
type ReportScope = 'portfolio' | 'segment'

const modules: { id: Module; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'geographic', label: 'Geographic', icon: Map, description: 'State-level risk analysis' },
  { id: 'macro', label: 'Macro Trends', icon: TrendingUp, description: 'Economic correlations' },
  { id: 'backtesting', label: 'Backtesting', icon: GitCompare, description: 'Model performance' },
  { id: 'pre-chargeoff', label: 'Pre-Charge-Off', icon: AlertTriangle, description: 'Warning signals' },
]

const reportTypes: { id: ReportType; label: string; description: string }[] = [
  { id: 'executive_summary', label: 'Executive Summary', description: 'High-level overview for committee presentation' },
  { id: 'pattern_analysis', label: 'Pattern Analysis', description: 'Detailed analysis of trends and patterns' },
  { id: 'recommendations', label: 'Recommendations', description: 'Actionable suggestions and next steps' },
]

export default function ReportsPage() {
  const [selectedModule, setSelectedModule] = useState<Module>('geographic')
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('executive_summary')
  const [selectedScope, setSelectedScope] = useState<ReportScope>('portfolio')
  const [selectedSegment, setSelectedSegment] = useState<LoanSegment | null>(null)
  const [report, setReport] = useState<AIReportResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Get real portfolio metrics
  const portfolioMetrics = useMemo(() => getPortfolioMetrics(), [])
  const segmentMetrics = useMemo(() => getAllSegmentMetrics(), [])

  // Get the selected segment's metrics
  const selectedSegmentMetrics = useMemo(() => {
    if (!selectedSegment) return null
    return segmentMetrics.find(s => s.segmentId === selectedSegment)
  }, [selectedSegment, segmentMetrics])

  // Get the current metrics to display (either portfolio or segment)
  const currentMetrics = useMemo(() => {
    if (selectedScope === 'segment' && selectedSegmentMetrics) {
      return selectedSegmentMetrics
    }
    return portfolioMetrics
  }, [selectedScope, selectedSegmentMetrics, portfolioMetrics])

  const handleGenerateReport = async () => {
    setIsLoading(true)
    setReport(null)

    try {
      // Get real report data from the portfolio
      const reportData = getReportData(selectedScope === 'segment' ? selectedSegment ?? undefined : undefined)
      const formattedData = formatReportDataForAI(reportData, selectedScope === 'segment' ? selectedSegment ?? undefined : undefined)

      const request: AIReportRequest = {
        module: selectedModule,
        reportType: selectedReportType,
        data: formattedData,
      }

      // Call the API route (runs on server where env vars are available)
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const result: AIReportResponse = await response.json()
      setReport(result)
    } catch (error) {
      setReport({ content: 'Error generating report. Please try again.', isAIGenerated: false, source: 'mock' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExport = () => {
    if (!report) return
    const scopeLabel = selectedScope === 'segment' && selectedSegment
      ? `-${SEGMENT_CONFIG[selectedSegment].shortLabel.toLowerCase().replace(/\s+/g, '-')}`
      : ''
    const blob = new Blob([report.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cecl-${selectedModule}-${selectedReportType}${scopeLabel}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header
        title="AI Report Generator"
        subtitle="Generate automated analysis reports using AI"
      />

      <div className="p-6 space-y-6">
        {/* Current Metrics Summary */}
        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {selectedScope === 'segment' && selectedSegmentMetrics ? (
                <>
                  <Building2 className="h-4 w-4" />
                  {selectedSegmentMetrics.segmentName} Metrics
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Full Portfolio Metrics
                </>
              )}
            </CardTitle>
            <CardDescription>
              Real-time calculated values from loan data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Exposure</p>
                <p className="text-lg font-bold">{currentMetrics.totalExposureFormatted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Loan Count</p>
                <p className="text-lg font-bold">{currentMetrics.loanCount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Average PD</p>
                <p className="text-lg font-bold">{currentMetrics.avgPDFormatted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Average LGD</p>
                <p className="text-lg font-bold">{currentMetrics.avgLGDFormatted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Expected Loss</p>
                <p className="text-lg font-bold">{currentMetrics.totalExpectedLossFormatted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Charge-Off Rate</p>
                <p className="text-lg font-bold">{currentMetrics.chargeOffRateFormatted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Scope Selection */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Report Scope</CardTitle>
              <CardDescription>Choose portfolio or segment level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => {
                  setSelectedScope('portfolio')
                  setSelectedSegment(null)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  selectedScope === 'portfolio'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <Layers className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Full Portfolio</p>
                  <p className={`text-xs ${selectedScope === 'portfolio' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {portfolioMetrics.totalExposureFormatted} total exposure
                  </p>
                </div>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or select segment</span>
                </div>
              </div>

              <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
                {segmentMetrics.map((segment) => (
                  <button
                    key={segment.segmentId}
                    onClick={() => {
                      setSelectedScope('segment')
                      setSelectedSegment(segment.segmentId)
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm ${
                      selectedScope === 'segment' && selectedSegment === segment.segmentId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SEGMENT_CONFIG[segment.segmentId].color }}
                    />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium truncate">{segment.segmentShortName}</p>
                      <p className={`text-xs ${
                        selectedScope === 'segment' && selectedSegment === segment.segmentId
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}>
                        {segment.totalExposureFormatted} ({(segment.percentOfPortfolio * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Selection */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Select Module</CardTitle>
              <CardDescription>Choose the analysis area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedModule === module.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <module.icon className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">{module.label}</p>
                    <p className={`text-xs ${selectedModule === module.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {module.description}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Report Type Selection */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Report Type</CardTitle>
              <CardDescription>Select the analysis format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedReportType(type.id)}
                  className={`w-full flex flex-col items-start p-3 rounded-lg transition-all ${
                    selectedReportType === type.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <p className="font-medium">{type.label}</p>
                  <p className={`text-xs ${selectedReportType === type.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {type.description}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Generate Report</CardTitle>
              <CardDescription>
                Create AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Scope:</span>{' '}
                  {selectedScope === 'segment' && selectedSegmentMetrics
                    ? selectedSegmentMetrics.segmentName
                    : 'Full Portfolio'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Module:</span>{' '}
                  {modules.find((m) => m.id === selectedModule)?.label}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Type:</span>{' '}
                  {reportTypes.find((t) => t.id === selectedReportType)?.label}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Exposure:</span>{' '}
                  {currentMetrics.totalExposureFormatted}
                </p>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Reports use real calculated portfolio data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Output */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Report
                  {report && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                      report.isAIGenerated
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    }`}>
                      {report.isAIGenerated ? 'AI Generated' : 'Pre-canned Demo'}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {report ? (report.isAIGenerated ? 'AI-generated analysis based on portfolio data' : 'Pre-generated sample report (API not configured)') : 'Select options above and click Generate'}
                </CardDescription>
              </div>
              {report && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-4">
                    Analyzing data and generating report...
                  </p>
                </div>
              </div>
            ) : report ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="p-6 rounded-lg bg-muted/30 border">
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {report.content.split('\n').map((line: string, idx: number) => {
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-xl font-bold mt-6 mb-3 text-foreground">
                            {line.replace('## ', '')}
                          </h2>
                        )
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-lg font-semibold mt-4 mb-2 text-foreground">
                            {line.replace('### ', '')}
                          </h3>
                        )
                      }
                      if (line.startsWith('- **')) {
                        const [label, ...rest] = line.replace('- **', '').split('**:')
                        return (
                          <p key={idx} className="ml-4 my-1">
                            <span className="font-semibold">{label}:</span>
                            {rest.join('**:')}
                          </p>
                        )
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <p key={idx} className="ml-4 my-1">
                            • {line.replace('- ', '')}
                          </p>
                        )
                      }
                      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                        return (
                          <p key={idx} className="ml-4 my-1">
                            {line}
                          </p>
                        )
                      }
                      if (line.startsWith('|')) {
                        return (
                          <p key={idx} className="font-mono text-xs bg-muted p-2 rounded my-1">
                            {line}
                          </p>
                        )
                      }
                      if (line.trim() === '') {
                        return <br key={idx} />
                      }
                      return (
                        <p key={idx} className="my-2">
                          {line}
                        </p>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <p className="text-muted-foreground mt-4">
                    Select a scope, module, and report type, then click Generate
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prompt Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Available Report Templates</CardTitle>
            <CardDescription>
              Pre-configured prompts for common CECL reporting needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Quarterly Committee Report',
                  description: 'Full CECL committee presentation with all modules',
                  modules: ['geographic', 'macro', 'backtesting'],
                  scope: 'portfolio' as ReportScope,
                },
                {
                  title: 'Risk Concentration Alert',
                  description: 'Geographic and segment concentration analysis',
                  modules: ['geographic'],
                  scope: 'portfolio' as ReportScope,
                },
                {
                  title: 'Model Validation Summary',
                  description: 'Backtesting results and calibration recommendations',
                  modules: ['backtesting'],
                  scope: 'portfolio' as ReportScope,
                },
                {
                  title: 'Early Warning Report',
                  description: 'Pre-charge-off signals and intervention triggers',
                  modules: ['pre-chargeoff'],
                  scope: 'portfolio' as ReportScope,
                },
                {
                  title: 'Segment Deep Dive',
                  description: 'Detailed analysis for a single segment',
                  modules: ['geographic', 'macro'],
                  scope: 'segment' as ReportScope,
                },
                {
                  title: 'Economic Outlook Impact',
                  description: 'Macro trends and forward-looking scenarios',
                  modules: ['macro'],
                  scope: 'portfolio' as ReportScope,
                },
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedModule(template.modules[0] as Module)
                    setSelectedReportType('executive_summary')
                    if (template.scope === 'segment' && !selectedSegment) {
                      setSelectedScope('segment')
                      setSelectedSegment(SEGMENT_IDS[0])
                    } else {
                      setSelectedScope(template.scope)
                    }
                  }}
                >
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      template.scope === 'segment'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {template.scope}
                    </span>
                    {template.modules.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 text-xs rounded bg-muted"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
