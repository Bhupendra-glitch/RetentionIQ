import React, { useState } from "react";
import { generateDataset, engineerCustomerFeatures } from "./utils/dataEngine";
import ExecutiveSummaryPanel from "./components/ExecutiveSummaryPanel";
import DataProfileSandbox from "./components/DataProfileSandbox";
import FeatureEngineeringTabs from "./components/FeatureEngineeringTabs";
import SqlQueryEngine from "./components/SqlQueryEngine";
import LoyaltyDefinitionWar from "./components/LoyaltyDefinitionWar";
import PromoDependencyInspector from "./components/PromoDependencyInspector";
import FounderDashboardPanel from "./components/FounderDashboardPanel";
import AiMentorSidebar from "./components/AiMentorSidebar";
import DatasetUploader from "./components/DatasetUploader";
import { UploadedDataAnalysis } from "./utils/csvParser";
import { Transaction } from "./types";
import { 
  Briefcase, 
  Database, 
  Cpu, 
  Terminal, 
  Award, 
  Percent, 
  LayoutDashboard,
  Sparkles
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "brief" | "sandbox" | "engineering" | "sql" | "loyalty" | "promo" | "dashboard"
  >("brief");

  // Dynamic states to hold active transaction datasets supporting custom hot-swap
  const [uploadedAnalysis, setUploadedAnalysis] = useState<UploadedDataAnalysis | null>(null);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>(() => {
    const { raw } = generateDataset();
    return raw;
  });
  const [cleanTransactions, setCleanTransactions] = useState<Transaction[]>(() => {
    const { clean } = generateDataset();
    return clean;
  });

  const calculatedFeatures = engineerCustomerFeatures(cleanTransactions);

  // Layout steps progress tracking matching style mock
  const stepDetails: Record<
    "brief" | "sandbox" | "engineering" | "sql" | "loyalty" | "promo" | "dashboard",
    { step: string; progress: number; label: string }
  > = {
    brief: { step: "Step 1 / 7 - Analyst Briefing", progress: 14, label: "Dataset Intelligence" },
    sandbox: { step: "Step 2 / 7 - Profile Audit", progress: 28, label: "Database Sandbox" },
    engineering: { step: "Step 3 / 7 - CRM Prep", progress: 42, label: "CRM Features Setup" },
    sql: { step: "Step 4 / 7 - SQL Terminus", progress: 57, label: "SQL Segmentation Terminal" },
    loyalty: { step: "Step 5 / 7 - Metric War", progress: 71, label: "Loyalty Definitions" },
    promo: { step: "Step 6 / 7 - Promo Exposure", progress: 85, label: "Promo Dependency" },
    dashboard: { step: "Step 7 / 7 - Executive Review", progress: 100, label: "Founder's Dashboard" }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden">
      
      {/* Top Header - Mirroring visual mockup exactly */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">CV</span>
          </div>
          <h1 className="text-sm sm:text-lg font-semibold tracking-tight text-slate-800 underline decoration-indigo-500/30 underline-offset-4">
            Decoding Customer Value
          </h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            Senior Mentor Mode
          </span>
          <div className="flex gap-2">
            <div className="hidden lg:flex gap-2.5 items-center px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[10px] font-mono">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Advisor Active</span>
            </div>
            <button 
              onClick={() => {
                alert("Database script exports prepared in local cache! Codeblocks are ready to be used.");
              }}
              className="px-3 py-1.5 text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 hover:border-slate-300 cursor-pointer"
            >
              Export Schema
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Viewport */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Navigator (md+ layouts) */}
        <aside className="hidden md:flex w-64 bg-slate-50 border-r border-slate-200 p-6 flex-col gap-6 shrink-0 overflow-y-auto select-none">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Project Milestones
            </h3>
            
            <nav className="flex flex-col gap-1.5">
              {[
                { id: "brief", label: "Dataset Intelligence", icon: Briefcase },
                { id: "sandbox", label: "Database Sandbox", icon: Database },
                { id: "engineering", label: "CRM Features Setup", icon: Sparkles },
                { id: "sql", label: "SQL Segmentation", icon: Terminal },
                { id: "loyalty", label: "Loyalty Definitions", icon: Award },
                { id: "promo", label: "Promo Dependency", icon: Percent },
                { id: "dashboard", label: "Founder Dashboard", icon: LayoutDashboard }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center gap-3 p-2.5 text-xs font-semibold rounded-lg border text-left transition-all cursor-pointer w-full ${
                      isActive 
                        ? "text-indigo-600 bg-indigo-50/80 border-indigo-100/60"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 border-transparent"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-indigo-600" : "bg-slate-300"}`}></div>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Clean mentor card inside sidebar */}
          <div className="mt-auto bg-white p-4 rounded-xl border border-slate-200 shadow-3xs text-left">
            <p className="text-[11px] leading-relaxed text-slate-500">
              <span className="font-bold text-slate-800 block mb-1">Mentor Note:</span>
              We aren't just counting transactions. We are identifying the heartbeat of your D2C brand through the lens of SQL logic.
            </p>
          </div>
        </aside>

        {/* Dynamic content canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/50">
          
          {/* Scrollable headers tab panel for mobile viewports */}
          <nav className="md:hidden bg-white border-b border-slate-200 px-4 py-3 select-none overflow-x-auto shrink-0 flex gap-2 scrollbar-none">
            {[
              { id: "brief", label: "Brief", icon: Briefcase },
              { id: "sandbox", label: "Sandbox", icon: Database },
              { id: "engineering", label: "CRM", icon: Sparkles },
              { id: "sql", label: "SQL", icon: Terminal },
              { id: "loyalty", label: "Loyalty", icon: Award },
              { id: "promo", label: "Promo", icon: Percent },
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                    isActive 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Scrollable panel area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Dynamic Drag-and-Drop Dataset Selection Panel */}
              <DatasetUploader 
                onDatasetActivated={(parsed, cleaned, analysis) => {
                  setRawTransactions(parsed);
                  setCleanTransactions(cleaned);
                  setUploadedAnalysis(analysis);
                }}
                onDatasetReset={() => {
                  const { raw, clean } = generateDataset();
                  setRawTransactions(raw);
                  setCleanTransactions(clean);
                  setUploadedAnalysis(null);
                }}
                activeAnalysis={uploadedAnalysis}
              />

              {activeTab === "brief" && <ExecutiveSummaryPanel />}
              {activeTab === "sandbox" && <DataProfileSandbox rawData={rawTransactions} cleanData={cleanTransactions} />}
              {activeTab === "engineering" && <FeatureEngineeringTabs cleanData={cleanTransactions} />}
              {activeTab === "sql" && <SqlQueryEngine cleanData={cleanTransactions} engineeredFeatures={calculatedFeatures} />}
              {activeTab === "loyalty" && <LoyaltyDefinitionWar features={calculatedFeatures} />}
              {activeTab === "promo" && <PromoDependencyInspector features={calculatedFeatures} />}
              {activeTab === "dashboard" && <FounderDashboardPanel transactions={cleanTransactions} features={calculatedFeatures} />}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Status Progress Sub-footer (Mockup exact design alignment) */}
      <footer className="h-12 bg-slate-900 border-t border-slate-800 px-6 sm:px-8 flex items-center justify-between shrink-0 text-white select-none">
        <div className="flex gap-4">
          <span className="text-[10px] font-mono text-slate-500 italic">
            Current Focus: {stepDetails[activeTab].step}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 w-24 sm:w-32 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${stepDetails[activeTab].progress}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {stepDetails[activeTab].progress}% COMPLETE
          </span>
        </div>
      </footer>

      {/* Floating AI Consultant Assistant */}
      <AiMentorSidebar />
    </div>
  );
}

