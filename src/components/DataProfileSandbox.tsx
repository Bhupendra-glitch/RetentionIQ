import React, { useState } from "react";
import { Transaction } from "../types";
import { profileDataset, DataProfileReport } from "../utils/dataEngine";
import { Database, AlertTriangle, Eye, RefreshCw, Sparkles, HelpCircle } from "lucide-react";

interface DataProfileSandboxProps {
  rawData: Transaction[];
  cleanData: Transaction[];
}

export default function DataProfileSandbox({ rawData, cleanData }: DataProfileSandboxProps) {
  const [dataState, setDataState] = useState<"raw" | "cleaned">("raw");
  const [activeData, setActiveData] = useState<Transaction[]>(rawData);
  const [searchTerm, setSearchTerm] = useState("");
  const [cleaningLogs, setCleaningLogs] = useState<string[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);

  // Sync state if props change (e.g., custom dataset uploaded or reset)
  React.useEffect(() => {
    setActiveData(dataState === "raw" ? rawData : cleanData);
  }, [rawData, cleanData, dataState]);

  const report: DataProfileReport = profileDataset(activeData);

  // Column metadata dictionary
  const columnsMeta = [
    { col: "transaction_id", type: "VARCHAR(50) / string", desc: "Unique transaction identifier; primary key index", nullAllowed: "No", insight: "Essential for matching and de-duplicating transactional rows." },
    { col: "customer_id", type: "VARCHAR(50) / string", desc: "Unique buyer ID; foreign key reference index", nullAllowed: "No", insight: "Allows cohorts grouping, tracking buyer recurrences, and aggregating CLV." },
    { col: "purchase_date", type: "DATE / string", desc: "ISO 8601 formatting (YYYY-MM-DD) timestamp of order", nullAllowed: "No", insight: "Crucial for calculating customer Recency (days inactive) and seasonal frequency curves." },
    { col: "order_value", type: "DECIMAL(10,2) / number", desc: "Net currency amount paid in USD for line-item merchandise", nullAllowed: "No", insight: "Direct metric for sales, average order value, and absolute revenue concentration." },
    { col: "category", type: "VARCHAR(100) / enum", desc: "D2C product group (Apparel, Footwear, Accessories, Outerwear)", nullAllowed: "No", insight: "Shows inventory preferences, crossover sales, and basket category diversity." },
    { col: "discount_amount", type: "DECIMAL(10,2) / number", desc: "Promotion value deducted in USD from initial retail MSRP", nullAllowed: "No", insight: "Identifies promo-dependency ratio. Crucial for measuring absolute margin preservation." },
    { col: "region", type: "VARCHAR(50) / enum", desc: "Geographic sales region (North, South, East, West)", nullAllowed: "No", insight: "Exposes distribution, localized hubs performance, and target physical marketing cohorts." },
    { col: "gender", type: "VARCHAR(50) / enum", desc: "Specified gender identity (Female, Male, Non-binary, Unspecified)", nullAllowed: "No", insight: "D2C styling targeting, inventory balancing, and specialized demographic focus." },
    { col: "rating", type: "INT / number", desc: "Post-purchase customer survey rating (integer 1 to 5 scale)", nullAllowed: "Yes (NULL representations)", insight: "Primary voice-of-customer index to compute churn probability and qualitative loyalty flags." }
  ];

  const handleCleanData = () => {
    setIsCleaning(true);
    setCleaningLogs(["[SYSTEM LOG] Starting D2C Database Cleaning Procedure...", "[PROCESS] Identification of transaction_id duplicates in raw buffer..."]);
    
    setTimeout(() => {
      // De-duplicate logs
      const duplicatesDetected = rawData.length - cleanData.length;
      setCleaningLogs((prev) => [
        ...prev,
        `[FOUND] Detected ${duplicatesDetected} database duplication failures.`,
        `[EXECUTE] Executed primary-key pruning. Purged redundant transaction rows.`,
        `[PROCESS] Analyzing missing 'rating' fields...`,
        `[FOUND] Detected missing feedback rating surveys.`
      ]);
    }, 800);

    setTimeout(() => {
      setCleaningLogs((prev) => [
        ...prev,
        `[EXECUTE] Imputing missing rating levels with neutral/median satisfaction base (4) or marking status 'Unrated' to preserve integrity.`,
        `[SUCCESS] Cleaning complete. Transaction block size aligned to ${cleanData.length} pristine entities.`,
        `[SYSTEM READY] Database features engineered correctly.`
      ]);
      setActiveData(cleanData);
      setDataState("cleaned");
      setIsCleaning(false);
    }, 1600);
  };

  const handleResetData = () => {
    setActiveData(rawData);
    setDataState("raw");
    setCleaningLogs([]);
  };

  // Filter table search
  const filteredRows = activeData.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.customer_id.toLowerCase().includes(term) ||
      r.transaction_id.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term) ||
      r.region.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in" id="data-profile-sandbox">
      {/* Sandbox Control Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-sans font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-505 text-indigo-600" />
            D2C Fashion Raw Transaction database & Profiling Sandbox
          </h2>
          <p className="text-slate-500 font-sans text-xs mt-1">
            Toggle, profile, clean, and impute raw transactional data below to examine database anomalies before engineering metrics.
          </p>
        </div>

        <div className="flex gap-3">
          {dataState === "raw" ? (
            <button
              id="btn-clean-data"
              onClick={handleCleanData}
              disabled={isCleaning}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-sans text-sm font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isCleaning ? "animate-spin" : ""}`} />
              Run Data Cleaning Pipeline
            </button>
          ) : (
            <button
              id="btn-reset-data"
              onClick={handleResetData}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans text-sm font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Reset to Raw Dataset
            </button>
          )}
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
          <span className="block text-2xs font-mono text-slate-500 uppercase">Buffer Block Size</span>
          <span className="block text-2xl font-sans font-bold text-slate-900 mt-1">{report.totalRows}</span>
          <span className="block text-3xs font-sans text-slate-500 mt-1 flex items-center gap-1">
            {dataState === "raw" ? (
              <span className="text-amber-600 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3 h-3" /> Includes repeats & missing
              </span>
            ) : (
              <span className="text-emerald-600 font-mono">✓ De-duplicated & Imputed</span>
            )}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
          <span className="block text-2xs font-mono text-slate-500 uppercase">D2C Customer Base</span>
          <span className="block text-2xl font-sans font-bold text-slate-900 mt-1">{report.uniqueCustomers}</span>
          <span className="block text-3xs text-slate-500 font-sans mt-1">Distinct buyer accounts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
          <span className="block text-2xs font-mono text-slate-500 uppercase">Gross Revenue (MSRP)</span>
          <span className="block text-2xl font-sans font-bold text-slate-900 mt-1">
            ${report.totalRevenueGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="block text-3xs text-indigo-600 font-sans mt-1">
            Net Cash: ${report.totalRevenueNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
          <span className="block text-2xs font-mono text-slate-500 uppercase">Anomalies Isolated</span>
          <span className="block text-2xl font-sans font-bold text-slate-900 mt-1 text-rose-600">
            {report.duplicateCount + report.missingRatingCount}
          </span>
          <span className="block text-3xs font-mono text-slate-500 mt-1">
            {report.duplicateCount} Dups | {report.missingRatingCount} Null survey
          </span>
        </div>
      </div>

      {cleaningLogs.length > 0 && (
        <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 shadow-sm max-w-full overflow-hidden">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="text-xs font-mono text-indigo-400 font-semibold tracking-wide">Cleaning Pipeline Simulation Console</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs text-slate-300 mt-3 max-h-40 overflow-y-auto">
            {cleaningLogs.map((log, lIdx) => (
              <div key={lIdx} className={log.startsWith("[SUCCESS]") ? "text-emerald-400" : log.startsWith("[FOUND]") || log.startsWith("[SYSTEM") ? "text-indigo-400" : "text-slate-300"}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Sandbox Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table View of Data (2 Columns) */}
        <div className="lg:col-span-2 space-y-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-sans font-bold text-slate-900 text-lg flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              Interactive Data Sheet
              <span className={`inline-block px-2 py-0.5 text-3xs uppercase font-mono tracking-wider rounded font-bold ${dataState === "raw" ? "bg-amber-100 border border-amber-200 text-amber-800" : "bg-emerald-100 border border-emerald-200 text-emerald-800"}`}>
                {dataState === "raw" ? "Raw Dataset Buffer" : "Cleaned Production Set"}
              </span>
            </h3>
            
            <input
              id="inp-data-search"
              type="text"
              placeholder="Filter by customer_id, category, region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs font-sans border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto max-h-96 border border-slate-100 rounded-lg">
            <table className="w-full text-left font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-3xs uppercase tracking-wider">
                  <th className="px-4 py-3">Txn ID</th>
                  <th className="px-4 py-3">Cust ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">AOV Value</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Disc. Value</th>
                  <th className="px-4 py-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-700">
                {filteredRows.slice(0, 50).map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/50 ${row.is_duplicate ? "bg-amber-50/70" : ""} ${row.rating === null ? "bg-rose-50/40" : ""}`}
                  >
                    <td className="px-4 py-2 font-mono text-2xs text-slate-900">
                      {row.transaction_id}
                      {row.is_duplicate && (
                        <span className="block text-4xs font-mono font-bold text-amber-700 uppercase">[DUP RECORD]</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-2xs text-slate-500">{row.customer_id}</td>
                    <td className="px-4 py-2 text-2xs">{row.purchase_date}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">${row.order_value.toFixed(2)}</td>
                    <td className="px-4 py-2 text-2xs">{row.category}</td>
                    <td className="px-4 py-2 text-2xs">{row.region}</td>
                    <td className="px-4 py-2 text-2xs text-slate-500">
                      {row.discount_amount > 0 ? `$${row.discount_amount.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-2 text-center text-2xs font-bold">
                      {row.rating === null ? (
                        <span className="text-rose-500 text-3xs font-mono bg-rose-50 px-1 py-0.5 rounded">NULL</span>
                      ) : (
                        <span className={row.rating >= 4 ? "text-emerald-600" : row.rating <= 2 ? "text-amber-500" : "text-slate-500"}>
                          {"★".repeat(row.rating)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center text-3xs text-slate-400 font-mono mt-2">
            <span>Showing first 50 transactions of {filteredRows.length} filtered records</span>
            {dataState === "raw" && (
              <span className="text-amber-600 font-medium">* Highlights indicate duplication data redundancy or missing scores</span>
            )}
          </div>
        </div>

        {/* Data Profile Explanations (1 Column) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-wider text-indigo-600 border-b border-indigo-50 pb-2">
              <Sparkles className="w-4 h-4" /> Issues & Cleaning Recommendations
            </h4>

            <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
              <div className="p-3 bg-amber-50/55 border border-amber-200/50 rounded-lg">
                <span className="font-bold text-amber-800 block">Duplicated Records Identified</span>
                <p className="mt-1 text-slate-600 text-2xs">
                  We isolated 12 rows sharing exact transaction keys generated by data scraping pipelines or manual network race retries in browser checkout logs.
                </p>
                <code className="block mt-1.5 font-mono text-[10px] bg-white p-1 rounded border border-amber-100 text-slate-700">
                  SQL: ROW_NUMBER() OVER (PARTITION BY transaction_id)
                </code>
              </div>

              <div className="p-3 bg-rose-50/55 border border-rose-250 border-rose-200 rounded-lg">
                <span className="font-bold text-rose-800 block">Missing Rating Imputation Strategy</span>
                <p className="mt-1 text-slate-600 text-2xs">
                  Surveys have 10%+ missing rates. Simply deleting these rows creates critical buyer bias (unhappy buyers or silent buyers skew averages). Our strategy imputes this by marking "No Rating" as a separate category, or replacing nulls with the regional median in calculated scores.
                </p>
                <code className="block mt-1.5 font-mono text-[10px] bg-white p-1 rounded border border-rose-100 text-slate-700">
                  SQL: COALESCE(rating, 4) -- imputed neutral
                </code>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-201/50 rounded-lg">
                <span className="font-bold text-slate-800 block">Clean-up Deliverable Recommendations</span>
                <ul className="list-disc pl-4 mt-1.5 text-slate-600 text-3xs space-y-1">
                  <li>Store all currency values in DECIMAL(10,2) to prevent float representation truncation errors in Python.</li>
                  <li>Bind customer_id to custom foreign key cascading schemas.</li>
                  <li>Establish check constraints ensuring rating is between [1, 5] and discount_amount is strictly less than order_value.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Column Explanations (Details Drawer layout) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          Column-by-Column Explanations & Target Schema Requirements
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-3xs uppercase tracking-wider">
                <th className="px-4 py-3">Column Name</th>
                <th className="px-4 py-3">Data Type Code</th>
                <th className="px-4 py-3">Allows Null</th>
                <th className="px-4 py-3">Business Logic Description</th>
                <th className="px-4 py-3">Potential Growth Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-600">
              {columnsMeta.map((c, cIdx) => (
                <tr key={cIdx} className="hover:bg-slate-50/40">
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900 text-2xs">{c.col}</td>
                  <td className="px-4 py-2.5 font-mono text-3xs text-slate-500 bg-slate-50/50">{c.type}</td>
                  <td className="px-4 py-2.5 font-mono text-2xs">{c.nullAllowed}</td>
                  <td className="px-4 py-2.5 text-2xs">{c.desc}</td>
                  <td className="px-4 py-2.5 italic text-slate-500 text-2xs leading-snug">{c.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
