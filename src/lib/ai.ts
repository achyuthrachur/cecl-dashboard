const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o'

export interface AIReportRequest {
  module: 'geographic' | 'macro' | 'backtesting' | 'pre-chargeoff'
  reportType: 'executive_summary' | 'pattern_analysis' | 'recommendations'
  data: Record<string, any>
}

export interface AIReportResponse {
  content: string
  isAIGenerated: boolean
  source: 'openai' | 'mock'
}

const SYSTEM_PROMPTS = {
  cecl_analyst: `You are a senior CECL (Current Expected Credit Losses) analyst assistant for a bank's credit risk committee, with expertise in regulatory compliance and credit risk modeling.

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
3. Forward-looking: Consider economic forecasts and their impact on credit metrics
4. Actionable: Provide specific, implementable recommendations with clear thresholds
5. Board-ready: Professional tone suitable for ALCO, Credit Committee, and Board presentations

CRITICAL OUTPUT FORMAT REQUIREMENTS:
• DO NOT use any markdown formatting characters such as **, ##, ###, or similar
• DO NOT use asterisks for bold text - just write plain text
• Use bullet points with the • character for lists
• Use numbered lists (1. 2. 3.) where appropriate
• Write section headers as plain text followed by a colon or on their own line
• For each major section, provide BOTH:
  - A bulleted summary of key points
  - A descriptive paragraph explaining the findings in narrative form
• Include specific numbers and percentages (e.g., "PD of 4.2% exceeds the portfolio average of 2.8% by 50%")
• Quantify recommendations where possible (e.g., "reduce concentration to below 10%" vs "reduce concentration")
• Structure recommendations by priority (immediate, short-term, strategic)
• Use plain text tables with clear column alignment when presenting data`,
}

// Report type specific settings
const REPORT_SETTINGS = {
  executive_summary: { temperature: 0.3, max_tokens: 3000 },
  pattern_analysis: { temperature: 0.4, max_tokens: 3500 },
  recommendations: { temperature: 0.35, max_tokens: 4000 },
}

const MODULE_PROMPTS = {
  geographic: {
    executive_summary: `Geographic Risk Analysis Request

You are analyzing the geographic distribution of credit risk metrics across US states for a bank's loan portfolio.

Data Provided:
State-level aggregated metrics:
{{data}}

Required Analysis:

Generate a comprehensive executive summary (4-5 paragraphs) that addresses the following areas. For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Portfolio Concentration Overview
   • Total exposure by region (Northeast, Southeast, Midwest, West, Southwest)
   • Top 5 states by exposure and their contribution to total portfolio
   • Herfindahl-Hirschman Index (HHI) assessment if calculable
   • Comparison to regulatory concentration thresholds (typically 25% for top 3 states)

2. Risk Metric Assessment
   • States with PD > 1.5x portfolio average (flag as "elevated")
   • States with LGD > 1.25x portfolio average (flag as "heightened severity")
   • States with unusual PD-LGD combinations (high PD + high LGD = critical)
   • Portfolio Value concentrations in high-risk states

3. Regional Risk Themes
   • Economic factors driving elevated metrics (housing, employment, industry concentration)
   • Correlation of risk levels with regional economic conditions
   • Emerging trends or deterioration patterns

4. Key Findings Summary
   • Top 3 geographic risk concerns requiring immediate attention
   • Portfolio strengths (well-diversified regions, low-risk concentrations)
   • Overall geographic risk rating (Low/Moderate/Elevated/High)

5. Board-Level Takeaways
   • Material findings requiring committee discussion
   • Potential impact on ALLL/ACL adequacy
   • Recommended monitoring frequency`,

    pattern_analysis: `Geographic Pattern Analysis Request

Analyze state-level credit metrics to identify statistically significant patterns and anomalies.

Data Provided:
{{data}}

Required Analysis:

Provide detailed pattern analysis covering the following areas. For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Regional Clustering
   • Group states by similar risk profiles (use PD/LGD combinations)
   • Identify regional clusters: Sun Belt, Rust Belt, Coastal, Agricultural, Energy
   • Map economic dependencies to risk clusters

2. Statistical Outliers
   • States with metrics >2 standard deviations from mean
   • Z-score analysis for PD, LGD, and Portfolio Value
   • Historical volatility patterns by state

3. Correlation Analysis
   • PD-LGD correlation by state (are they moving together?)
   • Geographic spillover effects (do neighboring states show similar trends?)
   • Portfolio concentration vs risk metric relationships

4. Trend Decomposition
   • Secular trends (long-term structural changes)
   • Cyclical patterns (economic cycle sensitivity)
   • Seasonal factors (if applicable)

5. Early Warning Indicators
   • States showing deteriorating trajectories
   • Leading indicator states (typically first to show stress)
   • Lagging indicator states (delayed response to economic changes)`,

    recommendations: `Geographic Risk Recommendations Request

Based on the geographic risk data, provide actionable recommendations for risk management.

Data Provided:
{{data}}

Required Recommendations:

Provide structured recommendations organized by priority. For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Immediate Actions (0-30 days)
   • Specific exposure limits for high-risk states (provide exact thresholds)
   • Enhanced monitoring requirements (frequency, metrics, triggers)
   • Underwriting restrictions for specific state/segment combinations

2. Short-Term Initiatives (1-3 months)
   • Portfolio rebalancing targets with specific percentages
   • State-specific LGD model adjustments
   • Q-factor recommendations for geographic risk

3. Strategic Recommendations (3-12 months)
   • Geographic diversification strategy with target allocations
   • Market entry/exit recommendations by state
   • Technology investments for geographic risk monitoring

4. Policy Updates Required
   • Credit policy amendments for concentration limits
   • Pricing adjustments for high-risk geographies
   • Exception approval requirements

5. Monitoring Framework
   • Key performance indicators by state
   • Escalation triggers and thresholds
   • Reporting frequency recommendations`,
  },

  macro: {
    executive_summary: `Macroeconomic Correlation Analysis Request

Analyze the relationship between credit risk metrics and macroeconomic indicators.

Credit Metrics by Segment:
{{creditData}}

Macroeconomic Indicators:
{{macroData}}

Required Analysis:

Generate a comprehensive executive summary covering the following areas. For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Correlation Summary
   • Pearson correlations between each macro indicator and PD/LGD by segment
   • Rank indicators by predictive power for credit deterioration
   • Statistical significance assessment

2. Leading vs Lagging Indicators
   • Identify which macro variables lead credit metrics (predictive)
   • Time lag estimation (1-quarter, 2-quarter, etc.)
   • Optimal forecast horizon by indicator

3. Segment Sensitivity Analysis
   • Rank segments by macro sensitivity (most to least)
   • Beta coefficients for key relationships
   • Defensive vs cyclical segment classification

4. Current Economic Outlook Impact
   • Apply current economic forecasts to estimate near-term credit impact
   • Scenario implications (baseline, adverse, severely adverse)
   • Reserve adequacy implications

5. CECL Model Implications
   • Recommended Q-factor adjustments based on macro outlook
   • Forecast horizon recommendations by segment
   • Model enhancement opportunities`,

    pattern_analysis: `Macroeconomic Pattern Analysis Request

Identify patterns in the relationship between credit performance and economic conditions.

Data Provided:
{{data}}

Required Analysis:

For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Economic Cycle Mapping
   • Position current period in economic cycle
   • Historical PD/LGD behavior at similar cycle points
   • Recession probability implications

2. Segment-Specific Patterns
   • Which segments lead economic turns?
   • Counter-cyclical vs pro-cyclical behavior
   • Stress transmission paths across segments

3. Regime Analysis
   • Normal vs stress regime characteristics
   • Regime switching indicators
   • Historical regime durations

4. Cross-Correlation Analysis
   • Macro-to-credit transmission timing
   • Credit-to-credit contagion patterns
   • Feedback loops identified`,

    recommendations: `Macro-Based Model Recommendations Request

Provide recommendations for incorporating macroeconomic factors into CECL modeling.

Data Provided:
{{data}}

Required Recommendations:

For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Model Variable Selection
   • Primary macro drivers by segment (ranked)
   • Variable transformation recommendations (levels, changes, lags)
   • Interaction terms to consider

2. Forecast Integration
   • Recommended forecast sources (Fed, Blue Chip, internal)
   • Forecast horizon by segment
   • Probability weighting for scenarios

3. Scenario Framework
   • Baseline scenario specification
   • Adverse scenario parameters
   • Severely adverse scenario parameters
   • Probability weights for each

4. Q-Factor Guidance
   • Quantitative Q-factor methodology
   • Current recommended Q-factor adjustments
   • Documentation requirements`,
  },

  backtesting: {
    executive_summary: `Backtesting Results Executive Summary

Review model performance comparing predicted losses to actual charge-offs.

Results Data:
{{data}}

Performance Metrics:
• Mean Absolute Error (MAE): {{mae}}
• Root Mean Square Error (RMSE): {{rmse}}
• Overall Accuracy: {{accuracy}}%

Required Analysis:

Generate executive summary covering the following areas. For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Model Performance Assessment
   • Overall accuracy rating (Excellent >90%, Good 80-90%, Adequate 70-80%, Needs Improvement <70%)
   • Error distribution analysis (normal vs skewed)
   • Confidence interval around predictions

2. Systematic Bias Identification
   • Over-prediction vs under-prediction tendency
   • Bias by segment, time period, or economic condition
   • Magnitude of systematic error

3. Stress Period Performance
   • Model behavior during economic stress
   • Prediction accuracy during volatility
   • Capital adequacy implications

4. Model Risk Assessment
   • Model limitations identified
   • Data quality concerns
   • Assumption validation status

5. Governance Implications
   • Model validation findings
   • Required remediation actions
   • Documentation updates needed`,

    pattern_analysis: `Backtesting Pattern Analysis Request

Analyze patterns in prediction errors from backtesting results.

Data Provided:
{{data}}

Required Analysis:

For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Error Decomposition
   • Bias component (systematic error)
   • Variance component (random error)
   • Noise vs signal separation

2. Conditional Error Analysis
   • Errors by economic regime
   • Errors by portfolio segment
   • Errors by vintage year

3. Temporal Patterns
   • Seasonality in prediction errors
   • Error trending over time
   • Forecast horizon decay

4. Outlier Analysis
   • Periods with extreme errors (>2 std dev)
   • Common characteristics of outlier periods
   • Root cause hypotheses`,

    recommendations: `Backtesting-Based Improvement Recommendations

Based on backtesting results, recommend model improvements.

Data Provided:
{{data}}

Required Recommendations:

For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Model Recalibration
   • Specific parameter adjustments with values
   • Segment-level multipliers if needed
   • Implementation timeline

2. Model Enhancement
   • Additional variables to incorporate
   • Alternative modeling approaches to test
   • Data enrichment opportunities

3. Process Improvements
   • Backtesting frequency recommendations
   • Expanded testing scenarios
   • Documentation enhancements

4. Governance Actions
   • Model risk rating update
   • Validation schedule
   • Escalation requirements`,
  },

  'pre-chargeoff': {
    executive_summary: `Pre-Charge-Off Behavior Analysis

Analyze behavior patterns for loans that subsequently defaulted.

Data Provided:
{{data}}

Required Analysis:

Generate executive summary covering the following areas. For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Trajectory Analysis
   • Average PD path: Starting level to Charge-off level
   • Acceleration points (when does deterioration accelerate?)
   • Typical timeline from first signal to charge-off

2. Early Warning Signal Identification
   • Leading indicators (visible 18+ months before charge-off)
   • Confirming indicators (visible 6-18 months before)
   • Late indicators (visible <6 months before)

3. Segment-Specific Patterns
   • Fastest deterioration segments
   • Longest warning window segments
   • False positive rates by segment

4. Intervention Opportunity Windows
   • Optimal intervention timing by segment
   • Expected recovery improvement from early action
   • Resource allocation recommendations

5. Model Implications
   • Watch list criteria recommendations
   • PD threshold triggers for escalation
   • Lifetime loss trajectory modeling inputs`,

    pattern_analysis: `Pre-Charge-Off Pattern Details

Identify detailed patterns in PD/LGD trends before charge-off.

Data Provided:
{{data}}

Required Analysis:

For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. PD Trajectory Patterns
   • Gradual deterioration pattern
   • Sudden deterioration pattern
   • Step-function pattern
   • Percentage of loans following each pattern

2. LGD Behavior
   • LGD stability before deterioration
   • LGD acceleration timing
   • Collateral value correlation

3. Payment Behavior Indicators
   • Delinquency progression patterns
   • Partial payment patterns
   • Payment timing changes

4. Segment Differentiation
   • Unique patterns by segment
   • Cross-segment commonalities
   • Predictive feature importance`,

    recommendations: `Early Intervention Strategy Recommendations

Based on pre-charge-off analysis, recommend intervention strategies.

Data Provided:
{{data}}

Required Recommendations:

For each section, provide BOTH a bulleted summary AND a descriptive paragraph.

1. Trigger Framework
   • Yellow flag criteria (enhanced monitoring)
   • Orange flag criteria (active intervention)
   • Red flag criteria (workout/charge-off preparation)
   • Specific thresholds for each flag level

2. Intervention Playbook
   • Contact strategy by flag level
   • Modification options to offer
   • Collection escalation timeline

3. Monitoring System Requirements
   • Real-time monitoring capabilities needed
   • Alert automation specifications
   • Dashboard requirements

4. Performance Metrics
   • Expected intervention success rate
   • Cost-benefit analysis framework
   • ROI measurement methodology`,
  },
}

export async function generateAIReport(request: AIReportRequest): Promise<AIReportResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      content: generateMockReport(request),
      isAIGenerated: false,
      source: 'mock'
    }
  }

  try {
    const promptTemplate = MODULE_PROMPTS[request.module][request.reportType]
    let prompt = promptTemplate

    // Replace template variables with actual data
    for (const [key, value] of Object.entries(request.data)) {
      const placeholder = `{{${key}}}`
      prompt = prompt.replace(placeholder, JSON.stringify(value, null, 2))
    }

    const settings = REPORT_SETTINGS[request.reportType]

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
          { role: 'system', content: SYSTEM_PROMPTS.cecl_analyst },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content ?? 'Unable to generate report.'
    return {
      content,
      isAIGenerated: true,
      source: 'openai'
    }
  } catch (error) {
    console.error('Error generating AI report:', error)
    return {
      content: generateMockReport(request),
      isAIGenerated: false,
      source: 'mock'
    }
  }
}

function generateMockReport(request: AIReportRequest): string {
  const { module, reportType } = request

  const mockReports: Record<string, Record<string, string>> = {
    geographic: {
      executive_summary: `Geographic Risk Analysis - Executive Summary

PORTFOLIO CONCENTRATION OVERVIEW

Key Points:
• Total portfolio exposure of $4.2B across 48 states
• Top 3 state concentration at 28.4% exceeds the 25% threshold by 340 basis points
• Herfindahl-Hirschman Index (HHI) of 892 indicates moderate concentration risk

Regional Breakdown:
• West Coast (CA, WA, OR): $892M (21.2%) - Elevated concentration
• Southeast (FL, GA, NC, SC): $714M (17.0%)
• Texas and Southwest: $546M (13.0%)
• Northeast Corridor: $462M (11.0%)
• Midwest: $378M (9.0%)
• Other states: $1.21B (28.8%)

The loan portfolio demonstrates significant geographic concentration with total exposure of $4.2B across 48 states. The Top 3 State Concentration stands at 28.4% (CA: 12.1%, TX: 9.2%, FL: 7.1%), exceeding the recommended threshold of 25% by 340 basis points. The portfolio Herfindahl-Hirschman Index (HHI) of 892 indicates moderate concentration risk, suggesting that while diversification exists, certain regional exposures warrant heightened monitoring.

RISK METRIC ASSESSMENT

Key Points:
• Nevada exhibits critical risk with PD of 6.8% (+142% vs average) and LGD of 52% (+18% vs average)
• Florida and Arizona show elevated risk levels requiring enhanced monitoring
• Michigan and Louisiana are on watch status with moderately elevated metrics

State Risk Summary:
| State      | PD    | vs Avg  | LGD  | vs Avg | Risk Level |
|------------|-------|---------|------|--------|------------|
| Nevada     | 6.8%  | +142%   | 52%  | +18%   | Critical   |
| Florida    | 4.2%  | +49%    | 48%  | +9%    | Elevated   |
| Arizona    | 4.8%  | +71%    | 45%  | +2%    | Elevated   |
| Michigan   | 3.9%  | +39%    | 44%  | 0%     | Watch      |
| Louisiana  | 3.6%  | +29%    | 51%  | +16%   | Watch      |

Portfolio Average: PD 2.81%, LGD 44.0%

Several states exhibit elevated risk metrics requiring heightened attention. Nevada's combination of high PD (6.8%) and high LGD (52%) results in an expected loss rate of 3.54%, which is 2.8x the portfolio average of 1.24%. This combination of elevated default probability and loss severity creates a compounding risk effect that requires immediate attention and remediation.

REGIONAL RISK THEMES

Key Points:
• Sun Belt states experiencing housing market volatility driving CRE stress
• Energy states show oil price sensitivity affecting C&I segment
• Rust Belt demonstrates manufacturing sector exposure with gradual deterioration

Several economic factors are driving elevated metrics in specific regions. Sun Belt States (AZ, NV, FL) face housing market volatility driving CRE segment stress, with population growth creating underwriting strain and a PD trend of +0.4% over the trailing 4 quarters. Energy States (TX, LA, OK, WY) show oil price sensitivity affecting the C&I segment, with LGD volatility tied to collateral valuation and counter-cyclical behavior observed versus the broader portfolio. The Rust Belt (MI, OH, IN) has manufacturing sector exposure with gradual PD deterioration (+0.2% QoQ trend), though LGD remains stable but elevated for older vintages.

KEY FINDINGS SUMMARY

Top 3 Geographic Risk Concerns:
• Nevada CRE Concentration: $180M exposure with 6.8% PD requires immediate limit reduction
• Florida Portfolio Growth: 23% YoY growth outpacing risk infrastructure
• Texas Energy Sector: $340M C&I exposure sensitive to oil price movements

Portfolio Strengths:
• Northeast corridor demonstrates stable, below-average risk metrics
• Midwest residential segment well-diversified across 12 states
• California despite high concentration shows disciplined underwriting (PD 2.4%)

Overall Geographic Risk Rating: MODERATE-ELEVATED

BOARD-LEVEL TAKEAWAYS

Material Findings for Discussion:
• Top-3 state concentration exceeds policy limit
• Nevada exposure warrants immediate action (recommend 20% reduction)
• Geographic concentration contributing estimated $4.2M to required reserves

ALLL/ACL Impact:
• Geographic Q-factor of 1.15x currently applied
• Recommend increase to 1.25x given concentration findings
• Estimated reserve impact: +$3.8M

Recommended Actions:
1. Reduce Nevada CRE exposure by $36M (20%) within 90 days
2. Implement state-level concentration limits at 10% of portfolio
3. Increase monitoring frequency to monthly for Watch-list states
4. Commission independent validation of state-level LGD models`,

      pattern_analysis: `Geographic Pattern Analysis

REGIONAL CLUSTERING ANALYSIS

Key Points:
• States cluster into five distinct risk groups based on PD/LGD profiles
• Sun Belt cluster shows highest risk with PD 4.0-6.8% and LGD 45-52%
• Low Risk Core states (CO, MN, VA, MD, WA) demonstrate best metrics

Based on PD/LGD profile analysis, states cluster into five distinct risk groups that reflect underlying economic drivers and risk characteristics. These clusters help identify portfolio concentrations that may not be apparent from state-level analysis alone.

Cluster 1 - High Growth / Elevated Risk (Sun Belt):
• States: AZ, NV, FL, TX (partial)
• Characteristics: PD 4.0-6.8%, LGD 45-52%
• Economic Driver: Housing market cycles, population migration
• Portfolio Weight: 22.3%

Cluster 2 - Stable Core (Coastal Premium):
• States: CA, NY, MA, CT, NJ
• Characteristics: PD 2.2-2.8%, LGD 48-55%
• Economic Driver: Diversified economies, high property values
• Portfolio Weight: 26.8%
• Note: Higher LGD offset by lower PD; net loss rate below average

Cluster 3 - Industrial Transition (Rust Belt):
• States: MI, OH, IN, PA, WI
• Characteristics: PD 3.2-3.9%, LGD 42-46%
• Economic Driver: Manufacturing sector health
• Portfolio Weight: 14.2%
• Trend: Gradual deterioration (+0.15% PD per quarter)

Cluster 4 - Agricultural/Energy:
• States: TX (C&I), ND, SD, OK, LA, WY
• Characteristics: PD 2.8-3.6%, LGD 40-51%
• Economic Driver: Commodity prices, energy sector
• Portfolio Weight: 11.4%
• Volatility: Highest standard deviation in LGD

Cluster 5 - Low Risk Core:
• States: CO, MN, VA, MD, WA
• Characteristics: PD 1.8-2.4%, LGD 38-42%
• Economic Driver: Technology, government, diversified
• Portfolio Weight: 18.1%

STATISTICAL OUTLIERS

Key Points:
• Nevada shows critical outlier status with Z-score of +3.2 for PD
• West Virginia and Arizona also flagged as elevated outliers
• DC shows favorable LGD outlier with Z-score of -2.8

Z-Score Analysis (absolute value > 2.0 flagged):
| State | Metric | Value | Z-Score | Direction  |
|-------|--------|-------|---------|------------|
| NV    | PD     | 6.8%  | +3.2    | Critical   |
| WV    | PD     | 5.9%  | +2.5    | Elevated   |
| AZ    | PD     | 4.8%  | +2.1    | Elevated   |
| DC    | LGD    | 31%   | -2.8    | Favorable  |
| LA    | LGD    | 51%   | +2.1    | Elevated   |

The statistical analysis reveals that Nevada represents the most significant outlier with a Z-score of +3.2, indicating its PD is more than three standard deviations above the mean. This extreme deviation warrants immediate attention and suggests underlying structural issues in that market.

Correlation Findings:
• PD-LGD correlation by state: r = 0.34 (moderate positive)
• States with decorrelated PD/LGD (potential model risk):
  - California: Low PD (2.4%) but High LGD (54%) - property value exposure
  - Louisiana: Moderate PD (3.6%) but High LGD (51%) - energy collateral

GEOGRAPHIC SPILLOVER ANALYSIS

Key Points:
• Adjacent states show significant correlation, particularly MI-OH-IN at r = 0.81
• Concentration in one state underestimates true regional exposure
• Energy corridor (TX-LA) shows high spillover at r = 0.72

Adjacent State Correlation Matrix:
• FL-GA: r = 0.78 (high spillover)
• CA-AZ: r = 0.65 (moderate spillover)
• TX-LA: r = 0.72 (high spillover, energy)
• MI-OH-IN: r = 0.81 (high industrial correlation)

Geographic spillover analysis reveals that concentration risk extends beyond individual state boundaries. The high correlation among adjacent states means that a shock to one state's economy will likely transmit to neighboring states, amplifying the effective concentration risk beyond what single-state metrics indicate.

EARLY WARNING STATES

Key Points:
• Nevada serves as 2-quarter leading indicator for Sun Belt deterioration
• Michigan leads industrial stress indicators by 1 quarter
• Texas C&I provides 3-quarter lead on energy cycle changes

Leading Indicator States (first to show stress):
1. Nevada - 2-quarter lead on Sun Belt deterioration
2. Michigan - 1-quarter lead on industrial stress
3. Texas C&I - 3-quarter lead on energy cycle

Current Leading Indicator Status:
• Nevada: Deteriorating (-0.6% PD QoQ) - Critical
• Michigan: Stable but elevated - Watch
• Texas C&I: Improving (+0.2% PD improvement) - Favorable`,

      recommendations: `Geographic Risk Recommendations

IMMEDIATE ACTIONS (0-30 Days)

Key Points:
• Nevada exposure requires 20% reduction ($36M) with CRE-NOO origination halt
• Enhanced monitoring frequency needed for high-risk states
• Underwriting restrictions to be implemented for Nevada, Florida, and Arizona

1. Nevada Exposure Reduction

The Nevada portfolio requires immediate attention given its critical risk status. Current exposure stands at $180M total with $124M in CRE. The target is to reduce to $144M total (-20%) and $87M CRE (-30%) through a combination of origination cessation, accelerated payoffs via refinance incentives, and evaluation of participation sales for exposures of $25M or more. The Chief Credit Officer owns this initiative with a 30-day deadline.

• Current: $180M total, $124M CRE
• Target: $144M total (-20%), $87M CRE (-30%)
• Method: Cease new CRE-NOO originations, accelerate payoffs, evaluate participation sales
• Owner: Chief Credit Officer
• Deadline: 30 days

2. Enhanced Monitoring Implementation

| State | Current Frequency | Required Frequency | Trigger              |
|-------|-------------------|--------------------|-----------------------|
| NV    | Quarterly         | Weekly             | PD > 5%              |
| FL    | Quarterly         | Bi-weekly          | Exposure > $300M     |
| AZ    | Quarterly         | Monthly            | PD trending > +0.3%/qtr |
| MI    | Quarterly         | Monthly            | Manufacturing PMI < 48 |

3. Underwriting Restrictions
• Nevada: No new CRE-NOO originations until exposure < $100M
• Florida: Maximum single borrower $10M (down from $15M)
• Arizona: Require 70% LTV maximum (down from 75%)

SHORT-TERM INITIATIVES (1-3 Months)

Key Points:
• Portfolio rebalancing targets reduction in West Coast and Southeast concentrations
• State-specific model enhancements needed for California, Louisiana, and Michigan
• Q-factor adjustments will increase reserves by $3.8M to $5.2M

1. Portfolio Rebalancing Strategy

The portfolio requires strategic rebalancing to reduce concentration in higher-risk regions while building exposure in more stable markets. This rebalancing should occur organically through targeted origination strategies and selective non-renewal of maturing credits in elevated-risk states.

| Region     | Current | Target | Change |
|------------|---------|--------|--------|
| West Coast | 21.2%   | 18.0%  | -3.2%  |
| Southeast  | 17.0%   | 16.0%  | -1.0%  |
| Midwest    | 9.0%    | 12.0%  | +3.0%  |
| Northeast  | 11.0%   | 12.0%  | +1.0%  |
| Other      | 28.8%   | 32.0%  | +3.2%  |

2. State-Specific Model Enhancements
• Develop California-specific LGD model (high property values)
• Build Louisiana energy sector overlay model
• Implement Michigan manufacturing PMI linkage

3. Q-Factor Adjustments

| Factor                   | Current | Recommended | Rationale        |
|--------------------------|---------|-------------|------------------|
| Geographic Concentration | 1.15x   | 1.25x       | Top-3 > 25%      |
| Regional Economic        | 1.05x   | 1.10x       | Sun Belt stress  |
| Overall Geographic       | 1.21x   | 1.38x       | Combined         |

Reserve Impact: +$3.8M to +$5.2M range

STRATEGIC RECOMMENDATIONS (3-12 Months)

Key Points:
• Target expansion in Colorado, Minnesota, and Virginia with $150M allocation
• Evaluate exit from West Virginia given sustained elevated PD
• Technology investment of $250K-$400K for enhanced monitoring

1. Geographic Diversification Strategy

Target states for expansion have been identified based on favorable risk metrics and economic stability. Colorado shows low PD at 2.1% with a growing economy. Minnesota demonstrates stable metrics with a diversified economic base. Virginia offers government and technology sector stability. An expansion budget allocation of $150M in new originations is recommended.

2. Market Exit Considerations
• Evaluate complete exit from states with sustained PD > 5%
• West Virginia (PD 5.9%) offers minimal strategic value
• Reduce energy state exposure to < 10% of portfolio

3. Technology Investment
• Geographic risk dashboard with real-time monitoring
• Automated alert system for threshold breaches
• Integration with external economic data feeds
• Estimated investment: $250K-$400K

POLICY UPDATES REQUIRED

Credit Policy Amendments:
1. State concentration limit: 10% of total portfolio (down from 15%)
2. Regional concentration limit: 20% (new policy)
3. Adjacent-state combined limit: 15% (new policy)

Pricing Adjustments:
| Risk Tier  | States        | Spread Adjustment |
|------------|---------------|-------------------|
| Elevated   | NV, FL, AZ    | +50 bps           |
| Watch      | MI, LA, WV    | +25 bps           |
| Favorable  | CO, MN, VA    | -15 bps           |

Exception Authority:
• State limit exceptions require CCO + CEO approval
• Regional limit exceptions require Board Credit Committee`,
    },

    macro: {
      executive_summary: `Macroeconomic Correlation Analysis - Executive Summary

CORRELATION ANALYSIS RESULTS

Key Points:
• Unemployment Rate shows strongest PD correlation at +0.72 with 2-quarter lead time
• Housing Price Index demonstrates significant negative correlation with both PD (-0.65) and LGD (-0.54)
• All primary correlations are statistically significant (P-value < 0.05)

Analysis of 5-year historical data (20 quarterly observations) reveals significant and actionable correlations between macroeconomic indicators and portfolio credit metrics. These relationships form the foundation for forward-looking CECL estimation and scenario analysis.

Primary Correlations Identified:
| Macro Indicator     | PD Correlation | LGD Correlation | Optimal Lag  | P-Value |
|---------------------|----------------|-----------------|--------------|---------|
| Unemployment Rate   | +0.72          | +0.38           | 2 quarters   | <0.001  |
| Fed Funds Rate      | +0.31          | +0.45           | 1 quarter    | 0.012   |
| GDP Growth          | -0.58          | -0.22           | 1 quarter    | <0.001  |
| CPI Inflation       | +0.41          | +0.18           | 0 quarters   | 0.008   |
| Housing Price Index | -0.65          | -0.54           | 2 quarters   | <0.001  |
| 10Y-2Y Spread       | -0.48          | -0.15           | 3 quarters   | 0.003   |

The Unemployment Rate emerges as the strongest single predictor of portfolio PD with 72% correlation and a 2-quarter lead time, making it highly valuable for forward-looking CECL estimation.

LEADING VS. LAGGING INDICATOR ANALYSIS

Key Points:
• Yield curve spread provides earliest warning signal with 3-quarter lead
• Consumer Confidence Index offers 2-quarter lead for Consumer segment PD
• GDP Growth and Fed Funds Rate are lagging indicators that confirm existing trends

Leading Indicators (Predictive, 2+ quarters ahead):
• Yield Curve Spread (10Y-2Y): 3-quarter lead, inverts before credit deterioration
• Initial Jobless Claims: 2-quarter lead, early employment stress signal
• Consumer Confidence Index: 2-quarter lead for Consumer segment PD

Coincident Indicators (Real-time):
• CPI Inflation: Immediate impact on borrower cash flow stress
• Retail Sales: Same-quarter correlation with Consumer segment

Lagging Indicators (Confirming):
• GDP Growth: 1-quarter lag, confirms already visible credit trends
• Fed Funds Rate: Policy response to conditions already in data

SEGMENT SENSITIVITY ANALYSIS

Key Points:
• Consumer and Auto segments show highest macro sensitivity (unemployment beta > 0.75)
• Residential 1-4 and CRE Owner segments demonstrate defensive characteristics
• A 1% unemployment increase translates to +0.82% PD increase in Consumer segment

Segment Ranking by Macro Sensitivity (Most to Least):
| Rank | Segment        | Unemployment Beta | Rate Sensitivity | Classification      |
|------|----------------|-------------------|------------------|---------------------|
| 1    | Consumer       | 0.82              | Medium           | Highly Cyclical     |
| 2    | Auto           | 0.78              | Low              | Highly Cyclical     |
| 3    | Construction   | 0.71              | High             | Highly Cyclical     |
| 4    | CRE Non-Owner  | 0.56              | High             | Moderately Cyclical |
| 5    | C&I            | 0.51              | Medium           | Moderately Cyclical |
| 6    | Multifamily    | 0.42              | Medium           | Mildly Cyclical     |
| 7    | CRE Owner      | 0.38              | Medium           | Defensive           |
| 8    | Residential    | 0.34              | Low              | Defensive           |

CURRENT ECONOMIC OUTLOOK APPLICATION

Key Points:
• Baseline scenario projects modest portfolio PD increase of +0.12%
• Adverse recession scenario would increase portfolio PD by +1.8% to 4.6%
• Reserve impacts range from +$2.1M (baseline) to +$18.4M (adverse)

Baseline Scenario (Fed December Projections):
• Unemployment: 4.2% to 4.4% (+0.2%)
• Fed Funds: 5.25% to 4.50% (-0.75%)
• GDP Growth: 2.1%

Implied PD Impact:
| Segment   | Current PD | Projected PD | Change  |
|-----------|------------|--------------|---------|
| Consumer  | 3.8%       | 3.96%        | +0.16%  |
| Auto      | 3.2%       | 3.36%        | +0.16%  |
| CRE NOO   | 4.1%       | 4.21%        | +0.11%  |
| Portfolio | 2.81%      | 2.93%        | +0.12%  |

Reserve Impact: Baseline scenario suggests +$2.1M additional reserves needed.

Adverse Scenario (Recession):
• Unemployment: 4.2% to 6.5% (+2.3%)
• Fed Funds: 5.25% to 3.00% (-2.25%)
• GDP Growth: -1.5%

Implied PD Impact: Portfolio PD +1.8% (to 4.6%), Reserve impact +$18.4M

CECL MODEL IMPLICATIONS AND RECOMMENDATIONS

Key Points:
• Combined Macro Q-factor recommended increase from 1.24x to 1.29x
• Consumer/Auto segments need 1-year forecast horizon with 2-year reversion
• Quarterly macro review cadence recommended aligned with Fed projections

Q-Factor Adjustments Based on Macro Outlook:
| Q-Factor Category   | Current | Recommended | Rationale                  |
|---------------------|---------|-------------|----------------------------|
| Economic Conditions | 1.10x   | 1.15x       | Mild unemployment uptick   |
| Rate Environment    | 1.05x   | 1.00x       | Easing cycle supportive    |
| Consumer Health     | 1.08x   | 1.12x       | Inflation strain continuing|
| Combined Macro Q    | 1.24x   | 1.29x       | Net modest headwind        |

Forecast Horizon Recommendations by Segment:
• Consumer/Auto: 1-year reasonable forecast, 2-year reversion
• CRE: 2-year reasonable forecast, 3-year reversion
• C&I: 1.5-year reasonable forecast, 2.5-year reversion

Board-Level Summary:
• Economic outlook suggests modest (+4-5%) reserve increase under baseline
• Adverse scenario requires stress testing of capital adequacy
• Recommend quarterly macro review cadence with Fed projection updates`,

      pattern_analysis: `Macroeconomic Pattern Analysis

ECONOMIC CYCLE POSITION ASSESSMENT

Key Points:
• Current cycle stage identified as Late Expansion / Early Slowdown
• Elevated recession probability (35-40%) within 12-18 months based on yield curve signal
• Current conditions show historical similarity to Q3 2007, Q4 2000, and Q4 2019

Current Cycle Stage: Late Expansion / Early Slowdown

Supporting Evidence:
• Unemployment at 4.2% (near cycle lows)
• Yield curve: Recently normalized after inversion
• Fed policy: Pivoting from tightening to easing
• Corporate profits: Decelerating growth
• Credit spreads: Widening from cycle tights

The current position in the economic cycle shows characteristics consistent with late expansion transitioning to early slowdown. Historical analogs include Q3 2007 (pre-recession), Q4 2000 (tech bubble peak), and Q4 2019 (pre-COVID, cycle mature). Based on these patterns and the yield curve signal, the probability of recession within 12-18 months is elevated at 35-40%.

SEGMENT-SPECIFIC CYCLICAL PATTERNS

Key Points:
• Consumer segment provides earliest warning with 1-quarter lead on downturn
• CRE Non-Owner Occupied is a lagging indicator, deteriorating 2-3 quarters into recession
• Construction serves as leading indicator for CRE stress

Consumer Segment:
• First segment to deteriorate in downturn (1-quarter lead)
• Most sensitive to unemployment (+0.82 beta)
• Recovery lags broader economy by 2 quarters
• Current status: Early deterioration signals visible

CRE Non-Owner Occupied:
• Lagging indicator (deteriorates 2-3 quarters into recession)
• Highest sensitivity to interest rates (+0.71 correlation)
• LGD spikes during property value corrections
• Current status: Stable but rate-sensitive exposure building

Construction:
• Leading indicator for CRE stress (1-2 quarter lead)
• Highest volatility segment (PD std dev = 2.1%)
• Counter-cyclical to rate environment
• Current status: Showing early stress from rate impact

C&I:
• Coincident with business cycle
• Sensitive to both employment and rates
• Corporate profit correlation: -0.45 with PD
• Current status: Stable with earnings deceleration risk

REGIME ANALYSIS

Key Points:
• Normal regime comprises 70% of observations with moderate, stable correlations
• Stress regime shows 3x PD volatility and 2.5x LGD volatility versus normal
• Current assessment indicates 40% probability of transitioning to stress regime

Normal Regime Characteristics (70% of observations):
• PD volatility: 0.3% standard deviation
• LGD volatility: 2.5% standard deviation
• Macro correlations: Moderate and stable
• Duration: 24-36 months average

Stress Regime Characteristics (30% of observations):
• PD volatility: 0.9% standard deviation (3x normal)
• LGD volatility: 6.2% standard deviation (2.5x normal)
• Macro correlations: Strengthen significantly
• Duration: 6-18 months average

Regime Switching Indicators:
1. VIX > 25 for 5+ consecutive days
2. 10Y-2Y spread < 0 for 2+ quarters
3. Initial claims > 300K weekly
4. Consumer confidence < 80

Current Regime Assessment: Transitioning from Normal to Stress (probability 40%)

CROSS-CORRELATION AND TRANSMISSION ANALYSIS

Key Points:
• Full macro-to-credit transmission cycle spans approximately 12 months
• Consumer deterioration leads Auto by 1 month in credit-to-credit contagion
• CRE stress typically materializes 12 months after initial yield curve signal

Macro to Credit Transmission Timeline:
1. Yield curve inverts (T-0)
2. Consumer confidence declines (T+2 months)
3. Consumer segment PD rises (T+3 months)
4. Auto segment PD follows (T+4 months)
5. Employment weakens (T+6 months)
6. C&I segment deteriorates (T+8 months)
7. CRE begins stress (T+12 months)

Credit to Credit Contagion:
• Consumer deterioration leads Auto by 1 month
• Construction stress leads CRE NOO by 2 quarters
• C&I stress leads CRE Owner by 1 quarter`,

      recommendations: `Macro-Based Model Recommendations

MODEL VARIABLE SELECTION BY SEGMENT

Key Points:
• Unemployment Rate is primary driver for Consumer and Auto segments
• Fed Funds Rate is primary driver for CRE segments
• GDP Growth is primary driver for C&I segment

Consumer Segment:
• Primary: Unemployment Rate (2Q lag, beta=0.82)
• Secondary: Consumer Confidence Index (1Q lag)
• Tertiary: Personal Savings Rate (0Q lag)
• Interaction: Unemployment x Debt-to-Income

CRE Segments:
• Primary: Fed Funds Rate (1Q lag, beta=0.71)
• Secondary: Housing Price Index (2Q lag)
• Tertiary: CMBS Spread (0Q lag)
• Interaction: Rate x Vacancy Rate

C&I Segment:
• Primary: GDP Growth (1Q lag, beta=-0.58)
• Secondary: ISM Manufacturing PMI (0Q lag)
• Tertiary: Corporate Profit Growth (1Q lag)

Auto Segment:
• Primary: Unemployment Rate (2Q lag, beta=0.78)
• Secondary: Consumer Debt Service Ratio (0Q lag)
• Tertiary: Used Car Price Index (1Q lag)

The model variable selection reflects the underlying economic drivers for each segment. Consumer and Auto segments are most sensitive to employment conditions, while CRE segments respond primarily to interest rate changes that affect property valuations and financing costs.

FORECAST INTEGRATION RECOMMENDATIONS

Key Points:
• Primary forecast sources include FOMC, Blue Chip, and internal economics team
• CRE requires longest forecast horizon at 12 quarters total
• Consumer and Auto segments use 8-quarter total horizon

Primary Forecast Sources:
1. Federal Reserve FOMC Projections (SEP) - Quarterly
2. Blue Chip Economic Indicators - Monthly consensus
3. Internal Economics Team forecasts - Monthly

Forecast Horizon Guidelines:
| Segment      | Reasonable Period | Reversion Period | Total Horizon |
|--------------|-------------------|------------------|---------------|
| Consumer     | 4 quarters        | 4 quarters       | 8 quarters    |
| Auto         | 4 quarters        | 4 quarters       | 8 quarters    |
| CRE          | 6 quarters        | 6 quarters       | 12 quarters   |
| C&I          | 5 quarters        | 5 quarters       | 10 quarters   |
| Construction | 4 quarters        | 6 quarters       | 10 quarters   |

SCENARIO FRAMEWORK SPECIFICATIONS

Key Points:
• Baseline scenario carries 50% probability weight
• Adverse scenario models mild recession with 35% weight
• Severely adverse scenario models deep recession with 15% weight

Baseline Scenario (50% probability weight):
| Indicator    | Current | Year 1 | Year 2 |
|--------------|---------|--------|--------|
| Unemployment | 4.2%    | 4.5%   | 4.3%   |
| Fed Funds    | 5.25%   | 4.25%  | 3.75%  |
| GDP Growth   | 2.5%    | 2.0%   | 2.2%   |
| HPI YoY      | 3.0%    | 2.5%   | 3.0%   |

Adverse Scenario (35% probability weight):
| Indicator    | Current | Year 1 | Year 2 |
|--------------|---------|--------|--------|
| Unemployment | 4.2%    | 6.0%   | 5.5%   |
| Fed Funds    | 5.25%   | 3.00%  | 2.50%  |
| GDP Growth   | 2.5%    | -0.5%  | 1.5%   |
| HPI YoY      | 3.0%    | -5.0%  | 0.0%   |

Severely Adverse Scenario (15% probability weight):
| Indicator    | Current | Year 1 | Year 2 |
|--------------|---------|--------|--------|
| Unemployment | 4.2%    | 8.5%   | 7.5%   |
| Fed Funds    | 5.25%   | 1.00%  | 0.50%  |
| GDP Growth   | 2.5%    | -3.5%  | 0.5%   |
| HPI YoY      | 3.0%    | -15.0% | -5.0%  |

Q-FACTOR METHODOLOGY AND CURRENT RECOMMENDATIONS

Key Points:
• Quantitative framework combines economic outlook, rate environment, and property market factors
• Current calculation yields base Q-factor of 1.01x
• Recommended overlays increase final Q-factor to 1.09x

Quantitative Q-Factor Framework:
Q-Factor = Base (1.0) + Sum of Factor Adjustments

Factor Adjustments:
• Economic Outlook: (Projected Unemployment - Historical Avg) / Historical Std x 0.10
• Rate Environment: (Projected Rate - Neutral Rate) / 100 x 0.05
• Property Markets: (Projected HPI Growth - Historical Avg) / Historical Std x 0.08

Current Q-Factor Calculation:
| Component        | Calculation                       | Adjustment |
|------------------|-----------------------------------|------------|
| Economic         | (4.5% - 5.0%) / 1.2% x 0.10       | -0.04      |
| Rate             | (4.25% - 2.5%) / 100 x 0.05       | +0.09      |
| Property         | (2.5% - 4.0%) / 3.0% x 0.08       | -0.04      |
| Total Q-Factor   | 1.0 + (-0.04 + 0.09 - 0.04)       | 1.01       |

Recommended Q-Factor Overlays:
• Uncertainty adjustment: +0.05 (elevated forecast uncertainty)
• Model limitation: +0.03 (known model gaps)
• Final Recommended Q-Factor: 1.09x`,
    },

    backtesting: {
      executive_summary: `Backtesting Results - Executive Summary

OVERALL MODEL PERFORMANCE ASSESSMENT

Key Points:
• Overall accuracy of 87% meets the required benchmark of >85%
• Systematic under-prediction of 9.4% indicates calibration adjustment warranted
• Performance rating: GOOD (B+)

Performance Metrics Summary:
| Metric               | Value  | Rating      | Benchmark       |
|----------------------|--------|-------------|-----------------|
| Overall Accuracy     | 87%    | Good        | >85% required   |
| Mean Absolute Error  | $2.3M  | Acceptable  | <$3M target     |
| Root Mean Square Error| $3.1M | Acceptable  | <$4M target     |
| Bias (Avg Error)     | -$0.8M | Under-predicting | Target: $0  |
| Error Std Deviation  | $2.9M  | Moderate    | <$2.5M ideal    |

The model demonstrates acceptable predictive accuracy overall, though systematic under-prediction of 9.4% suggests calibration adjustment is warranted. This bias is particularly pronounced during periods of economic stress, indicating the model may not fully capture deterioration dynamics.

DETAILED PERFORMANCE DECOMPOSITION

Key Points:
• Model increasingly under-predicts as credit environment deteriorates (2022-2024 trend)
• Construction segment shows critical under-prediction at -22.6%
• Consumer and Auto segments over-predict by approximately 10%

Accuracy by Time Period:
| Period      | Predicted ($M) | Actual ($M) | Variance | Accuracy |
|-------------|----------------|-------------|----------|----------|
| 2021 Q1-Q4  | 8.2            | 7.4         | +10.8%   | Over     |
| 2022 Q1-Q4  | 9.1            | 9.8         | -7.1%    | Under    |
| 2023 Q1-Q4  | 10.4           | 12.2        | -14.8%   | Under    |
| 2024 Q1-Q3  | 8.8            | 9.6         | -8.3%    | Under    |

Accuracy by Segment:
| Segment       | Predicted | Actual | Variance | Assessment        |
|---------------|-----------|--------|----------|-------------------|
| Consumer      | $12.4M    | $11.2M | +10.7%   | Over-predicting   |
| CRE Non-Owner | $8.2M     | $9.8M  | -16.3%   | Under-predicting  |
| Construction  | $4.1M     | $5.3M  | -22.6%   | Critical          |
| C&I           | $5.8M     | $6.2M  | -6.5%    | Acceptable        |
| Auto          | $3.2M     | $2.9M  | +10.3%   | Over-predicting   |

SYSTEMATIC BIAS ANALYSIS

Key Points:
• Under-prediction occurs in 62% of quarterly observations
• Model lacks stress sensitivity, under-predicting during deterioration
• CRE Non-Owner and Construction segments show largest under-prediction bias

Under-Prediction Pattern (Actual > Predicted):
• Occurs in 62% of quarterly observations
• Average under-prediction magnitude: -$1.4M
• Concentrated in CRE Non-Owner segment (-16.3%), Construction segment (-22.6%), and economic stress periods (-24% avg during elevated unemployment)

Over-Prediction Pattern (Actual < Predicted):
• Occurs in 38% of quarterly observations
• Average over-prediction magnitude: +$0.9M
• Concentrated in Consumer segment (+10.7%), Auto segment (+10.3%), and low-stress economic periods (+12% avg)

The model lacks stress sensitivity, consistently under-predicting during deterioration periods while over-predicting during benign conditions. This asymmetric behavior creates potential reserve adequacy concerns during economic downturns.

STRESS PERIOD PERFORMANCE ANALYSIS

Key Points:
• Q3 2023 peak stress showed 35.7% under-prediction
• Stress multiplier of 1.25x would improve accuracy during elevated risk periods
• Root causes include PD model insensitivity and conservative Q-factor application

Model Behavior During Q3 2023 (Peak Stress):
• Unemployment rose from 3.5% to 4.2%
• Model predicted: $2.8M quarterly loss
• Actual loss: $3.8M
• Under-prediction: 35.7%

Root Cause Assessment:
1. PD model insufficiently sensitive to rapid unemployment change
2. LGD model not updated for property value decline
3. Q-factor adjustment applied too conservatively

During stress periods (defined as unemployment > 4.0% or GDP < 1.5%), the model consistently under-predicts by 20-30%. A stress multiplier of 1.25x would improve accuracy and better align reserves with actual loss experience.

MODEL RISK ASSESSMENT

Key Points:
• High severity limitations in stress insensitivity and Construction segment
• Data quality concerns include 12 observations with imputed collateral values
• Construction segment has limited data with only 42 observations

Model Limitations Identified:
| Limitation            | Severity | Impact              | Mitigation              |
|-----------------------|----------|---------------------|-------------------------|
| Stress insensitivity  | High     | Under-reserving $2-4M| Add stress overlay     |
| Construction segment  | High     | Under-reserving $1.2M| Segment recalibration  |
| Vintage effect decay  | Medium   | Mixed               | Extend vintage factors  |
| Geographic bias       | Medium   | Regional variance   | State-level calibration |

Data Quality Concerns:
• 12 observations with missing collateral values (imputed)
• Construction segment data limited (42 observations)
• Pre-2020 data may not reflect current conditions

CALIBRATION RECOMMENDATIONS

Key Points:
• Net reserve impact of +$1.9M from recommended adjustments
• Stress overlay of 1.15x recommended when unemployment > 4.0%
• Construction segment requires permanent 1.22x multiplier

Immediate Adjustments (Current Quarter):
1. Apply Stress Overlay: 1.15x multiplier when unemployment > 4.0%
2. Construction Segment Adjustment: 1.22x permanent multiplier
3. Reduce Consumer Over-Prediction: 0.90x adjustment

Estimated Impact:
| Adjustment      | Reserve Change | Direction |
|-----------------|----------------|-----------|
| Stress overlay  | +$2.1M         | Increase  |
| Construction    | +$0.9M         | Increase  |
| Consumer        | -$1.1M         | Decrease  |
| Net Change      | +$1.9M         | Increase  |

GOVERNANCE IMPLICATIONS

Model Validation Findings:
• Model performance: Acceptable with documented limitations
• Recommended validation cycle: Semi-annual (current: annual)
• Challenger model development: Recommended for Construction segment

Required Remediation Actions:
1. Recalibrate Construction segment model (Priority: High)
2. Implement stress adjustment methodology (Priority: High)
3. Develop vintage extension factors (Priority: Medium)
4. Update model documentation (Priority: Medium)

Documentation Updates Required:
• Model methodology appendix for stress overlay
• Segment-specific limitation disclosures
• Governance review of adjustment authorities`,

      pattern_analysis: `Backtesting Pattern Analysis

ERROR DECOMPOSITION

Key Points:
• Total cumulative error of -$9.6M over last 12 quarters indicates systematic under-prediction
• 75% of error is attributable to bias (systematic), 25% to variance (random)
• Bias has increased over time, reaching -$3.1M in 2023

Total Error Breakdown (Last 12 Quarters):
Total Cumulative Error: -$9.6M (under-prediction)

| Component          | Amount  | % of Total | Description                    |
|--------------------|---------|------------|--------------------------------|
| Bias (Systematic)  | -$7.2M  | 75%        | Consistent under-prediction    |
| Variance (Random)  | -$2.4M  | 25%        | Quarter-to-quarter variation   |

Bias Analysis:
• Consistent negative bias indicates model structural issue
• Bias has increased over time (2023: -$3.1M, 2024 YTD: -$2.8M)
• Primary driver: Stress sensitivity gap

Variance Analysis:
• Quarterly variance: $2.9M standard deviation
• Acceptable volatility, but elevated during regime changes
• Seasonal pattern: Q4 typically over-predicts (holiday paydowns)

CONDITIONAL ERROR ANALYSIS

Key Points:
• Model error is regime-dependent, not random
• Stress regime shows -$3.4M average error versus +$0.6M during expansion
• Construction shows critical -34% error during stress regime

Errors by Economic Regime:
| Regime     | Quarters | Avg Error | Direction |
|------------|----------|-----------|-----------|
| Expansion  | 6        | +$0.6M    | Over      |
| Late Cycle | 4        | -$1.2M    | Under     |
| Stress     | 2        | -$3.4M    | Under     |

The conditional error analysis reveals that model accuracy varies significantly by economic regime. During expansion periods, the model slightly over-predicts, while during stress periods it substantially under-predicts. This pattern indicates the model lacks adequate sensitivity to deteriorating conditions.

Errors by Segment (During Stress Regime):
| Segment      | Error | Assessment |
|--------------|-------|------------|
| Construction | -34%  | Critical   |
| CRE NOO      | -28%  | Severe     |
| Consumer     | -12%  | Moderate   |
| C&I          | -18%  | Elevated   |

Errors by Vintage Year:
| Vintage    | Current Balance | Error Rate | Issue             |
|------------|-----------------|------------|-------------------|
| 2019-2020  | $1.2B           | +8%        | Over-predicting   |
| 2021       | $0.9B           | -4%        | Slight under      |
| 2022       | $1.1B           | -18%       | Under-predicting  |
| 2023-2024  | $1.0B           | -22%       | Under-predicting  |

Newer vintages showing higher under-prediction suggests an origination quality shift not captured in the current model framework.

TEMPORAL PATTERN ANALYSIS

Key Points:
• Q3 shows highest under-prediction at -12% (peak defaults)
• Q4 shows over-prediction at +6% (payoff season)
• Forecast accuracy decays from 92% at 1 quarter to 74% at 4 quarters

Quarterly Seasonality:
| Quarter | Typical Error | Pattern                   |
|---------|---------------|---------------------------|
| Q1      | -8%           | Under (post-holiday stress)|
| Q2      | -4%           | Slight under              |
| Q3      | -12%          | Under (peak defaults)     |
| Q4      | +6%           | Over (payoff season)      |

Annual Trend:
• 2021: Average error +5% (over-predicting post-COVID)
• 2022: Average error -7% (rate shock not anticipated)
• 2023: Average error -15% (stress escalation)
• 2024: Average error -10% (partial correction)

Forecast Horizon Decay:
| Horizon    | Accuracy | Error Growth |
|------------|----------|--------------|
| 1 quarter  | 92%      | Baseline     |
| 2 quarters | 87%      | +5% error    |
| 3 quarters | 81%      | +11% error   |
| 4 quarters | 74%      | +18% error   |

OUTLIER PERIOD ANALYSIS

Key Points:
• Q3 2023 showed extreme -36% error during unemployment spike
• Common outlier characteristic: rapid macro environment change (>0.3% quarterly)
• Geographic concentration in Sun Belt states correlates with outlier periods

Extreme Error Periods (Error > 2 Std Dev):
| Period  | Predicted | Actual | Error | Root Cause          |
|---------|-----------|--------|-------|---------------------|
| Q3 2023 | $2.8M     | $3.8M  | -36%  | Unemployment spike  |
| Q1 2023 | $2.4M     | $3.1M  | -29%  | CRE stress onset    |
| Q4 2021 | $2.1M     | $1.7M  | +24%  | Stimulus paydowns   |

Common Outlier Characteristics:
1. Rapid macro environment change (unemployment change > 0.3% quarterly)
2. Segment concentration in CRE/Construction
3. Geographic concentration in Sun Belt states

Root Cause Hypotheses:
1. PD model lacks momentum/acceleration factors
2. LGD model based on historical averages insufficient during stress
3. Segment correlations increase during stress (not modeled)`,

      recommendations: `Backtesting-Based Model Improvements

MODEL RECALIBRATION (Implementation: Current Quarter)

Key Points:
• Construction and CRE Non-Owner segments require upward multipliers to address under-prediction
• Consumer and Auto segments require downward adjustments for over-prediction
• Implementation should be documented and disclosed as Q-factor overlay

1. Segment-Specific Multipliers

| Segment       | Current Model | Multiplier | Adjusted Model | Rationale                |
|---------------|---------------|------------|----------------|--------------------------|
| Construction  | 4.2% PD       | 1.22x      | 5.1% PD        | -22.6% historical bias   |
| CRE Non-Owner | 3.8% PD       | 1.16x      | 4.4% PD        | -16.3% historical bias   |
| Consumer      | 3.6% PD       | 0.90x      | 3.2% PD        | +10.7% over-prediction   |
| Auto          | 2.8% PD       | 0.90x      | 2.5% PD        | +10.3% over-prediction   |
| C&I           | 2.9% PD       | 1.07x      | 3.1% PD        | -6.5% historical bias    |

Implementation Steps:
1. Document multiplier methodology and rationale
2. Apply to current quarter CECL calculation
3. Disclose as Q-factor overlay in ALLL report
4. Review quarterly for adjustment

2. Stress Regime Overlay

When stress indicators triggered (any of unemployment > 4.0%, GDP growth < 1.5%, or VIX > 25 sustained), apply the following additional overlay to address the model's tendency to under-predict during stress periods.

| Segment      | Stress Multiplier |
|--------------|-------------------|
| Construction | 1.15x             |
| CRE          | 1.12x             |
| Consumer     | 1.08x             |
| Other        | 1.05x             |

3. Vintage Adjustment Extension

Current model vintage factors decay to 1.0x after Year 2. Analysis suggests extending the factor curve to better capture seasoning effects.

| Vintage Age | Current Factor | Recommended        |
|-------------|----------------|--------------------|
| Year 1      | 1.15x          | 1.15x (no change)  |
| Year 2      | 1.08x          | 1.10x              |
| Year 3      | 1.00x          | 1.05x              |
| Year 4      | 1.00x          | 1.02x              |
| Year 5+     | 1.00x          | 1.00x              |

MODEL ENHANCEMENT ROADMAP

Key Points:
• Short-term focus on momentum variables and correlation modeling
• Medium-term development of challenger models and through-the-cycle LGD
• Geographic calibration factors address regional under-prediction patterns

Short-Term Enhancements (1-3 Months):

1. Add Momentum Variables
• Include PD change (quarter-over-quarter)
• Include unemployment rate of change
• Expected improvement: 5-8% accuracy gain during transitions

2. Segment Correlation Modeling
• Build correlation matrix for stress regime
• Apply copula approach for tail dependence
• Estimated reserve impact: +$1.5M during stress

3. Geographic Calibration Factors
| Region   | Factor | Rationale                  |
|----------|--------|----------------------------|
| Sun Belt | 1.08x  | Historical under-prediction|
| Midwest  | 1.03x  | Industrial sensitivity     |
| Other    | 1.00x  | Baseline                   |

Medium-Term Enhancements (3-6 Months):

1. Alternative Model Development
• Machine learning model as challenger
• Focus on Construction and CRE segments
• Ensemble approach recommended

2. Through-the-Cycle LGD Model
• Current: Point-in-time LGD
• Proposed: Blend with through-the-cycle
• Weight: 70% PIT / 30% TTC

3. Macro Variable Updates
• Add consumer confidence as leading indicator
• Add credit spread for corporate segments
• Add housing inventory for CRE

PROCESS IMPROVEMENTS

Key Points:
• Backtesting frequency increase from annual to quarterly recommended
• Expanded testing to include segment, vintage, and geographic stratification
• Enhanced documentation including quarterly memos and performance scorecards

Backtesting Frequency:
| Current               | Recommended            | Rationale              |
|-----------------------|------------------------|------------------------|
| Annual                | Quarterly              | Model drift detection  |
| 4-quarter lookback    | 8-quarter lookback     | Pattern identification |
| Portfolio level       | Segment level          | Granular performance   |

Expanded Testing Scenarios:
1. Segment-level backtesting (currently only portfolio)
2. Vintage cohort testing (new)
3. Geographic stratification (new)
4. Economic regime backtesting (new)

Documentation Enhancements:
• Quarterly backtesting memo to Credit Committee
• Segment-specific performance scorecards
• Trend analysis dashboards
• Model limitation disclosures

GOVERNANCE ACTIONS

Key Points:
• Model risk rating upgrade from Low-Medium to Medium recommended
• Accelerated validation schedule with full validation in Q2 2025
• Escalation requirements defined by error threshold levels

Model Risk Rating Update:
| Current    | Recommended | Drivers                                     |
|------------|-------------|---------------------------------------------|
| Low-Medium | Medium      | Stress performance gap, Construction weakness|

Validation Schedule:
• Full validation: Q2 2025 (currently Q4 2025)
• Interim monitoring: Monthly performance reports
• Deep dive: Construction segment by Q1 2025

Escalation Requirements:
| Error Threshold               | Action Required                |
|-------------------------------|--------------------------------|
| > 15% quarterly               | Notify Model Risk              |
| > 25% quarterly               | Credit Committee escalation    |
| > 30% quarterly               | Board Risk Committee           |
| 3 consecutive quarters under  | Model review triggered         |`,
    },

    'pre-chargeoff': {
      executive_summary: `Pre-Charge-Off Behavior Analysis - Executive Summary

TRAJECTORY ANALYSIS SUMMARY

Key Points:
• Analysis of 200 charged-off loans reveals consistent warning patterns in the 36 months preceding charge-off
• PD acceleration is the clearest signal, with deterioration rate increasing each period closer to charge-off
• LGD remains stable until final 6 months, then accelerates sharply due to collateral value decline

Analysis of 200 charged-off loans reveals consistent and identifiable warning patterns in the 36 months preceding charge-off. These patterns provide actionable intelligence for early intervention. The most significant finding is that PD acceleration serves as a reliable early warning indicator, with the rate of deterioration increasing predictably as charge-off approaches.

Portfolio-Level PD Trajectory:
| Months Before Charge-Off | Average PD | PD Change | Cumulative Change    |
|--------------------------|------------|-----------|----------------------|
| -36 (3 years prior)      | 2.8%       | Baseline  | -                    |
| -24 (2 years prior)      | 4.2%       | +1.4%     | +50% from baseline   |
| -18                      | 5.8%       | +1.6%     | +107% from baseline  |
| -12 (1 year prior)       | 8.4%       | +2.6%     | +200% from baseline  |
| -6                       | 12.1%      | +3.7%     | +332% from baseline  |
| -3                       | 16.8%      | +4.7%     | +500% from baseline  |
| Charge-Off               | 18.4%      | +1.6%     | +557% from baseline  |

LGD Trajectory Analysis:
| Months Before Charge-Off | Average LGD | Trend                |
|--------------------------|-------------|----------------------|
| -36 to -12               | 44-46%      | Stable               |
| -12 to -6                | 48%         | Slight increase      |
| -6 to -3                 | 54%         | Acceleration begins  |
| -3 to 0                  | 62%         | Sharp increase       |

EARLY WARNING SIGNAL FRAMEWORK

Key Points:
• Tier 1 leading indicators are observable in 78% of charged-off loans 18+ months ahead
• Tier 2 confirming indicators appear in 89% of cases 6-18 months before charge-off
• Tier 3 late indicators are present in 96% of cases within 6 months of charge-off

Tier 1 - Leading Indicators (18+ months before charge-off):
Observable in 78% of eventually charged-off loans
| Signal                         | Threshold | False Positive Rate | Lead Time           |
|--------------------------------|-----------|---------------------|---------------------|
| PD increase >50% from baseline | Yes       | 12%                 | -24 to -18 months   |
| Credit score decline >40 points| Yes       | 18%                 | -20 months avg      |
| Payment pattern change         | Yes       | 22%                 | -18 months avg      |

Tier 2 - Confirming Indicators (6-18 months before charge-off):
Observable in 89% of eventually charged-off loans
| Signal                    | Threshold | False Positive Rate | Lead Time       |
|---------------------------|-----------|---------------------|-----------------|
| PD exceeds 2x baseline    | Yes       | 8%                  | -12 months avg  |
| First 30-day delinquency  | Yes       | 25%                 | -10 months avg  |
| LTV deterioration >10%    | Yes       | 15%                 | -9 months avg   |

Tier 3 - Late Indicators (0-6 months before charge-off):
Observable in 96% of eventually charged-off loans
| Signal                 | Threshold | False Positive Rate | Lead Time      |
|------------------------|-----------|---------------------|----------------|
| PD exceeds 10%         | Yes       | 5%                  | -6 months avg  |
| 60+ day delinquency    | Yes       | 8%                  | -4 months avg  |
| LGD begins acceleration| Yes       | 12%                 | -6 months avg  |

SEGMENT-SPECIFIC PATTERN ANALYSIS

Key Points:
• CRE provides longest warning window at 24 months while Auto has shortest at 9 months
• Intervention windows vary significantly by segment, requiring tailored monitoring strategies
• Commercial segments show gradual deterioration patterns, while consumer segments deteriorate rapidly

Pattern Timing by Segment:
| Segment         | First Detectable Signal | Optimal Intervention | Window   |
|-----------------|-------------------------|----------------------|----------|
| CRE Non-Owner   | -24 months              | -18 months           | 6 months |
| Construction    | -18 months              | -12 months           | 6 months |
| C&I             | -18 months              | -15 months           | 3 months |
| Consumer        | -12 months              | -9 months            | 3 months |
| Auto            | -9 months               | -6 months            | 3 months |
| Residential 1-4 | -15 months              | -12 months           | 3 months |

Segment Deterioration Patterns:

CRE Non-Owner Occupied:
• Occupancy decline precedes PD increase by 6 months
• NOI deterioration visible at -24 months
• Debt service coverage ratio drops below 1.2x at -18 months
• Pattern: Gradual then accelerating

Consumer:
• Payment behavior changes first (partial payments, timing shifts)
• Utilization of other credit increases
• Pattern: Relatively rapid once initiated

C&I:
• Revenue decline leads PD by 6-9 months
• Trade payables extension visible at -18 months
• Covenant breaches average -12 months
• Pattern: Business cycle correlated

INTERVENTION OPPORTUNITY ASSESSMENT

Key Points:
• Early intervention at -18 months provides 75% chance of avoiding charge-off
• Recovery improvement ranges from +15% (Auto) to +35% (CRE) with optimal timing
• Intervention effectiveness drops sharply after the optimal window closes

Optimal Intervention Windows:
| Segment  | Window Opens | Window Closes | Duration | Recovery Improvement |
|----------|--------------|---------------|----------|----------------------|
| CRE      | -18 months   | -9 months     | 9 months | +35% recovery        |
| Consumer | -9 months    | -3 months     | 6 months | +20% recovery        |
| C&I      | -15 months   | -6 months     | 9 months | +30% recovery        |
| Auto     | -6 months    | -2 months     | 4 months | +15% recovery        |

Recovery Improvement by Intervention Timing:
• Intervene at -18 months: 75% chance of avoiding charge-off
• Intervene at -12 months: 55% chance of avoiding charge-off
• Intervene at -6 months: 25% chance of avoiding charge-off
• Intervene at -3 months: 10% chance (workout/loss mitigation only)

MODEL AND MONITORING IMPLICATIONS

Key Points:
• Three-tier watch list criteria recommended (Yellow, Orange, Red)
• Current linear deterioration models should be replaced with accelerating curves
• Estimated reserve impact of +$2.8M for more accurate timing

Watch List Criteria Recommendations:
| Tier   | Criteria                        | Action            | Monitoring |
|--------|--------------------------------|-------------------|------------|
| Yellow | PD > 1.5x baseline             | Enhanced review   | Monthly    |
| Orange | PD > 2.0x baseline OR 30 DPD   | Active management | Weekly     |
| Red    | PD > 3.0x baseline OR 60 DPD   | Workout/collection| Daily      |

Lifetime Loss Trajectory Modeling:
• Current models assume linear deterioration
• Recommendation: Implement accelerating deterioration curves
• Use segment-specific trajectory shapes
• Estimated reserve impact: +$2.8M for more accurate timing

Board-Level Takeaways:
1. Early warning system can identify 78% of future charge-offs 18+ months ahead
2. Optimal intervention window exists but is finite - requires rapid response
3. CRE segment provides longest lead time for proactive management
4. Investment in monitoring systems yields measurable recovery improvement`,

      pattern_analysis: `Pre-Charge-Off Pattern Details

PD TRAJECTORY PATTERN CLASSIFICATION

Key Points:
• Three distinct deterioration patterns identified: Gradual (45%), Sudden (35%), and Step-Function (20%)
• Gradual patterns in CRE and C&I are easiest to detect and intervene
• Sudden deterioration in Consumer and Auto segments provides shorter intervention windows

Analysis identified three distinct deterioration patterns among charged-off loans. Understanding these patterns is critical for designing segment-appropriate monitoring and intervention strategies.

Pattern 1 - Gradual Deterioration (45% of charge-offs):
• Steady, linear PD increase over 24-36 months
• No sudden acceleration
• Typically: CRE, C&I segments
• Easiest to detect and intervene

| Months | PD Level | Change Rate |
|--------|----------|-------------|
| -36    | 2.5%     | -           |
| -24    | 3.8%     | +0.5%/qtr   |
| -12    | 6.2%     | +0.6%/qtr   |
| -6     | 8.8%     | +0.9%/qtr   |
| 0      | 11.5%    | +0.9%/qtr   |

Pattern 2 - Sudden Deterioration (35% of charge-offs):
• Stable PD for extended period
• Rapid deterioration triggered by event
• Typically: Consumer, Auto segments
• Shorter intervention window

| Months | PD Level | Change Rate |
|--------|----------|-------------|
| -36    | 2.2%     | -           |
| -24    | 2.4%     | +0.1%/qtr   |
| -12    | 2.8%     | +0.1%/qtr   |
| -6     | 8.5%     | +2.9%/qtr   |
| 0      | 16.2%    | +2.6%/qtr   |

Pattern 3 - Step-Function Deterioration (20% of charge-offs):
• Periods of stability punctuated by sudden jumps
• Often tied to specific events (job loss, rate reset)
• Typically: Residential, Construction
• Moderate intervention window

| Months | PD Level | Event              |
|--------|----------|--------------------|
| -36    | 2.0%     | Baseline           |
| -24    | 2.2%     | Stable             |
| -18    | 4.8%     | Jump (rate reset)  |
| -12    | 5.2%     | Stable             |
| -6     | 11.5%    | Jump (employment)  |
| 0      | 14.8%    | Charge-off         |

LGD BEHAVIOR ANALYSIS

Key Points:
• LGD remains stable at 44% (plus/minus 3%) from -36 to -9 months
• LGD acceleration begins at -9 months with sharp increase from 44% to 62%
• Construction shows highest LGD acceleration reaching 72% at charge-off

LGD Stability Period (-36 to -9 months):
• Average LGD: 44% (plus/minus 3%)
• Low correlation with PD trajectory (r = 0.18)
• Collateral values stable or appreciating
• Standard loss severity assumptions hold

LGD Acceleration Period (-9 to 0 months):
• Average LGD increase: 44% to 62%
• High correlation with PD in final stages (r = 0.72)
• Drivers include collateral value decline (distressed sales), accumulated interest/fees, collection costs, and time value of extended workout

Segment LGD Patterns:
| Segment      | LGD at -12mo | LGD at -6mo | LGD at 0 | Acceleration |
|--------------|--------------|-------------|----------|--------------|
| CRE NOO      | 42%          | 48%         | 65%      | High         |
| Construction | 45%          | 55%         | 72%      | Very High    |
| Consumer     | 46%          | 50%         | 58%      | Moderate     |
| Auto         | 38%          | 42%         | 52%      | Moderate     |
| C&I          | 44%          | 52%         | 68%      | High         |
| Residential  | 40%          | 44%         | 55%      | Moderate     |

PAYMENT BEHAVIOR INDICATOR ANALYSIS

Key Points:
• First 30-day delinquency occurs at -10.2 months average in 88% of charged-off loans
• Non-delinquency payment signals observable in 72% of loans before any delinquency
• Payment timing shift provides earliest signal at -15 months average

Delinquency Progression Pattern:
| Status           | Months Before Charge-Off | % of Loans |
|------------------|--------------------------|------------|
| First 30 DPD     | -10.2 months             | 88%        |
| First 60 DPD     | -5.8 months              | 78%        |
| First 90 DPD     | -3.1 months              | 65%        |
| 90+ DPD sustained| -2.4 months              | 62%        |

Non-Delinquency Payment Signals (Pre-30 DPD):
Observable in 72% of eventually charged-off loans before any delinquency

1. Payment Timing Shift
• Payments move from early-month to late-month
• Lead time: -15 months average
• Detection rate: 58%

2. Partial Payment Pattern
• Full payment drops to 95% then 90%
• Lead time: -12 months average
• Detection rate: 42%

3. ACH Failure Pattern
• Failed auto-payments increase
• Lead time: -8 months average
• Detection rate: 35%

SEGMENT DIFFERENTIATION DETAILS

Key Points:
• CRE Non-Owner Occupied shows earliest signals with occupancy decline at -24 months
• Auto segment has shortest timeline with score drops at -9 months average
• Recovery potential varies from +15% (Auto) to +35% (CRE) with early intervention

CRE Non-Owner Occupied:
• Primary leading indicator: Occupancy rate decline
• Timeline: Occupancy falls below 85% at -24 months average
• Secondary indicators: NOI decline, DSCR deterioration
• Intervention opportunity: Restructure before distress sale
• Recovery potential: High with early intervention (+35%)

Consumer:
• Primary leading indicator: Credit utilization spike
• Timeline: Utilization exceeds 80% at -15 months average
• Secondary indicators: Score decline, payment pattern
• Intervention opportunity: Modification, payment plan
• Recovery potential: Moderate (+20%)

C&I:
• Primary leading indicator: Revenue decline / AR aging
• Timeline: Revenue -15% YoY at -18 months average
• Secondary indicators: Covenant breach, payables stretch
• Intervention opportunity: Working capital support, forbearance
• Recovery potential: High with business survival (+30%)

Auto:
• Primary leading indicator: Rapid score decline
• Timeline: Score drops >50 points at -9 months average
• Secondary indicators: Payment pattern, employment verification
• Intervention opportunity: Limited due to short timeline
• Recovery potential: Low (+15%)

PREDICTIVE FEATURE IMPORTANCE

Key Points:
• Dynamic/change features outperform static features for prediction
• PD rate of change is the most important feature with 0.28 importance score
• Behavioral features (delinquency history, payment pattern) rank highly

Machine Learning Feature Ranking:
| Rank | Feature              | Importance | Type       |
|------|----------------------|------------|------------|
| 1    | PD rate of change    | 0.28       | Derived    |
| 2    | PD level vs baseline | 0.22       | Ratio      |
| 3    | Delinquency history  | 0.18       | Behavioral |
| 4    | Credit score change  | 0.12       | External   |
| 5    | Payment pattern score| 0.08       | Behavioral |
| 6    | LTV current          | 0.06       | Collateral |
| 7    | DSCR (if commercial) | 0.04       | Financial  |
| 8    | Vintage              | 0.02       | Static     |`,

      recommendations: `Early Intervention Strategy Recommendations

TRIGGER FRAMEWORK IMPLEMENTATION

Key Points:
• Three-tier flag system (Yellow, Orange, Red) provides graduated response framework
• Response times range from 5 business days (Yellow) to immediate (Red)
• Clear ownership assignments ensure accountability at each escalation level

Three-Tier Flag System:

YELLOW FLAG - Enhanced Monitoring:
| Trigger                    | Threshold       | Response Time    | Owner       |
|----------------------------|-----------------|------------------|-------------|
| PD > 1.5x baseline         | Any segment     | 5 business days  | RM          |
| Credit score decline       | >30 points      | 5 business days  | RM          |
| Payment pattern shift      | Detection flag  | 10 business days | Collections |
| DSCR decline (commercial)  | Below 1.3x      | 5 business days  | RM          |

Actions Required:
• Relationship manager outreach within 10 days
• Updated financial/credit review
• Bi-monthly monitoring upgrade (from quarterly)
• Document in credit file

ORANGE FLAG - Active Management:
| Trigger             | Threshold    | Response Time | Owner          |
|---------------------|--------------|---------------|----------------|
| PD > 2.0x baseline  | Any segment  | 48 hours      | Credit Officer |
| First 30 DPD        | Any segment  | Immediate     | Collections    |
| LTV > threshold     | Breach       | 72 hours      | Credit Officer |
| Covenant breach     | Any          | 48 hours      | RM + Credit    |

Actions Required:
• Senior credit officer assignment
• Workout option assessment
• Weekly monitoring cadence
• Board watch list addition
• Specific reserve review

RED FLAG - Workout/Loss Mitigation:
| Trigger                | Threshold   | Response Time | Owner                |
|------------------------|-------------|---------------|----------------------|
| PD > 3.0x baseline     | Any segment | Immediate     | Special Assets       |
| 60+ DPD                | Any segment | Immediate     | Special Assets       |
| DSCR < 1.0x sustained  | Commercial  | 24 hours      | Special Assets       |
| Fraud/misrepresentation| Any         | Immediate     | Legal + Special Assets|

Actions Required:
• Transfer to Special Assets group
• Formal workout plan within 30 days
• Daily monitoring
• Reserve to expected loss level
• Legal strategy assessment

INTERVENTION PLAYBOOK BY SEGMENT

Key Points:
• CRE Yellow flags show 85% retention rate with proactive management
• Consumer Orange interventions achieve 55% cure rate
• C&I requires business viability assessment at all flag levels

CRE Non-Owner Occupied:
| Flag Level | Primary Intervention                    | Secondary                | Expected Outcome                |
|------------|-----------------------------------------|--------------------------|--------------------------------|
| Yellow     | Occupancy review, market assessment     | Rate discussion          | 85% remain Yellow              |
| Orange     | Modification negotiation, reserve increase| Equity injection request| 65% cure, 20% charge-off       |
| Red        | Note sale, foreclosure, deed-in-lieu    | Receiver                 | 40% recovery vs 30% full workout|

Consumer:
| Flag Level | Primary Intervention                | Secondary                   | Expected Outcome         |
|------------|-------------------------------------|-----------------------------|--------------------------|
| Yellow     | Proactive contact, payment review   | Hardship program info       | 80% remain Yellow        |
| Orange     | Formal modification offer           | Skip-a-pay, rate reduction  | 55% cure, 25% charge-off |
| Red        | Collection escalation, settlement   | Charge-off preparation      | 45% partial recovery     |

C&I:
| Flag Level | Primary Intervention                      | Secondary              | Expected Outcome         |
|------------|-------------------------------------------|------------------------|--------------------------|
| Yellow     | Business review, updated financials       | Covenant waiver discussion| 85% remain Yellow       |
| Orange     | Forbearance agreement, structure change   | Additional collateral  | 60% cure, 25% charge-off |
| Red        | Orderly liquidation support, ABL conversion| Bankruptcy monitoring | 35% recovery             |

MONITORING SYSTEM SPECIFICATIONS

Key Points:
• PD calculation and delinquency status require daily/real-time refresh
• Alert automation ensures timely escalation through email, SMS, and phone
• Dashboard requirements focus on watch list management and intervention tracking

Real-Time Monitoring Requirements:
| Capability                | Specification  | Priority |
|---------------------------|----------------|----------|
| PD calculation            | Daily refresh  | High     |
| Delinquency status        | Real-time      | High     |
| Score monitoring          | Weekly batch   | Medium   |
| Payment pattern analysis  | Daily          | Medium   |
| Collateral valuation      | Monthly        | Medium   |

Alert Automation Requirements:
| Alert Type          | Trigger        | Recipients                  | Delivery              |
|---------------------|----------------|-----------------------------|-----------------------|
| Yellow flag         | Auto-detection | RM, RM Manager              | Email + dashboard     |
| Orange flag         | Auto-detection | Credit Officer, Collections | Email + SMS           |
| Red flag            | Auto-detection | Special Assets, CCO         | Email + SMS + call    |
| Escalation reminder | 48hr no action | Manager +1 level            | Email                 |

Dashboard Requirements:
1. Watch list summary with aging
2. Flag distribution by segment/geography
3. Trend charts (new flags, cures, charge-offs)
4. RM portfolio heat maps
5. Intervention success metrics

PERFORMANCE MEASUREMENT FRAMEWORK

Key Points:
• Yellow flag intervention provides 6x ROI versus no intervention
• Target cure rates range from >30% (Red) to >80% (Yellow)
• Quarterly reporting to Credit Committee ensures accountability

Expected Intervention Success Rates:
| Flag Level | Target Cure Rate | Target Recovery Improvement   |
|------------|------------------|-------------------------------|
| Yellow     | >80%             | N/A (prevention)              |
| Orange     | >55%             | +25% vs no intervention       |
| Red        | >30%             | +15% vs no intervention       |

Cost-Benefit Analysis Framework (Per-Loan Economics Average):
| Scenario             | Expected Loss | Intervention Cost | Net Benefit |
|----------------------|---------------|-------------------|-------------|
| No intervention      | $85,000       | $0                | -$85,000    |
| Yellow intervention  | $12,000       | $2,000            | -$14,000    |
| Orange intervention  | $38,000       | $5,000            | -$43,000    |
| Red intervention     | $62,000       | $8,000            | -$70,000    |

The analysis demonstrates that Yellow flag intervention provides approximately 6x ROI versus no intervention, making early detection and response the most cost-effective strategy.

ROI Measurement Methodology:
1. Track cohorts by intervention type
2. Compare actual charge-off rates to predicted (no intervention)
3. Calculate avoided losses
4. Net against intervention costs
5. Report quarterly to Credit Committee

Success Metrics Dashboard:
| Metric                       | Target  | Current | Trend |
|------------------------------|---------|---------|-------|
| Yellow cure rate             | >80%    | TBD     | -     |
| Orange cure rate             | >55%    | TBD     | -     |
| Average days to intervention | <5      | TBD     | -     |
| False positive rate          | <20%    | TBD     | -     |
| Avoided charge-offs          | $XM/qtr | TBD     | -     |`,
    },
  }

  return mockReports[module]?.[reportType] ?? 'Report generation requires API configuration.'
}
