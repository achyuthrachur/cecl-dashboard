const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

export interface AIReportRequest {
  module: 'geographic' | 'macro' | 'backtesting' | 'pre-chargeoff'
  reportType: 'executive_summary' | 'pattern_analysis' | 'recommendations'
  data: Record<string, any>
}

const SYSTEM_PROMPTS = {
  cecl_analyst: `You are a CECL (Current Expected Credit Losses) analyst assistant for a bank's credit risk committee.
You provide clear, regulatory-compliant analysis of credit risk metrics including:
- Probability of Default (PD)
- Loss Given Default (LGD)
- Exposure at Default (EAD)

Your analysis should be:
- Data-driven with specific references to the metrics provided
- Compliant with CECL accounting standards (ASC 326)
- Actionable with clear recommendations
- Professional and suitable for board/committee presentation

Always structure your responses with clear sections and bullet points where appropriate.`,
}

const MODULE_PROMPTS = {
  geographic: {
    executive_summary: `Analyze the following geographic distribution of credit risk metrics across US states.

Data:
{{data}}

Generate a concise executive summary (2-3 paragraphs) covering:
1. Overall portfolio geographic distribution and concentration risks
2. States with elevated PD/LGD metrics requiring attention
3. Key recommendations for geographic risk management`,

    pattern_analysis: `Review the following state-level credit metrics and identify significant patterns.

Data:
{{data}}

Identify and explain:
1. Regional clusters of similar risk profiles
2. States with metrics significantly deviating from portfolio average
3. Any correlation between geographic factors and credit performance`,

    recommendations: `Based on the following geographic risk data, provide actionable recommendations.

Data:
{{data}}

Provide specific recommendations for:
1. Portfolio rebalancing to reduce geographic concentration
2. Enhanced monitoring for high-risk states
3. Underwriting adjustments for specific regions`,
  },

  macro: {
    executive_summary: `Analyze the correlation between credit risk metrics and macroeconomic indicators.

Credit Metrics by Segment:
{{creditData}}

Macroeconomic Indicators:
{{macroData}}

Generate an executive summary covering:
1. Key correlations identified between PD/LGD and macro indicators
2. Leading vs lagging relationships
3. Implications for forward-looking CECL estimation`,

    pattern_analysis: `Identify patterns in the relationship between credit performance and economic conditions.

Data:
{{data}}

Analyze:
1. Which segments are most sensitive to economic changes
2. Time lag between economic shifts and credit metric changes
3. Counter-cyclical vs pro-cyclical behavior by segment`,

    recommendations: `Provide recommendations for incorporating macroeconomic factors into CECL modeling.

Data:
{{data}}

Recommend:
1. Key macro variables to include in forecasting models
2. Appropriate forecast horizons by segment
3. Scenario analysis considerations`,
  },

  backtesting: {
    executive_summary: `Review the backtesting results comparing predicted losses to actual charge-offs.

Results:
{{data}}

MAE: {{mae}}
RMSE: {{rmse}}
Accuracy: {{accuracy}}%

Generate an executive summary covering:
1. Overall model performance assessment
2. Periods with significant prediction variance
3. Model calibration recommendations`,

    pattern_analysis: `Analyze patterns in prediction errors from the backtesting results.

Data:
{{data}}

Identify:
1. Systematic over/under prediction trends
2. Segments or periods with highest variance
3. Potential model blind spots`,

    recommendations: `Based on backtesting results, recommend model improvements.

Data:
{{data}}

Provide specific recommendations for:
1. Model recalibration approaches
2. Additional variables to consider
3. Segmentation refinements`,
  },

  'pre-chargeoff': {
    executive_summary: `Analyze the pre-charge-off behavior patterns for loans that subsequently defaulted.

Data:
{{data}}

Generate an executive summary covering:
1. Common risk metric trajectories before charge-off
2. Early warning signals identified
3. Recommended monitoring triggers`,

    pattern_analysis: `Identify patterns in PD/LGD trends for loans in the 36 months before charge-off.

Data:
{{data}}

Analyze:
1. Typical PD/LGD progression patterns by segment
2. How early warning signs manifest
3. Differences in behavior across loan types`,

    recommendations: `Based on pre-charge-off analysis, recommend early intervention strategies.

Data:
{{data}}

Recommend:
1. Early warning indicator thresholds
2. Intervention triggers and timing
3. Enhanced monitoring protocols`,
  },
}

export async function generateAIReport(request: AIReportRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return generateMockReport(request)
  }

  try {
    const promptTemplate = MODULE_PROMPTS[request.module][request.reportType]
    let prompt = promptTemplate

    // Replace template variables with actual data
    for (const [key, value] of Object.entries(request.data)) {
      const placeholder = `{{${key}}}`
      prompt = prompt.replace(placeholder, JSON.stringify(value, null, 2))
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.cecl_analyst },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const json = await response.json()
    return json.choices?.[0]?.message?.content ?? 'Unable to generate report.'
  } catch (error) {
    console.error('Error generating AI report:', error)
    return generateMockReport(request)
  }
}

function generateMockReport(request: AIReportRequest): string {
  const { module, reportType } = request

  const mockReports: Record<string, Record<string, string>> = {
    geographic: {
      executive_summary: `## Geographic Risk Analysis - Executive Summary

### Portfolio Overview
The loan portfolio demonstrates significant geographic concentration, with the largest exposures in California (12%), Texas (9%), and Florida (7%). These three states account for approximately 28% of total exposure, exceeding the recommended 25% concentration threshold.

### Risk Assessment
Several states exhibit elevated risk metrics requiring attention:
- **Nevada**: PD of 6.8% is 2.1x the portfolio average, driven by CRE concentration
- **Florida**: LGD of 48% reflects continued real estate market volatility
- **Michigan**: Construction segment PD trending upward over last 4 quarters

### Recommendations
1. Implement enhanced monitoring for states exceeding 5% concentration
2. Consider exposure limits for high-PD states (NV, AZ, FL)
3. Diversification target: Reduce top-3 state concentration to <25%`,

      pattern_analysis: `## Geographic Pattern Analysis

### Regional Clusters Identified
1. **Sun Belt Cluster (AZ, NV, FL, TX)**: Higher PD volatility, correlated with housing cycles
2. **Midwest Stable (OH, IN, MI)**: Lower but increasing PD, manufacturing exposure
3. **Coastal Premium (CA, NY, MA)**: Lower PD, higher LGD due to property values

### Key Deviations
- West Virginia PD 180% of portfolio average
- Wyoming EAD concentration 3x population weight
- DC LGD 35% below average (government-backed exposure)`,

      recommendations: `## Geographic Risk Recommendations

### Immediate Actions
1. Reduce Nevada CRE exposure by 15% over next 2 quarters
2. Implement state-level PD triggers at 1.5x portfolio average
3. Monthly monitoring for states with >$100M exposure

### Strategic Initiatives
1. Target Midwest expansion to diversify coastal concentration
2. Develop state-specific LGD models for top 10 states
3. Incorporate state economic forecasts into CECL scenarios`,
    },

    macro: {
      executive_summary: `## Macroeconomic Correlation Analysis

### Key Findings
Analysis of 5-year historical data reveals significant correlations between credit metrics and macroeconomic indicators:

- **Unemployment Rate**: Strong positive correlation with PD (r=0.72), 2-quarter lag
- **Fed Funds Rate**: Moderate positive correlation with LGD (r=0.45)
- **GDP Growth**: Inverse relationship with portfolio PD (r=-0.58)

### CECL Implications
The identified relationships suggest incorporating unemployment forecasts with a 6-month lead time will improve loss estimation accuracy. Current quarter-end unemployment of 4.2% suggests stable near-term PD outlook.

### Recommendations
Implement scenario analysis using Fed economic projections for Q-factor adjustments.`,

      pattern_analysis: `## Macroeconomic Pattern Analysis

### Segment Sensitivity
| Segment | Unemployment Sensitivity | Rate Sensitivity |
|---------|-------------------------|------------------|
| Consumer | High (0.82) | Medium (0.45) |
| CRE NOO | Medium (0.56) | High (0.71) |
| Auto | High (0.78) | Low (0.23) |
| C&I | Medium (0.51) | Medium (0.48) |

### Lag Analysis
- Consumer PD responds to unemployment within 1 quarter
- CRE LGD lags property values by 3-4 quarters
- Construction segment shows 6-month lead to rate changes`,

      recommendations: `## Macro-Based Model Recommendations

### Model Enhancements
1. Add unemployment forecast as primary driver for Consumer/Auto segments
2. Incorporate 10-year Treasury spread for CRE segments
3. Use GDP nowcasts for C&I forward-looking adjustments

### Scenario Framework
- Baseline: Current consensus forecasts
- Adverse: Unemployment +2%, GDP -1%
- Severely Adverse: Unemployment +4%, GDP -3%`,
    },

    backtesting: {
      executive_summary: `## Backtesting Results - Executive Summary

### Model Performance
Overall prediction accuracy of 87% with MAE of $2.3M and RMSE of $3.1M indicates reasonable model calibration. However, the model consistently under-predicts losses in economic stress periods.

### Key Observations
- Q3 2023: Actual losses exceeded predictions by 34%
- Construction segment: Systematic under-prediction of 22%
- Consumer segment: Over-prediction of 15% in low-stress periods

### Calibration Recommendations
1. Increase PD floor for Construction segment by 50bps
2. Add stress multiplier for economic downturn scenarios
3. Reduce Consumer segment reserves by 10% in baseline`,

      pattern_analysis: `## Backtesting Pattern Analysis

### Systematic Errors
- Under-prediction during rising rate environments
- Over-prediction for loans >3 years from origination
- Regional bias: Southern states under-predicted by 8%

### Model Blind Spots
1. Concentration risk not fully captured
2. Cross-segment correlations ignored
3. Vintage effects diminish after year 2`,

      recommendations: `## Backtesting-Based Improvements

### Short-term (Next Quarter)
1. Apply 1.15x multiplier to Construction predictions
2. Implement vintage-based adjustments
3. Add regional calibration factors

### Medium-term (6-12 months)
1. Rebuild Consumer segment model with updated coefficients
2. Incorporate concentration risk overlay
3. Develop segment correlation matrix`,
    },

    'pre-chargeoff': {
      executive_summary: `## Pre-Charge-Off Behavior Analysis

### Pattern Summary
Analysis of 200 charged-off loans reveals consistent warning patterns in the 36 months prior to charge-off:

- **PD Trajectory**: Average PD increases from 3.2% to 18.4% over final 24 months
- **LGD Pattern**: Stable until month -6, then increases sharply
- **Delinquency**: 78% show 30+ DPD by month -12

### Early Warning Signals
1. PD increase >50% from baseline triggers at month -18 average
2. Payment pattern deterioration visible at month -15
3. Collateral value decline (where applicable) at month -9

### Intervention Recommendations
Implement enhanced monitoring when PD exceeds 2x baseline for 2 consecutive quarters.`,

      pattern_analysis: `## Pre-Charge-Off Pattern Details

### Segment Variations
| Segment | First Signal (months) | PD at Signal | False Positive Rate |
|---------|----------------------|--------------|---------------------|
| CRE | -24 | 4.5% | 12% |
| Consumer | -12 | 8.2% | 25% |
| C&I | -18 | 5.1% | 18% |
| Auto | -9 | 6.8% | 30% |

### Behavioral Indicators
- CRE: Vacancy rate increase precedes PD by 6 months
- Consumer: Payment frequency changes at month -15
- C&I: Revenue decline visible at month -24`,

      recommendations: `## Early Intervention Recommendations

### Trigger Framework
1. **Yellow Flag**: PD > 1.5x baseline → Enhanced monitoring
2. **Orange Flag**: PD > 2.0x baseline → Weekly review
3. **Red Flag**: PD > 3.0x baseline → Workout initiation

### Monitoring Enhancements
1. Monthly PD monitoring for watch list loans
2. Automated alerts for threshold breaches
3. Segment-specific trigger calibration

### Intervention Timing
- CRE: Initiate at -18 months for best recovery
- Consumer: Act at -9 months (faster deterioration)
- C&I: Engagement at -15 months recommended`,
    },
  }

  return mockReports[module]?.[reportType] ?? 'Report generation requires API configuration.'
}
