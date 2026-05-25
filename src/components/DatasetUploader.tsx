import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, RefreshCw, HelpCircle, ArrowRight, Table, Sparkles, BookOpen } from "lucide-react";
import { analyzeAndParseCSV, parseCSVLine, UploadedDataAnalysis } from "../utils/csvParser";
import { Transaction } from "../types";

interface DatasetUploaderProps {
  onDatasetActivated: (parsedData: Transaction[], cleanData: Transaction[], analysis: UploadedDataAnalysis) => void;
  onDatasetReset: () => void;
  activeAnalysis: UploadedDataAnalysis | null;
}

export default function DatasetUploader({ onDatasetActivated, onDatasetReset, activeAnalysis }: DatasetUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [csvPasteText, setCsvPasteText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [errorMess, setErrorMess] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<UploadedDataAnalysis | null>(activeAnalysis);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample D2C CSV Template that users can copy to test
  const csvTemplate = `transaction_id,customer_id,purchase_date,order_value,category,discount_amount,region,gender,rating
TXN_S1,CUST_S101,2026-05-10,120.50,Apparel,15.00,North,Female,5
TXN_S2,CUST_S102,2026-05-12,85.00,Footwear,0.00,South,Male,
TXN_S3,CUST_S101,2026-05-14,210.00,Accessories,45.00,North,Female,4
TXN_S4,CUST_S103,2026-05-15,45.00,Outerwear,10.00,East,Non-binary,2
TXN_S5,CUST_S102,2026-05-18,95.00,Apparel,0.00,South,Male,5
TXN_S5,CUST_S102,2026-05-18,95.00,Apparel,0.00,South,Male,5
TXN_S7,CUST_S104,2026-05-20,310.00,Outerwear,0.00,West,Unspecified,3`;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMess(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMess(null);
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("Could not parse file content. File appears empty.");
        
        const analysis = analyzeAndParseCSV(text, file.name);
        setCurrentAnalysis(analysis);
      } catch (err: any) {
        setErrorMess(err.message || "An error occurred while parsing the CSV. Ensure headers match columns.");
      }
    };
    reader.readAsText(file);
  };

  const processPastedText = () => {
    setErrorMess(null);
    if (!csvPasteText.trim()) {
      setErrorMess("Please paste some valid CSV contents first.");
      return;
    }
    try {
      const analysis = analyzeAndParseCSV(csvPasteText, "pasted_transactions.csv");
      setCurrentAnalysis(analysis);
    } catch (err: any) {
      setErrorMess(err.message || "Could not parse pasted data. Ensure header labels are in the first row.");
    }
  };

  const handleLoadTemplate = () => {
    setCsvPasteText(csvTemplate);
    setShowPasteBox(true);
    setErrorMess(null);
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const activateDataset = () => {
    if (currentAnalysis) {
      onDatasetActivated(
        currentAnalysis.parsedTransactions,
        currentAnalysis.cleanTransactions,
        currentAnalysis
      );
    }
  };

  const resetDatasetToDefault = () => {
    setCurrentAnalysis(null);
    setCsvPasteText("");
    onDatasetReset();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden" id="dataset-uploader-box">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/60 select-none">
        <div>
          <h2 className="text-base font-sans font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Active Transaction Dataset Selection
          </h2>
          <p className="text-slate-500 font-sans text-2xs mt-1">
            Toggle between the fallback synthetic D2C Fashion sample database or upload custom checkout records to audit.
          </p>
        </div>
        <div className="flex gap-2">
          {activeAnalysis ? (
            <button
              onClick={resetDatasetToDefault}
              className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-3xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reset to Synthetic D2C Data
            </button>
          ) : (
            <button
              onClick={handleLoadTemplate}
              className="px-3 py-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/50 rounded-lg transition-all cursor-pointer"
            >
              Load Demo CSV Template
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* No active uploaded dataset state - show dropzone */}
        {!currentAnalysis && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-48 cursor-pointer ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/20"
                  : "border-slate-205 border-slate-200 hover:border-slate-350 hover:bg-slate-50/30"
              }`}
              onClick={handleSelectFileClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 shadow-3xs">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">
                Drag and Drop Customer Transactions CSV File here
              </h3>
              <p className="text-slate-500 font-sans text-xs mt-1 max-w-sm">
                Supports column parsing, automatic alias tracking, and duplicates removal logic. Standard size up to 10MB.
              </p>
              <button
                type="button"
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
              >
                Or Select File
              </button>
            </div>

            {/* Paste or load template widget */}
            <div className="text-center">
              <span className="text-3xs font-mono text-slate-400">OR</span>
            </div>

            <div className="border border-slate-100 rounded-lg bg-slate-50/40 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-slate-400" />
                  Paste CSV Raw text
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  {showPasteBox ? "Hide Paste Field" : "Paste raw spreadsheet values Instead"}
                </button>
              </div>

              {showPasteBox && (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    className="w-full font-mono text-[10px] p-3 text-slate-750 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="transaction_id,customer_id,purchase_date,order_value,category,discount_amount,region,gender,rating..."
                    value={csvPasteText}
                    onChange={(e) => setCsvPasteText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={processPastedText}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer"
                    >
                      Parse pasted data
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvPasteText(csvTemplate)}
                      className="px-3 py-1.5 text-xs border border-slate-200 hover:bg-slate-50 rounded-lg transition-all cursor-pointer text-slate-600"
                    >
                      Fill sample dataset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errorMess && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2 animate-fade-in font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMess}</span>
              </div>
            )}
          </div>
        )}

        {/* Loaded / Audited CSV report details */}
        {currentAnalysis && (
          <div className="space-y-6 animate-fade-in">
            {/* Success title card and Actions */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-150 bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    "{currentAnalysis.filename}" Audited & Mapped Successfully
                  </h4>
                  <p className="text-2xs text-slate-500 font-sans mt-0.5">
                    Parsed {currentAnalysis.rowCount} rows of raw transaction blocks.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentAnalysis(null);
                    setErrorMess(null);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all cursor-pointer"
                >
                  Discard / Select other
                </button>
                {activeAnalysis?.filename !== currentAnalysis.filename && (
                  <button
                    type="button"
                    onClick={activateDataset}
                    className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Activate Custom Dataset
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Answer 1: What each column means & header mappings */}
            <div className="space-y-3 bg-slate-50/40 p-5 rounded-xl border border-slate-100">
              <h3 className="text-xs font-mono uppercase text-indigo-700 font-bold tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                1. MAPPED HEADERS & COLUMN MEANINGS
              </h3>
              <p className="text-2xs text-slate-500 font-sans">
                Our database automatically scans CSV headers and binds discovered columns to key customer retention metrics. Here is how your file mapped:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { key: "transaction_id", desc: "Unique Order ID; primary record key used for transaction de-duplication." },
                  { key: "customer_id", desc: "Buyer ID; allows grouped aggregates like repeat purchase intervals over a year." },
                  { key: "purchase_date", desc: "Order timestamp; used to compute Customer Recency (days inactive)." },
                  { key: "order_value", desc: "Net shopping basket cash spent; used to calculate aggregate AOV." },
                  { key: "category", desc: "Product group segment; measures customer catalog cross-buying diversity." },
                  { key: "discount_amount", desc: "Markdown value subtracted; identifies promotional reliance score." },
                  { key: "region", desc: "Regional classification; compares localized customer concentration pools." },
                  { key: "gender", desc: "Gender; is mapped to localized target demographics catalog trends." },
                  { key: "rating", desc: "Post-purchase customer rating integer (1-5); drives retention satisfaction decay indicators." }
                ].map((col) => {
                  const found = currentAnalysis.columnsFound[col.key];
                  return (
                    <div key={col.key} className="bg-white border rounded-lg p-3 space-y-1 shadow-3xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 text-[10px] uppercase truncate">{col.key}</span>
                        {found ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-28">
                            Mapped: "{found.original}"
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase truncate">
                            AUTO-COERCED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{col.desc}</p>
                    </div>
                  );
                })}
              </div>

              {currentAnalysis.unmappedColumns.length > 0 && (
                <div className="text-[10px] font-mono text-slate-400 mt-2">
                  * Unmapped columns found in your file and excluded from metrics: {currentAnalysis.unmappedColumns.join(", ")}
                </div>
              )}
            </div>

            {/* Answer 2: Missing Values & Statistics */}
            <div className="space-y-3 bg-slate-50/40 p-5 rounded-xl border border-slate-100">
              <h3 className="text-xs font-mono uppercase text-indigo-700 font-bold tracking-wider">
                2. DATASET INVENTORY & MISSING VALUES PROFILE
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                  <span className="block text-3xs font-mono text-slate-400 uppercase">Rows Parsed</span>
                  <span className="block text-xl font-sans font-bold text-slate-800 mt-0.5">{currentAnalysis.rowCount}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                  <span className="block text-3xs font-mono text-slate-400 uppercase">Missing Ratings</span>
                  <span className={`block text-xl font-sans font-bold mt-0.5 ${currentAnalysis.missingValues.rating > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {currentAnalysis.missingValues.rating}
                  </span>
                  <span className="block text-[8px] font-mono text-slate-400">
                    {currentAnalysis.rowCount > 0 ? `${((currentAnalysis.missingValues.rating / currentAnalysis.rowCount) * 100).toFixed(1)}% empty` : ""}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                  <span className="block text-3xs font-mono text-slate-400 uppercase">Missing Categories</span>
                  <span className="block text-xl font-sans font-bold text-slate-800 mt-0.5">{currentAnalysis.missingValues.category}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                  <span className="block text-3xs font-mono text-slate-400 uppercase">Missing Values Total</span>
                  <span className="block text-xl font-sans font-bold text-slate-800 mt-0.5">
                    {Object.values(currentAnalysis.missingValues as Record<string, number>).reduce((a: number, b: number) => a + b, 0)}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-center col-span-2 md:col-span-1">
                  <span className="block text-3xs font-mono text-slate-400 uppercase">Target Integrity</span>
                  <span className="block text-xl font-sans font-bold text-emerald-600 mt-0.5">
                    {currentAnalysis.missingValues.customer_id === 0 && currentAnalysis.missingValues.transaction_id === 0 ? "EXCELLENT" : "IMPUTED"}
                  </span>
                </div>
              </div>
            </div>

            {/* Answer 3: Data Quality Issues */}
            <div className="space-y-3 bg-slate-50/40 p-5 rounded-xl border border-slate-100">
              <h3 className="text-xs font-mono uppercase text-indigo-700 font-bold tracking-wider">
                3. DETECTED DATA QUALITY ANOMALIES ({currentAnalysis.qualityIssues.length})
              </h3>
              
              {currentAnalysis.qualityIssues.length === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Excellent profile. Zero primary key overlaps, invalid values or critical omissions detected.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentAnalysis.qualityIssues.map((issue, iIdx) => (
                    <div
                      key={iIdx}
                      className={`p-3 border rounded-lg text-xs font-sans text-left flex gap-1.5 items-start ${
                        issue.type === "Error"
                          ? "bg-rose-50 border-rose-100 text-rose-800"
                          : issue.type === "Warning"
                          ? "bg-amber-50 border-amber-100 text-amber-800"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${issue.type === "Error" ? "text-rose-500" : issue.type === "Warning" ? "text-amber-500" : "text-indigo-400"}`} />
                      <div>
                        <span className="font-bold font-mono text-3xs block tracking-wider uppercase mb-0.5 text-slate-500">
                          {issue.type} • Column: {issue.column}
                        </span>
                        <span>{issue.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Answer 4 & 5 Dual grid-columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Answer 4: Useful Features */}
              <div className="bg-slate-50/40 p-5 rounded-xl border border-slate-100 text-left space-y-3">
                <h3 className="text-xs font-mono uppercase text-indigo-700 font-bold tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  4. COHORT RETENTION ANALYTICS FEATURES
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                  We leverage key transaction attributes from your file rows to engineer the following CRM indicators inside this hub:
                </p>
                <ul className="space-y-2 text-xs">
                  {currentAnalysis.retentionFeatures.map((feat, fIdx) => (
                    <li key={fIdx} className="flex gap-2 items-start bg-white p-2.5 rounded-lg border border-slate-100 shadow-4xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2"></div>
                      <span className="text-slate-600 leading-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Answer 5: Cleaning Recommendations */}
              <div className="bg-slate-50/40 p-5 rounded-xl border border-slate-100 text-left space-y-3">
                <h3 className="text-xs font-mono uppercase text-indigo-700 font-bold tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  5. DATABASE CLEANING RECOMMENDATIONS
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                  We automatically apply these preprocessing pipelines when loading your dataset to compile stable feature definitions:
                </p>
                <div className="space-y-2 text-xs">
                  {currentAnalysis.cleaningRecommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-4xs flex gap-2 items-start">
                      <span className="font-mono font-bold text-slate-400">0{rIdx + 1}</span>
                      <span className="text-slate-600 leading-normal">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activation Button Core */}
            <div className="pt-4 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono italic">
                * Activating replaces active transaction caches and recalculates everything live.
              </span>
              <button
                type="button"
                onClick={activateDataset}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 text-white font-sans text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
              >
                Activate Workspace Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
