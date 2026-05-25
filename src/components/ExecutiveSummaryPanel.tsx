import { TrendingUp, Target, Award, ShieldAlert, Zap, BookOpen } from "lucide-react";

export default function ExecutiveSummaryPanel() {
  const problemStatementPoints = [
    "D2C margins are narrowing due to over-reliance on sitewide blanket discount schemes.",
    "Customer dilution: 35%+ of incoming shoppers are single-purchase trialists entering through markdowns with zero organic retention path.",
    "The 80/20 customer value dynamic: The top 10% represent over 42% of absolute margin, but receive identical marketing outreach to low-value deal hunters."
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="exec-summary-panel">
      {/* Executive Brief Boardroom Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 text-xs font-mono rounded-full uppercase tracking-wider">
            Consultech Strategic Briefing
          </div>
          <h1 className="text-3xl md:text-4xl font-sans font-bold tracking-tight">
            Decoding Customer Value
          </h1>
          <p className="text-slate-300 font-sans text-lg leading-relaxed">
            A SQL-Driven Retention Framework to optimize margin recovery, transition away from promotion reliance, and nurture highest-value cohorts for sustainable D2C brand equity.
          </p>
        </div>
      </div>

      {/* Grid: Executive Summary Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Briefing Sheet */}
        <div className="lg:col-span-2 space-y-8 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
          <div>
            <h2 className="text-2xl font-sans font-semibold text-slate-900 border-b border-slate-100 pb-3">
              One-Page Executive Core Summary
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-mono uppercase text-indigo-600 font-semibold tracking-wider">
                1. Problem Statement
              </h3>
              <p className="mt-2 text-slate-700 leading-relaxed font-sans text-sm">
                Like many hyper-growth D2C D2C fashion brands, our brand has trained customers to purchase exclusively during discount events, leading to severe margin drag, decreased Customer Lifetime Value (CLV), and high customer acquisition costs (CAC) that are unrecovered due to low repeat behavior. <strong>To survive, we must shift from a transaction-volume focus to a retention-value focus.</strong>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-mono uppercase text-indigo-600 font-semibold tracking-wider">
                2. Analytical Approach
              </h3>
              <p className="mt-2 text-slate-700 leading-relaxed font-sans text-sm">
                We engineered 10 core customer intelligence features (RFM metrics, consistency, region values, and discount dependency ratios) across transactional files containing hundreds of apparel and outerwear purchases. We executed rigorous database segmentations to partition organic brand loyalists from deal-opportunists, contrasting loyalty definitions to isolate true brand champions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-lg p-5">
              <div>
                <h4 className="text-xs font-mono text-slate-500 uppercase">Core Methodology</h4>
                <p className="text-sm font-sans font-medium text-slate-800 mt-1">Multi-Cohort RFM Profiling + Discount Behavior Correlation</p>
              </div>
              <div>
                <h4 className="text-xs font-mono text-slate-500 uppercase">Snapshot Date Context</h4>
                <p className="text-sm font-sans font-medium text-slate-800 mt-1">May 2026 Snapshot Analysis</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-mono uppercase text-indigo-600 font-semibold tracking-wider">
                3. Primary Strategic Findings
              </h3>
              <ul className="mt-2 space-y-2 text-slate-700 list-disc pl-5 font-sans text-sm">
                <li><strong>Extreme Loyalty Concentration:</strong> The top 10% customer segment represents ~45% of total revenue. Re-investing in this segment creates 4x larger returns than sitewide discounts.</li>
                <li><strong>The Markdown Trap:</strong> Over 35% of accounts are Promo Hunters with markdown dependency {`>`} 30%. Their average order ratings trend low (3.1/5), indicating low organic goodwill.</li>
                <li><strong>New Loyalists Incubators:</strong> A segment of recent shoppers (placed {`>`}2 orders within last 60 days) represents massive compounding value if nurtured immediately.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Financial Impact Board */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-sans font-semibold text-slate-900">
              Projected Strategic Return
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Estimated Consulting Target Impact (6-Month Horizon)</p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-2xl font-sans font-bold text-slate-900">+14.5%</span>
                <span className="block text-xs font-sans text-slate-600 font-normal">Gross Margin Recovery (Reduced generic markdowns)</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-2xl font-sans font-bold text-slate-900">+3.2x</span>
                <span className="block text-xs font-sans text-slate-600 font-normal">Increase in High-Value Loyalty Purchase Intervals</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-2xl font-sans font-bold text-slate-900">-22%</span>
                <span className="block text-xs font-sans text-slate-600 font-normal">Churn Reduction in Organic At-Risk VIPs</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-lg p-4 text-xs font-sans text-slate-600 leading-relaxed shadow-3xs">
            <strong>Mentor Strategic Verdict:</strong> Directing marketing efforts away from broad-spectrum discounting toward personalized triggers for high CLP segment recovers valuable margins.
          </div>
        </div>
      </div>

      {/* Boardroom Consulting Playbook */}
      <div className="space-y-6">
        <h2 className="text-2xl font-sans font-semibold text-slate-900">
          Boardroom Consulting Playbook
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Action 1: Sunset Promo */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 hover:border-slate-300 transition-colors shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-mono font-bold text-sm">
                P1
              </span>
              <span className="bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase">
                Promotions
              </span>
            </div>
            <div>
              <h4 className="font-sans font-bold text-slate-900 text-base">Promotional Sunset Plan</h4>
              <p className="text-slate-600 font-sans text-xs leading-relaxed mt-2">
                Replace margins-killing sitewide markdown banners with dynamic tiered coupons (e.g., spend $150 save $20) to maintain High AOV thresholds. Completely isolate "Promo Hunters" with segmented off-cycle clearance catalogs to protect core retail catalog prices.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 text-2xs font-mono text-slate-500">
              Impact: +8.5% Net Sales Margin
            </div>
          </div>

          {/* Action 2: VIP Nurture */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 hover:border-slate-300 transition-colors shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-mono font-bold text-sm">
                P2
              </span>
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase">
                Loyalty VIP
              </span>
            </div>
            <div>
              <h4 className="font-sans font-bold text-slate-900 text-base">HVC Nurture Program</h4>
              <p className="text-slate-600 font-sans text-xs leading-relaxed mt-2">
                Establish an exclusive, no-markdown "Platinum Atelier" invite cohort for top 10% customers. Focus purely on experience-based loyalty indicators (complimentary tailored fittings, initial access pre-order drops, personal fashion consults, zero shipping friction).
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 text-2xs font-mono text-slate-500">
              Impact: +28% CLV Expansion
            </div>
          </div>

          {/* Action 3: Reactivation Guide */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 hover:border-slate-300 transition-colors shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-mono font-bold text-sm">
                P3
              </span>
              <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase">
                Churn Rescue
              </span>
            </div>
            <div>
              <h4 className="font-sans font-bold text-slate-900 text-base">At-Risk Reactivation</h4>
              <p className="text-slate-600 font-sans text-xs leading-relaxed mt-2">
                Program automated email reminders linked directly to customer purchase consistency curves. Offer custom-tailored merchandise cross-sell suggestions (like Footwear suggestions for Apparel focus) rather than a coupon, targeted at 90-120 inactivation marks.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 text-2xs font-mono text-slate-500">
              Impact: 14% Churned Recoveries
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
