import React from "react";
import { CustomerFeature } from "../types";
import { DollarSign, ShieldAlert, Sparkles, AlertCircle, Percent } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PromoDependencyInspectorProps {
  features: CustomerFeature[];
}

export default function PromoDependencyInspector({ features }: PromoDependencyInspectorProps) {
  // Categorize customer features into promo cohorts:
  // 1. Promo Hunters: Discount dependency >= 25% of total value
  // 2. Hybrid Buyers: Discount dependency between 5% and 25%
  // 3. Full-Price Advocates: Discount dependency < 5%
  const cohorts = features.reduce(
    (acc, f) => {
      if (f.discount_dependency >= 0.25) {
        acc.promoOnly.count++;
        acc.promoOnly.revenue += f.monetary_value;
      } else if (f.discount_dependency >= 0.05) {
        acc.hybrid.count++;
        acc.hybrid.revenue += f.monetary_value;
      } else {
        acc.fullPrice.count++;
        acc.fullPrice.revenue += f.monetary_value;
      }
      return acc;
    },
    {
      promoOnly: { count: 0, revenue: 0 },
      hybrid: { count: 0, revenue: 0 },
      fullPrice: { count: 0, revenue: 0 }
    }
  );

  const totalSpent = features.reduce((sum, f) => sum + f.monetary_value, 0);

  const pieData = [
    { name: "Full-Price Advocates (Organic)", count: cohorts.fullPrice.count, value: parseFloat(cohorts.fullPrice.revenue.toFixed(2)), color: "#059669" },
    { name: "Hybrid Shoppers (Opportunistic)", count: cohorts.hybrid.count, value: parseFloat(cohorts.hybrid.revenue.toFixed(2)), color: "#4F46E5" },
    { name: "Promo Hunters (Margin Risk)", count: cohorts.promoOnly.count, value: parseFloat(cohorts.promoOnly.revenue.toFixed(2)), color: "#EF4444" }
  ];

  const pythonSnippet = `import pandas as pd\n\n# Classify D2C customers based on markdown dependency ratios\ndef segment_markdown_dependency(row):\n    if row['discount_dependency'] >= 0.25:\n        return 'High-Promo Risk'\n    elif row['discount_dependency'] >= 0.05:\n        return 'Hybrid-Opportunist'\n    else:\n        return 'Core Full-Price'\n\ndf_features['promo_segment'] = df_features.apply(segment_markdown_dependency, axis=1)\nprint(df_features.groupby('promo_segment')['monetary_value'].agg(['count', 'sum', 'mean']))`;

  const sqlSnippet = `-- PostgreSQL: Expose absolute dependancy of cashflow on markdown codes\nSELECT \n  CASE \n    WHEN (SUM(discount_amount)/(SUM(order_value)+SUM(discount_amount))) >= 0.25 THEN '1. Promo-Only Risk'\n    WHEN (SUM(discount_amount)/(SUM(order_value)+SUM(discount_amount))) >= 0.05 THEN '2. Hybrid-Opportunist'\n    ELSE '3. Core Full-Price'\n  END as markdown_cohort,\n  COUNT(DISTINCT customer_id) as customer_accounts,\n  ROUND(SUM(order_value), 2) as aggregated_revenue_net\nFROM transactions\nGROUP BY 1\nORDER BY aggregated_revenue_net DESC;`;

  return (
    <div className="space-y-8 animate-fade-in" id="promo-dependency-panel">
      {/* Overview Block */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
          <Percent className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-left">
          <h4 className="font-sans font-bold text-slate-900 text-base">Promotional Dependency and Margin Risk Analytics</h4>
          <p className="text-slate-500 font-sans text-xs">
            Expose absolute Cashflow exposure to promotions, identifying customers who only purchase on heavy discounts.
          </p>
        </div>
      </div>

      {/* Pie Chart and Cohorts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Visual Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider text-indigo-650">
              Cashflow Contribution by Promo Cohort
            </h4>
            <p className="text-3xs text-slate-500 font-sans mt-0.5">
              Which customer cohort is funding our active margins?
            </p>
          </div>

          <div className="h-56 w-full text-xs flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-3xs font-sans text-slate-600 space-y-1 text-center">
            <strong>Analyst Note:</strong> In D2C retail, a high-performing brand retains full-price revenue above 50% of aggregate cash-flow. Anything lower indicates broad markdown dilution.
          </div>
        </div>

        {/* Breakdown details */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6 text-left">
          <div>
            <h4 className="font-sans font-bold text-slate-900 text-base">Cohort Classification Methodology</h4>
            <p className="text-2xs text-slate-500 font-sans mt-0.5">Three clear categories to monitor in database schemas:</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-start border-l-4 border-emerald-500 pl-3">
              <div>
                <span className="font-sans font-bold text-slate-900 text-xs">1. Full-Price Advocates (Organic)</span>
                <p className="text-3xs text-slate-500 mt-1">
                  Customers purchasing less than 5% on markdown. They represent {cohorts.fullPrice.count} accounts generating ${cohorts.fullPrice.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} net USD. Highly valuable brand loyalists.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-l-4 border-indigo-500 pl-3">
              <div>
                <span className="font-sans font-bold text-slate-900 text-xs">2. Hybrid Shoppers (Opportunistic)</span>
                <p className="text-3xs text-slate-500 mt-1">
                  Purchase high-ticket new collection catalogs, but capitalize on occasional off-season codes. Counts {cohorts.hybrid.count} accounts yielding ${cohorts.hybrid.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-l-4 border-rose-500 pl-3">
              <div>
                <span className="font-sans font-bold text-slate-900 text-xs">3. Promo Hunters (Margin Risk)</span>
                <p className="text-3xs text-slate-500 mt-1">
                  Extreme high-risk markdown segment. Will not buy unless offered a direct discount ({`>`}25% of gross basket). Identifies {cohorts.promoOnly.count} accounts with ${cohorts.promoOnly.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} absolute revenue spent.
                </p>
              </div>
            </div>
          </div>

          {/* Warning banner */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-2xs flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="leading-snug">
              <strong>Critical Risk:</strong> Our brand's promo hunters generate substantial sales volume but result in negative net-margins when factoring in high storage and logistics overheads. Sunset sitewide discount codes instantly.
            </p>
          </div>
        </div>

      </div>

      {/* Python vs SQL snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Python Snippet */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-indigo-400 font-bold">Pandas Analysis Segmenter</span>
            <span className="text-slate-500 font-mono">Python Script</span>
          </div>
          <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-3 rounded overflow-x-auto select-all h-60 text-left">
            <code>{pythonSnippet}</code>
          </pre>
        </div>

        {/* SQL Snippet */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-indigo-400 font-bold">PostgreSQL Cohort Sizer</span>
            <span className="text-slate-500 font-mono">SQL Script</span>
          </div>
          <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-3 rounded overflow-x-auto select-all h-60 text-left">
            <code>{sqlSnippet}</code>
          </pre>
        </div>

      </div>
    </div>
  );
}
