import React, { useState } from "react";
import { CustomerFeature, Transaction } from "../types";
import { engineerCustomerFeatures, ANALYSIS_DATE } from "../utils/dataEngine";
import { FileText, Award, Eye, Code, ChevronRight, HelpCircle, Flame } from "lucide-react";

interface FeatureEngineeringTabsProps {
  cleanData: Transaction[];
}

export default function FeatureEngineeringTabs({ cleanData }: FeatureEngineeringTabsProps) {
  const [selectedCustId, setSelectedCustId] = useState<string>("CUST_101");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewCode, setViewCode] = useState(false);

  const engineeredFeatures = engineerCustomerFeatures(cleanData);
  
  // Find customer features & raw txs
  const customerRecord = engineeredFeatures.find((f) => f.customer_id === selectedCustId) || engineeredFeatures[0];
  const customerTxs = cleanData
    .filter((t) => t.customer_id === (customerRecord?.customer_id || ""))
    .sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());

  // Definition lists
  const featureDefinitions = [
    {
      num: "01",
      name: "Recency",
      whyMatters: "Decisive driver in churn models. Older inactivity curves correspond to severe brand cooling off.",
      formula: "Days between modern snapshot date (2026-05-25) and customer's MAX(purchase_date).",
      interpretation: "Lower is better. Recency > 180 indicates dormant users requiring reactivation pushes.",
      pandasCode: `df_recency = (pd.to_datetime('${ANALYSIS_DATE}') - df.groupby('customer_id')['purchase_date'].max()).dt.days`
    },
    {
      num: "02",
      name: "Frequency",
      whyMatters: "Measures habituation, brand lock-in, and purchase cycle repetition.",
      formula: "COUNT(transaction_id) grouped by customer_id.",
      interpretation: "Higher is better. 1 = Trialist, 2 = Activator, 3-5 = Core Shopper, 6+ = loyal advocate.",
      pandasCode: `df_frequency = df.groupby('customer_id')['transaction_id'].count()`
    },
    {
      num: "03",
      name: "Monetary Value",
      whyMatters: "Direct cumulative cash conversion metric. Tells us who drives the D2C margin engine.",
      formula: "SUM(order_value) grouped by customer_id.",
      interpretation: "Top tiers fund overall stock development. High Monetary Value offsets high initial customer CAC.",
      pandasCode: `df_monetary = df.groupby('customer_id')['order_value'].sum()`
    },
    {
      num: "04",
      name: "Average Order Value (AOV)",
      whyMatters: "Reflects transaction basket density. Drives immediate shipping margin efficiency.",
      formula: "Monetary Value / Frequency.",
      interpretation: "Target growth via upsell bundles or cart triggers (spend $120 get free socks).",
      pandasCode: `df_aov = df_monetary / df_frequency`
    },
    {
      num: "05",
      name: "Discount Dependency Score",
      whyMatters: "Identifies margin leak. Isolates promo-vultures from full-price brand advocates.",
      formula: "SUM(discount_amount) / (SUM(order_value) + SUM(discount_amount)).",
      interpretation: "Score closer to 1 means the user strictly buys on markdown. Closer to 0 means organic catalog shopper.",
      pandasCode: `df_gross = df['order_value'] + df['discount_amount']\ndf_discount_dep = df.groupby('customer_id')['discount_amount'].sum() / df.groupby('customer_id').apply(lambda x: (x['order_value'] + x['discount_amount']).sum())`
    },
    {
      num: "06",
      name: "Category Diversity",
      whyMatters: "Indicates cross-selling depth. Higher diversity relates to a 60% higher retention probability.",
      formula: "COUNT(DISTINCT category) grouped by customer_id (integer 1-4).",
      interpretation: "Siloed buyers (only purchasing T-Shirts) churn faster than wardrobe brand loyalists.",
      pandasCode: `df_cat_diversity = df.groupby('customer_id')['category'].nunique()`
    },
    {
      num: "07",
      name: "Customer Lifetime Proxy (CLP)",
      whyMatters: "Consolidated scorecard summarizing long-term viability without complex parametric models.",
      formula: "Weighted blend of Recency Decay, normalized Frequency, and log Monetary.",
      interpretation: "Score based 1-100. Accounts with CLP > 75 are absolute VIP advocates.",
      pandasCode: `# Normalized weighted score blending normalized components\ndf_clp = (freq_norm * 40) + (spend_norm * 35) + (recency_norm * 25)`
    },
    {
      num: "08",
      name: "Purchase Consistency",
      whyMatters: "High consistency highlights strict calendar habitual cycles (predictable inventory demand).",
      formula: "1 / Coefficient of Variation of purchase intervals (stdev(intervals) / mean(intervals)).",
      interpretation: "90% is highly regular. 10% is chaotic, erratic, or single-purchase trialists.",
      pandasCode: `def get_consistency(grp):\n    intervals = grp['purchase_date'].sort_values().diff().dt.days.dropna()\n    return intervals.std() / intervals.mean()`
    },
    {
      num: "09",
      name: "Retention Probability Score",
      whyMatters: "Direct warning threshold for automated email flows before users completely churn.",
      formula: "e^(-Recency/150) * (Satisfying Rating Multiplier).",
      interpretation: "Retention < 35% should trigger standard off-cycle cross-group campaigns.",
      pandasCode: `import numpy as np\ndf_retention = np.exp(-df_recency / 150) * (avg_rating_multiplier)`
    },
    {
      num: "10",
      name: "Satisfaction Flag",
      whyMatters: "Measures overall voice of consumer (VoC) feedback quality to prevent low-score churn.",
      formula: "Averages survey ratings and maps to: High (4.5+), Medium (3.0-4.4), Low (<3.0), No Rating.",
      interpretation: "Low Satisfaction accounts flag severe logistics/sizing issues. Urgent customer service followups.",
      pandasCode: `df_sat_flag = pd.cut(df.groupby('customer_id')['rating'].mean(), bins=[0, 3, 4.5, 5], labels=['Low', 'Medium', 'High'])`
    }
  ];

  // Filtering list
  const filteredCustomers = engineeredFeatures.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return f.customer_id.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8 animate-fade-in" id="feature-engineering-panel">
      {/* Code Toggle Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-sans font-semibold text-slate-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            Customer Intelligence & Feature Engineering Logic (Python)
          </h2>
          <p className="text-slate-500 font-sans text-xs mt-1">
            Browse Python Pandas specifications for extracting 10 core customer metrics. Toggle between formulas and actual calculated data.
          </p>
        </div>

        <button
          onClick={() => setViewCode(!viewCode)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-mono text-xs rounded-lg shadow-sm transition-all cursor-pointer"
        >
          {viewCode ? "View Calculated Features Sheet" : "View Production Pandas Code"}
        </button>
      </div>

      {viewCode ? (
        /* Code Mode: Show beautiful pandas codes block */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {featureDefinitions.map((fd, fdIdx) => (
            <div key={fdIdx} className="bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-indigo-400 font-bold">{fd.num} / Feature: {fd.name}</span>
                  <span className="text-slate-500 font-mono">Python Code Block</span>
                </div>
                <div className="space-y-1 text-slate-300 font-sans">
                  <h4 className="text-sm font-semibold text-white">Why it matters:</h4>
                  <p className="text-2xs leading-relaxed text-slate-400">{fd.whyMatters}</p>
                </div>
                <div className="space-y-1 text-slate-300 font-sans">
                  <h4 className="text-xs font-semibold text-white">Formula:</h4>
                  <p className="text-2xs leading-relaxed font-mono text-indigo-300 bg-indigo-505 bg-slate-900 p-2 rounded">{fd.formula}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-900">
                <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900/60 p-3 rounded-lg overflow-x-auto select-all">
                  <code>{fd.pandasCode}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Data Mode: Show the interactive features table and customer inspector */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List of Customers */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-sans font-bold text-slate-900 text-sm uppercase tracking-wider text-indigo-600">
                Calculated Customer Features Sheet
              </h3>
              <input
                type="text"
                placeholder="Search CUST_ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs font-sans border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none w-48"
              />
            </div>

            <div className="overflow-x-auto max-h-120 border border-slate-100 rounded-lg">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-3xs uppercase tracking-wider sticky top-0 z-10">
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3 text-center">Recency</th>
                    <th className="px-4 py-3 text-center">Frequency</th>
                    <th className="px-4 py-3 text-right">Value (LTV)</th>
                    <th className="px-4 py-3 text-center">Promo Dep %</th>
                    <th className="px-4 py-3 text-center">Diverse</th>
                    <th className="px-4 py-3 text-center">CLP Score</th>
                    <th className="px-4 py-3 text-center">Ret. Prob.</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredCustomers.map((f, fIdx) => (
                    <tr
                      key={fIdx}
                      onClick={() => setSelectedCustId(f.customer_id)}
                      className={`cursor-pointer transition-colors ${selectedCustId === f.customer_id ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50/50"}`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-2xs">{f.customer_id}</td>
                      <td className="px-4 py-3 text-center font-mono text-2xs">{f.recency}d</td>
                      <td className="px-4 py-3 text-center font-bold">{f.frequency}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">${f.monetary_value.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center font-mono text-2xs">{(f.discount_dependency * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center">{f.category_diversity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-3xs font-mono font-bold ${f.clp_score >= 70 ? "bg-emerald-100 text-emerald-800" : f.clp_score < 30 ? "bg-slate-150 bg-slate-100 text-slate-600" : "bg-indigo-100 text-indigo-800"}`}>
                          {f.clp_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className={f.retention_prob >= 70 ? "text-emerald-600" : f.retention_prob < 40 ? "text-rose-500" : "text-amber-600"}>
                          {f.retention_prob}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${selectedCustId === f.customer_id ? "translate-x-1" : ""}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-3xs text-slate-400 font-mono pt-1 text-right">
              Showing {filteredCustomers.length} active customer profiles
            </div>
          </div>

          {/* Customer Profile Inspector Pane */}
          <div className="space-y-6">
            {customerRecord ? (
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/15 rounded-full blur-2xl"></div>
                
                {/* ID Header */}
                <div className="relative z-10 border-b border-slate-800 pb-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-3xs font-mono text-indigo-400 font-semibold tracking-widest uppercase">
                      Cohort Inspector
                    </span>
                    <span className={`inline-block px-2 py-0.5 text-4xs font-mono rounded font-bold uppercase ${customerRecord.clp_score >= 65 ? "bg-emerald-500/20 border border-emerald-400/20 text-emerald-300" : "bg-slate-700/50 text-slate-300"}`}>
                      {customerRecord.clp_score >= 65 ? "Advocate VIP" : "Standard Buyer"}
                    </span>
                  </div>
                  <h4 className="text-2xl font-sans font-bold tracking-tight text-white font-mono">
                    {customerRecord.customer_id}
                  </h4>
                </div>

                {/* KPI Feature breakdown */}
                <div className="grid grid-cols-2 gap-4 text-left relative z-10">
                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">1. Recency</span>
                    <span className="text-lg font-mono font-bold text-white mt-1 block">{customerRecord.recency} days</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">2. Frequency</span>
                    <span className="text-lg font-sans font-bold text-white mt-1 block">{customerRecord.frequency} orders</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">3. Total Spent</span>
                    <span className="text-lg font-sans font-bold text-emerald-400 mt-1 block">${customerRecord.monetary_value.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">4. AOV Basket</span>
                    <span className="text-lg font-sans font-bold text-white mt-1 block">${customerRecord.aov.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">5. Promo Dependency</span>
                    <span className="text-lg font-mono font-bold text-slate-300 mt-1 block">{(customerRecord.discount_dependency * 100).toFixed(1)}%</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">6. Category Diversity</span>
                    <span className="text-lg font-mono font-bold text-slate-300 mt-1 block">{customerRecord.category_diversity} distinct</span>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-800/40 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-slate-500 uppercase">8. Consistency Interval</span>
                    <span className="text-lg font-mono font-bold text-white mt-1 block">{customerRecord.purchase_consistency}%</span>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-lg">
                    <span className="block text-4xs font-mono text-indigo-400 uppercase">9. Ret. Probability</span>
                    <span className="text-lg font-mono font-bold text-indigo-300 mt-1 block">{customerRecord.retention_prob}%</span>
                  </div>
                </div>

                {/* VoC Survey Results */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1 relative z-10">
                  <span className="block text-4xs font-mono text-slate-500 uppercase">10. Voice of Consumer (VoC)</span>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-sans text-slate-300 font-medium">{customerRecord.satisfaction_flag}</span>
                    <span className="text-xs font-mono text-amber-500 font-bold">&#9733; Score Imputed</span>
                  </div>
                </div>

                {/* Sub Transactions Detail */}
                <div className="space-y-3 relative z-10">
                  <h5 className="text-[10px] font-mono text-indigo-400 font-bold tracking-wider uppercase border-b border-slate-800 pb-2">
                    Raw Purchasing Feed Logs ({customerTxs.length})
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {customerTxs.map((tx, txIdx) => (
                      <div key={txIdx} className="bg-slate-950 border border-slate-900 p-2.5 rounded text-4xs font-mono flex justify-between items-center text-slate-400 gap-2">
                        <div>
                          <span className="text-white block font-bold">{tx.transaction_id} | {tx.category}</span>
                          <span className="block text-slate-500">{tx.purchase_date}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 block font-bold">${tx.order_value.toFixed(2)}</span>
                          {tx.discount_amount > 0 && (
                            <span className="block text-rose-400/90 text-[9px] font-medium font-sans">Disc: ${tx.discount_amount.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 text-slate-400 rounded-xl p-8 border border-dashed border-slate-200 text-center text-xs font-medium">
                Select a customer row on the left to inspect their engineered features...
              </div>
            )}

            {/* Explainer Box */}
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl text-amber-900 text-xs font-sans space-y-2">
              <span className="font-bold flex items-center gap-1.5 leading-none">
                <Flame className="w-4 h-4 text-amber-600" />
                D2C CRM Warning System
              </span>
              <p className="text-2xs text-amber-800 leading-normal">
                If a buyer's <strong>Retention Probability Score (09)</strong> drops below 30%, they should be automatically exported from SQL and queued into Facebook/Instagram custom matched retargeting lists.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
