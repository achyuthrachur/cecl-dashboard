'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateAIReport, type AIReportRequest } from '@/lib/ai'
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
} from 'lucide-react'

type Module = 'geographic' | 'macro' | 'backtesting' | 'pre-chargeoff'
type ReportType = 'executive_summary' | 'pattern_analysis' | 'recommendations'

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
  const [report, setReport] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateReport = async () => {
    setIsLoading(true)
    setReport('')

    try {
      // Create mock data for the report
      const mockData: Record<string, any> = {
        data: {
          portfolioSize: 5000,
          totalExposure: '$2.45B',
          avgPD: '4.2%',
          avgLGD: '38%',
          segments: ['CRE', 'C&I', 'Consumer', 'Auto', 'Residential'],
        },
      }

      // Add module-specific data
      if (selectedModule === 'backtesting') {
        mockData.mae = '$2.3M'
        mockData.rmse = '$3.1M'
        mockData.accuracy = '87'
      }

      const request: AIReportRequest = {
        module: selectedModule,
        reportType: selectedReportType,
        data: mockData,
      }

      const result = await generateAIReport(request)
      setReport(result)
    } catch (error) {
      setReport('Error generating report. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cecl-${selectedModule}-${selectedReportType}.md`
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm">
                  <span className="font-medium">Module:</span>{' '}
                  {modules.find((m) => m.id === selectedModule)?.label}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Type:</span>{' '}
                  {reportTypes.find((t) => t.id === selectedReportType)?.label}
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
                Reports are generated using synthetic data for demonstration purposes
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
                </CardTitle>
                <CardDescription>
                  {report ? 'AI-generated analysis based on portfolio data' : 'Select options above and click Generate'}
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
                    {report.split('\n').map((line, idx) => {
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
                    Select a module and report type, then click Generate
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
                },
                {
                  title: 'Risk Concentration Alert',
                  description: 'Geographic and segment concentration analysis',
                  modules: ['geographic'],
                },
                {
                  title: 'Model Validation Summary',
                  description: 'Backtesting results and calibration recommendations',
                  modules: ['backtesting'],
                },
                {
                  title: 'Early Warning Report',
                  description: 'Pre-charge-off signals and intervention triggers',
                  modules: ['pre-chargeoff'],
                },
                {
                  title: 'Economic Outlook Impact',
                  description: 'Macro trends and forward-looking scenarios',
                  modules: ['macro'],
                },
                {
                  title: 'Regulatory Submission',
                  description: 'CECL documentation for regulatory review',
                  modules: ['geographic', 'macro', 'backtesting', 'pre-chargeoff'],
                },
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedModule(template.modules[0] as Module)
                    setSelectedReportType('executive_summary')
                  }}
                >
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <div className="flex gap-1 mt-2">
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
