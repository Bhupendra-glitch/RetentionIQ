import React, { useState } from "react";
import { CustomerFeature } from "../types";
import { Award, Zap, ShieldCheck, ShieldAlert, CheckCircle, Flame } from "lucide-react";

interface LoyaltyDefinitionWarProps {
  features: CustomerFeature[];
}

export default function LoyaltyDefinitionWar({ features }: LoyaltyDefinitionWarProps) {
  // Interactive Slider Threshold State
  const [minFreqA, setMinFreqA] = useState<number>(3); // Def A frequency
  const [minSpendB, setMinSpendB] = useState<number>(450); // Def B monetary
  const [minConsistencyB, setMinConsistencyB] = useState<number>(40); // Def B consistency

  // Definition A: Transaction Behavior Based (Frequency >= minFreqA)
  const cohortA = features.filter((f) => f.frequency >= minFreqA);
  const revA = cohortA.reduce((sum, f) => sum + f.monetary_value, 0);

  // Definition B: Value + Consistency Based (spent >= minSpendB AND consistency >= minConsistencyB)
  const cohortB = features.filter((f) => f.monetary_value >= minSpendB && f.purchase_consistency >= minConsistencyB);
  const revB = cohortB.reduce((sum, f) => sum + f.monetary_value, 0);

  const totalRev = features.reduce((sum, f) => sum + f.monetary_value, 0);

  return (
    <div className="space-y-8 animate-fade-in" id="loyalty-definition-war">
      {/* Introduction */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-xl font-sans font-semibold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          Loyalty Definition Tournament: Behavior vs. Value + Consistency
        </h3>
        <p className="text-slate-500 font-sans text-xs mt-1">
          How do we define an absolute "Loyal Customer"? Should we rely purely on transactions frequency (Definition A) or combine heavy lifetime spending with a predictable purchasing calendar (Definition B)? Adjust dials below to compare live.
        </p>
      </div>

      {/* Side-by-Side Sliders & Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Definition A */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">
              Definition A: Transaction-Count Priority
            </span>
            <h4 className="font-sans font-bold text-slate-900 text-lg">
              Pure Behavioral Core Index
            </h4>
            <p className="text-2xs text-slate-500 font-sans leading-relaxed">
              Definition A isolates participants based strictly on purchase recurrence, without setting monetary gates or discounting barriers.
            </p>
          </div>

          {/* Slider control */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-2xs font-mono text-slate-600">
              <span>Required Order Frequency:</span>
              <span className="font-bold text-indigo-600 font-sans text-xs font-bold">{minFreqA} Orders</span>
            </div>
            <input
              id="slider-min-freq"
              type="range"
              min="2"
              max="7"
              value={minFreqA}
              onChange={(e) => setMinFreqA(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cur-pointer cursor-ew-resize"
            />
          </div>

          {/* Live Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50/40 border border-indigo-100 p-3 rounded-lg text-left">
              <span className="block text-4xs font-mono text-slate-500 uppercase">Qualifying Accounts</span>
              <span className="text-xl font-mono font-bold text-indigo-900">{cohortA.length} Customers</span>
              <span className="block text-4xs text-slate-500 font-mono mt-0.5">
                {((cohortA.length / features.length) * 100).toFixed(1)}% of base
              </span>
            </div>
            <div className="bg-indigo-50/40 border border-indigo-100 p-3 rounded-lg text-left">
              <span className="block text-4xs font-mono text-slate-500 uppercase">Revenue Contribution</span>
              <span className="text-xl font-sans font-bold text-slate-800">${revA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="block text-4xs text-indigo-600 font-mono">
                {((revA / totalRev) * 100).toFixed(1)}% of total spent
              </span>
            </div>
          </div>

          {/* Pros / Cons list */}
          <div className="space-y-3 text-2xs font-sans text-slate-600 pt-4 border-t border-slate-100">
            <div>
              <span className="font-mono font-bold text-indigo-600 uppercase block">Advantages:</span>
              <p className="mt-1 leading-relaxed">Extremely simple to code in SQL. Great for early-stage startup tracking without complex pricing columns.</p>
            </div>
            <div>
              <span className="font-mono font-bold text-rose-500 uppercase block">Weaknesses:</span>
              <p className="mt-1 leading-relaxed">High vulnerability to Promo Hunters who order cheap $15 bargain tees with heavy markdown codes 6 times, leading to zero brand profit margins.</p>
            </div>
          </div>
        </div>

        {/* Definition B */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">
              Definition B: Value + Consistency Priority
            </span>
            <h4 className="font-sans font-bold text-slate-900 text-lg">
              The Sovereign VIP Index
            </h4>
            <p className="text-2xs text-slate-500 font-sans leading-relaxed">
              Definition B focuses on true customer equity by combining deep cumulative spend limits with a reliable shopping interval cadence.
            </p>
          </div>

          {/* Sliders controls */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-2xs font-mono text-slate-600">
                <span>Minimum Spending (USD):</span>
                <span className="font-bold text-emerald-600 font-sans text-xs font-bold">${minSpendB}</span>
              </div>
              <input
                id="slider-min-spend"
                type="range"
                min="200"
                max="800"
                step="50"
                value={minSpendB}
                onChange={(e) => setMinSpendB(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cur-pointer cursor-ew-resize"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-2xs font-mono text-slate-600">
                <span>Required Consistency Index:</span>
                <span className="font-bold text-emerald-600 font-sans text-xs font-bold">{minConsistencyB}%</span>
              </div>
              <input
                id="slider-min-consistency"
                type="range"
                min="20"
                max="75"
                value={minConsistencyB}
                onChange={(e) => setMinConsistencyB(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cur-pointer cursor-ew-resize"
              />
            </div>
          </div>

          {/* Live Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/45 border border-emerald-100 p-3 rounded-lg text-left">
              <span className="block text-4xs font-mono text-slate-500 uppercase">Qualifying Accounts</span>
              <span className="text-xl font-mono font-bold text-emerald-800">{cohortB.length} Customers</span>
              <span className="block text-4xs text-slate-505 font-mono mt-0.5">
                {((cohortB.length / features.length) * 100).toFixed(1)}% of base
              </span>
            </div>
            <div className="bg-emerald-50/45 border border-emerald-100 p-3 rounded-lg text-left">
              <span className="block text-4xs font-mono text-slate-500 uppercase">Revenue Contribution</span>
              <span className="text-xl font-sans font-bold text-slate-800">${revB.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="block text-4xs text-emerald-600 font-mono">
                {((revB / totalRev) * 100).toFixed(1)}% of total spent
              </span>
            </div>
          </div>

          {/* Pros / Cons list */}
          <div className="space-y-3 text-2xs font-sans text-slate-600 pt-4 border-t border-slate-100">
            <div>
              <span className="font-mono font-bold text-emerald-600 uppercase block">Advantages:</span>
              <p className="mt-1 leading-relaxed">Guarantees that margin investment is directed exclusively towards high-margin, consistent organic buyers.</p>
            </div>
            <div>
              <span className="font-mono font-bold text-amber-600 uppercase block">Weaknesses:</span>
              <p className="mt-1 leading-relaxed">Slightly harder to query. Erroneously excludes rising high-potential trialists who have just started their journey.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Senior Mentor Recommendation Verdict */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2 text-left">
          <h4 className="font-sans font-bold text-white text-base">
            Professional Recommendation: Definition B is Superior
          </h4>
          <p className="text-slate-300 font-sans text-xs leading-relaxed max-w-4xl">
            As your senior mentor, I recommend adopting <strong>Definition B (Value + Consistency Based)</strong> for all core loyalty campaigns. Standard volume priority (Definition A) fails to identify markdown vulnerability, causing high-value rewards budgets to be wasted on low-margin promo-dependent customers. Utilizing Value + Consistency is the gold standard for luxury and fashion brands seeking margin defense.
          </p>
        </div>
      </div>
    </div>
  );
}
