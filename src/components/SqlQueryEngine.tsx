import React, { useState } from "react";
import { Transaction, CustomerFeature, SQLQueryResult } from "../types";
import { runSimulatedSQL } from "../utils/dataEngine";
import { Terminal, Play, CheckCircle, Cpu, FileCheck, HelpCircle, BarChart3, ListCollapse } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface SqlQueryEngineProps {
  cleanData: Transaction[];
  engineeredFeatures: CustomerFeature[];
}

interface QueryItem {
  id: string;
  title: string;
  query: string;
  logic: string;
  insight: string;
}

export default function SqlQueryEngine({ cleanData, engineeredFeatures }: SqlQueryEngineProps) {
  const [selectedId, setSelectedId] = useState<string>("sql_high_value_loyal");
  const [consoleResult, setConsoleResult] = useState<SQLQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // 1-8 requested SQL scripts list
  const queries: QueryItem[] = [
    {
      id: "sql_high_value_loyal",
      title: "1. High-Value Loyal Customers",
      logic: "Filters customers with 5 or more orders and total purchase spent exceeding $600 USD.",
      insight: "Identifies core brand patrons who drive long-term profit margins. Excellent cohort to enroll in VIP beta drops.",
      query: `SELECT \n  customer_id,\n  COUNT(transaction_id) AS total_orders,\n  SUM(order_value) AS total_spent,\n  ROUND(AVG(order_value), 2) AS avg_order_value,\n  ROUND(SUM(discount_amount) / (SUM(order_value) + SUM(discount_amount)) * 100, 1) AS discount_dependency\nFROM transactions\nGROUP BY customer_id\nHAVING COUNT(transaction_id) >= 5 AND SUM(order_value) >= 600\nORDER BY total_spent DESC;`
    },
    {
      id: "sql_discount_dependent",
      title: "2. Discount-Dependent Customers",
      logic: "Filters accounts with 2 or more orders where the cumulative discount is over 20% of net and discount combined gross revenue.",
      insight: "Highlights discount vultures. They provide scale but erode structural margins unless routed into off-season clearance pools.",
      query: `SELECT \n  customer_id,\n  COUNT(transaction_id) AS total_orders,\n  SUM(order_value) AS net_revenue_spent,\n  ROUND(SUM(discount_amount) / (SUM(order_value) + SUM(discount_amount)) * 100, 1) AS promo_dependency\nFROM transactions\nGROUP BY customer_id\nHAVING COUNT(transaction_id) >= 2 \n  AND (SUM(discount_amount) / (SUM(order_value) + SUM(discount_amount))) >= 0.20\nORDER BY promo_dependency DESC;`
    },
    {
      id: "sql_at_risk",
      title: "3. At-Risk Customers",
      logic: "Extracts customer cohorts who have not transacted in over 120 days based on fixed date snapshot bounds.",
      insight: "Identifies cooling segments requiring immediate triggered reminder sequences containing personalized catalog offerings.",
      query: `SELECT \n  customer_id,\n  DATE_PART('day', '2026-05-25'::timestamp - MAX(purchase_date)::timestamp) AS days_inactive,\n  SUM(order_value) AS total_spent,\n  COUNT(transaction_id) AS total_orders,\n  ROUND(AVG(rating), 1) AS avg_rating\nFROM transactions\nGROUP BY customer_id\nHAVING DATE_PART('day', '2026-05-25'::timestamp - MAX(purchase_date)::timestamp) >= 120\nORDER BY days_inactive DESC;`
    },
    {
      id: "sql_new_potential_loyalists",
      title: "4. New Potential Loyalists",
      logic: "Selects recent acquisitions (transacted in last 60 days) with exactly 2 to 3 orders and positive review feedback profiles.",
      insight: "Indicates rapid engagement. Critical cohort for high-retention onboarding drip emails.",
      query: `SELECT \n  customer_id,\n  DATE_PART('day', '2026-05-25'::timestamp - MAX(purchase_date)::timestamp) AS days_inactive,\n  COUNT(transaction_id) AS total_orders,\n  SUM(order_value) AS net_revenue_spent,\n  ROUND(AVG(rating), 1) AS avg_rating\nFROM transactions\nGROUP BY customer_id\nHAVING DATE_PART('day', '2026-05-25'::timestamp - MAX(purchase_date)::timestamp) <= 60 \n  AND COUNT(transaction_id) BETWEEN 2 AND 3\n  AND (AVG(rating) >= 3.0 OR AVG(rating) IS NULL)\nORDER BY net_revenue_spent DESC;`
    },
    {
      id: "sql_region_wise_value",
      title: "5. Region-wise Customer Value",
      logic: "Rolls up order volumes, net sales revenue, customer lifespans, and promo rates by customer regions.",
      insight: "Directs geographic ad-budget spends and brick-and-mortar storefront considerations.",
      query: `SELECT \n  region,\n  COUNT(DISTINCT customer_id) AS customer_cohort,\n  COUNT(transaction_id) AS order_count,\n  ROUND(SUM(order_value), 2) AS net_revenue_usd,\n  ROUND(SUM(order_value) / COUNT(DISTINCT customer_id), 2) AS average_customer_lifetime_value\nFROM transactions\nGROUP BY region\nORDER BY net_revenue_usd DESC;`
    },
    {
      id: "sql_category_based_segmentation",
      title: "6. Category-based Segmentation",
      logic: "Aggregates revenue, average order unit rates, and customer counts clustered by products/categories.",
      insight: "Guides inventory pre-buy targets and categoric styling promotions in newsletters.",
      query: `SELECT \n  category AS category_group,\n  COUNT(transaction_id) AS total_orders,\n  ROUND(SUM(order_value), 2) AS total_revenue_usd,\n  ROUND(AVG(order_value), 2) AS avg_unit_retail\nFROM transactions\nGROUP BY category\nORDER BY total_revenue_usd DESC;`
    },
    {
      id: "sql_repeat_purchase",
      title: "7. Repeat Purchase Analysis",
      logic: "Classifies distinct buy indices as trialists (1 buy) versus repeat advocates (2+ buys) and prints segment sizing.",
      insight: "Exposes the leaking bucket ratio. High single-buyer percentage flags failure in onboarding quality.",
      query: `WITH customer_orders AS (\n  SELECT customer_id, COUNT(transaction_id) AS order_count\n  FROM transactions\n  GROUP BY customer_id\n)\nSELECT \n  CASE WHEN order_count = 1 THEN 'Single-Buyers (One-time Trialists)'\n       ELSE 'Repeat Buyers (Loyalty cohort)'\n  END AS cohort_classification,\n  COUNT(customer_id) AS customer_count,\n  ROUND(COUNT(customer_id) * 100.0 / (SELECT COUNT(DISTINCT customer_id) FROM transactions), 1) AS percentage_share\nFROM customer_orders\nGROUP BY 1;`
    },
    {
      id: "sql_revenue_concentration",
      title: "8. Revenue Concentration Analysis",
      logic: "Tiers accounts using spend deciles, proving concentration percentages inside the customer base.",
      insight: "Proves or disproves the 80/20 customer concentration. Crucial for steering senior budget boards.",
      query: `WITH customer_revenue AS (\n  SELECT customer_id, SUM(order_value) AS total_spent,\n         NTILE(10) OVER (ORDER BY SUM(order_value) DESC) AS spend_decile\n  FROM transactions\n  GROUP BY customer_id\n)\nSELECT \n  CASE WHEN spend_decile = 1 THEN 'Top 10% Spend VIPs'\n       WHEN spend_decile BETWEEN 2 AND 3 THEN 'Top 10-30% Key Contributors'\n       WHEN spend_decile BETWEEN 4 AND 6 THEN 'Top 30-60% Baseline Shoppers'\n       ELSE 'Remaining Long Tail'\n  END AS customer_tier,\n  COUNT(customer_id) AS accounts_count,\n  ROUND(SUM(total_spent), 2) AS revenue_contribution_usd\nFROM customer_revenue\nGROUP BY 1\nORDER BY revenue_contribution_usd DESC;`
    }
  ];

  const currentQueryItem = queries.find((q) => q.id === selectedId) || queries[0];

  const handleExecuteQuery = () => {
    setIsExecuting(true);
    setLogs([
      `[DATABASE] Initializing PostgreSQL-Sim V14 Connection...`,
      `[PARSER] Directing execution sequence for query: ${currentQueryItem.id}...`,
      `[EXECUTE] Query optimization active...`
    ]);

    setTimeout(() => {
      const res = runSimulatedSQL(currentQueryItem.id, cleanData, engineeredFeatures);
      setConsoleResult(res);
      setLogs((prev) => [
        ...prev,
        `[SUCCESS] Queried successfully. Isolated ${res.rows.length} rows inside buffer memory.`,
        `[RENDER] Mapping metrics onto visual canvas...`
      ]);
      setIsExecuting(false);
    }, 900);
  };

  // Convert row data to simple recharts-friendly formatting
  const getChartData = () => {
    if (!consoleResult) return [];
    
    // Choose columns for rendering depending on standard keys
    const xKey = consoleResult.columns[0];
    const yKey = consoleResult.columns[2] || consoleResult.columns[1]; // Spent or counts

    return consoleResult.rows.map((row) => {
      let absoluteVal = 0;
      const rawVal = row[yKey];
      if (typeof rawVal === "string") {
        absoluteVal = parseFloat(rawVal.replace("%", ""));
      } else if (typeof rawVal === "number") {
        absoluteVal = rawVal;
      }
      return {
        name: row[xKey],
        value: absoluteVal,
        labelName: `${yKey.replace(/_/g, " ").toUpperCase()}`
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="space-y-8 animate-fade-in" id="sql-query-panel">
      {/* Selector and Console Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Selector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-1">
            <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">
              Query Portfolio File
            </h4>
            <p className="text-3xs text-slate-500 font-sans">
              Choose an industry standard transactional query template to edit and run.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-3xs space-y-1 text-xs">
            {queries.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedId(q.id);
                  setConsoleResult(null);
                  setLogs([]);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-sans font-medium transition-colors flex items-center justify-between gap-1 cursor-pointer ${selectedId === q.id ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <span>{q.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-2xs font-sans text-amber-900 space-y-2">
            <span className="font-bold flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              SQL Code standards
            </span>
            <p className="text-amber-800 leading-relaxed">
              Queries are optimized to run on standard modern warehouse structures including Snowflake, BigQuery, AWS Redshift, or PostgreSQL databases.
            </p>
          </div>
        </div>

        {/* Main Editor & Console (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[520px]">
            {/* Header Terminal bar */}
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-xs text-slate-300 font-bold">SQL Execution Console Sandbox</span>
              </div>
              <button
                id="btn-sql-run"
                onClick={handleExecuteQuery}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-mono text-2xs font-bold rounded shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                Run In-Memory Query
              </button>
            </div>

            {/* SQL Code Block */}
            <div className="p-6 flex-1 overflow-y-auto select-all text-left">
              <pre className="text-indigo-200 font-mono text-xs leading-relaxed select-all">
                <code>{currentQueryItem.query}</code>
              </pre>
            </div>

            {/* Explanation row */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 font-sans text-2xs text-slate-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-mono font-bold text-indigo-400 block uppercase">Query Logic Description:</span>
                  <p className="text-slate-300 mt-1 leading-normal">{currentQueryItem.logic}</p>
                </div>
                <div>
                  <span className="font-mono font-bold text-indigo-400 block uppercase">Expected Strategic Metric Insight:</span>
                  <p className="text-slate-300 mt-1 leading-normal">{currentQueryItem.insight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Console Output Block */}
          {(consoleResult || logs.length > 0) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-wider text-indigo-600">
                <Cpu className="w-4 h-4 text-indigo-505" />
                Database Query Results Table
              </h4>

              {isExecuting ? (
                <div className="space-y-2 py-4">
                  {logs.map((log, lIdx) => (
                    <div key={lIdx} className="font-mono text-2xs text-slate-500">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                consoleResult && (
                  <div className="space-y-6">
                    {/* Render visual bar chart of SQL findings */}
                    {chartData.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <h5 className="text-2xs font-mono font-bold uppercase tracking-wider text-slate-500 pb-2 mb-4 border-b border-slate-100 text-center">
                          Visualizer output modeled from query records ({chartData[0]?.labelName || "Metrics"})
                        </h5>
                        <div className="h-56 w-full text-xs">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="name" stroke="#64748B" tickLine={false} />
                              <YAxis stroke="#64748B" tickLine={false} />
                              <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.05)" }} />
                              <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Output Table */}
                    <div className="overflow-x-auto max-h-72 border border-slate-100 rounded-lg">
                      <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-3xs uppercase tracking-wider select-none">
                            {consoleResult.columns.map((col, cIdx) => (
                              <th key={cIdx} className="px-4 py-3">
                                {col.replace(/_/g, " ")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {consoleResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50">
                              {consoleResult.columns.map((col, cIdx) => {
                                const val = row[col];
                                const isId = col.includes("id");
                                return (
                                  <td
                                    key={cIdx}
                                    className={`px-4 py-2 md:py-3 ${isId ? "font-mono font-bold text-2xs text-slate-900" : ""} ${col.includes("spent") || col.includes("value") || col.includes("revenue") ? "font-semibold text-slate-800" : ""}`}
                                  >
                                    {typeof val === "number" && (col.includes("spent") || col.includes("value") || col.includes("revenue") || col.includes("lifetime"))
                                      ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
