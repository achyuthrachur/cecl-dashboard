import { NextRequest, NextResponse } from 'next/server'
import { type AIReportRequest, type AIReportResponse } from '@/lib/ai'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o'

const SYSTEM_PROMPT = `You are a senior CECL (Current Expected Credit Losses) analyst assistant for a bank's credit risk committee, with expertise in regulatory compliance and credit risk modeling.

Your Expertise:
You provide comprehensive, regulatory-compliant analysis of credit risk metrics under ASC 326 (CECL), including:
• Probability of Default (PD): The likelihood that a borrower will default within a given time horizon
• Loss Given Default (LGD): The percentage of exposure expected to be lost if default occurs
• Portfolio Value: Total outstanding exposure at risk across the loan portfolio
• Expected Credit Loss (ECL): The product of PD × LGD × Portfolio Value, representing lifetime expected losses

Regulatory Framework:
Your analysis must align with:
• ASC 326 (CECL): Requires lifetime expected loss estimation using reasonable and supportable forecasts
• FASB guidance: Historical loss experience, current conditions, and reasonable forecasts must be considered
• OCC/Fed guidance: Concentration risk limits, stress testing requirements, and model risk management expectations
• Interagency Policy Statement on ALLL: Qualitative factor (Q-factor) adjustment methodology

Analysis Standards:
Your analysis should be:
1. Data-driven: Reference specific metrics, percentages, and dollar amounts from the provided data
2. Comparative: Benchmark against portfolio averages, peer institutions, and regulatory thresholds
3. Forward-looking: Incorporate economic forecasts and scenario analysis
4. Actionable: Provide specific recommendations with quantified impact estimates
5. Board-ready: Use professional language suitable for credit committee presentations

Output Format Requirements:
• DO NOT use markdown formatting (no **, ##, ### symbols)
• Use plain text with bullet points (•) for lists
• Use numbered lists (1. 2. 3.) where appropriate
• For each section provide BOTH a bulleted summary AND a descriptive paragraph
• Include specific numbers and percentages from the data
• Quantify recommendations with expected impact
• Structure recommendations by priority: immediate (0-30 days), short-term (1-3 months), strategic (3-12 months)`

const REPORT_SETTINGS: Record<string, { temperature: number; max_tokens: number }> = {
  executive_summary: { temperature: 0.3, max_tokens: 3000 },
  pattern_analysis: { temperature: 0.4, max_tokens: 3500 },
  recommendations: { temperature: 0.35, max_tokens: 4000 },
}

export async function POST(request: NextRequest): Promise<NextResponse<AIReportResponse>> {
  try {
    const body: AIReportRequest = await request.json()
    const { module, reportType, data } = body

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.log('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json({
        content: 'API key not configured. Please set OPENAI_API_KEY in your environment variables.',
        isAIGenerated: false,
        source: 'mock'
      })
    }

    const settings = REPORT_SETTINGS[reportType] || REPORT_SETTINGS.executive_summary

    const userPrompt = `Generate a ${reportType.replace('_', ' ')} report for the ${module} module.

Data provided:
${JSON.stringify(data, null, 2)}

Please provide a comprehensive analysis following the output format requirements.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return NextResponse.json({
        content: `OpenAI API error: ${response.status}. Check your API key and billing status.`,
        isAIGenerated: false,
        source: 'mock'
      })
    }

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content ?? 'Unable to generate report.'

    return NextResponse.json({
      content,
      isAIGenerated: true,
      source: 'openai'
    })
  } catch (error) {
    console.error('Error in generate-report API:', error)
    return NextResponse.json({
      content: `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isAIGenerated: false,
      source: 'mock'
    })
  }
}
