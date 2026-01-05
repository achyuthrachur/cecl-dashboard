# CECL Monitoring Dashboard

A visually stunning, interactive CECL (Current Expected Credit Losses) monitoring dashboard for bank credit risk committees. Built with Next.js 14, React, and Tailwind CSS.

![CECL Dashboard](https://via.placeholder.com/800x400?text=CECL+Dashboard+Preview)

## Features

### 📊 Geographic Analysis
- Interactive US heat map showing PD, LGD, and EAD by state
- Click-to-drill-down for 5-year historical trends
- State-level metrics with segment breakdown

### 📈 Macroeconomic Correlations
- Credit metrics correlated with GDP, CPI, Unemployment, Interest Rates
- Segment-by-segment trend analysis
- FRED API integration for real-time economic data

### 🎯 Backtesting
- Compare predicted credit losses vs actual charge-offs
- MAE, RMSE, and accuracy metrics
- Quarterly variance analysis

### ⚠️ Pre-Charge-Off Analysis
- 36-month lookback on charged-off loans
- Early warning signal identification
- Cohort analysis by loan segment

### 🤖 AI-Powered Reports
- OpenAI integration for automated analysis
- Executive summaries, pattern analysis, recommendations
- Export to markdown/PDF

### 🔄 Demo Data Toggle
- View underlying synthetic data for any visualization
- CSV export functionality
- 5,000 synthetic loans across 8 segments

## Loan Segments

| Segment | PD Range | LGD Range |
|---------|----------|-----------|
| 1-4 Family Residential | 0.5-3% | 20-40% |
| CRE Non-Owner Occupied | 1-8% | 30-50% |
| CRE Owner Occupied | 1-6% | 25-45% |
| Commercial & Industrial | 2-10% | 40-60% |
| Consumer | 5-15% | 40-70% |
| Auto | 2-8% | 35-55% |
| Multifamily | 1-5% | 25-45% |
| Construction | 3-12% | 40-65% |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Maps**: react-simple-maps + D3
- **Theme**: next-themes (dark/light mode)
- **AI**: OpenAI API
- **Macro Data**: FRED API
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/achyuthrachur/cecl-dashboard.git
cd cecl-dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API keys to .env.local
# OPENAI_API_KEY=sk-...
# FRED_API_KEY=...

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI reports | Optional* |
| `FRED_API_KEY` | FRED API key for macro data | Optional* |

*The app works with synthetic/mock data if API keys are not provided.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/achyuthrachur/cecl-dashboard)

1. Click the button above or import the repository in Vercel
2. Add your environment variables in the Vercel dashboard
3. Deploy!

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Dashboard overview
│   ├── geographic/        # Heat map module
│   ├── macro/             # Macro correlations
│   ├── backtesting/       # Model validation
│   ├── pre-chargeoff/     # Warning signals
│   └── reports/           # AI report generator
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Sidebar, Header, Theme
│   ├── maps/              # Heat map components
│   ├── charts/            # Chart components
│   └── data-viewer/       # Data preview sheet
├── data/                   # Synthetic data generators
├── lib/                    # Utilities (AI, FRED, colors)
└── types/                  # TypeScript interfaces
```

## Screenshots

### Dark Mode
![Dark Mode](https://via.placeholder.com/400x250?text=Dark+Mode)

### Light Mode
![Light Mode](https://via.placeholder.com/400x250?text=Light+Mode)

## License

MIT License - feel free to use this for your own CECL monitoring needs.

## Disclaimer

This dashboard uses **synthetic data** for demonstration purposes. The PD, LGD, and EAD values are generated to reflect realistic ranges based on industry research but do not represent actual loan portfolios. Always consult with your risk management and accounting teams for actual CECL implementations.

---

Built with ❤️ for bank risk committees everywhere.
