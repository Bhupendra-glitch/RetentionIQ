import React, { useState } from "react";
import { Transaction, CustomerFeature } from "../types";
import { Filter, Eye, Layers, Percent, MapPin, BarChart2, BookOpen, Sparkles } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, CartesianGrid
} from "recharts";

interface FounderDashboardPanelProps {
  transactions: Transaction[];
  features: CustomerFeature[];
}

export default function FounderDashboardPanel({ transactions, features }: FounderDashboardPanelProps) {
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Step 1: Filter raw transactions first
  const filteredTxs = transactions.filter((t) => {
    const matchReg = regionFilter === "All" || t.region === regionFilter;
    const matchCat = categoryFilter === "All" || t.category === categoryFilter;
    return matchReg && matchCat;
  });

  // Get active customer IDs based on filtered transactions
  const activeCustomerIds = new Set(filteredTxs.map((t) => t.customer_id));

  // Step 2: Filter customer features accordingly
  const filteredFeatures = features.filter((f) => {
    // If we have filters active, verify if customer transacted in those parameters
    return activeCustomerIds.has(f.customer_id);
  });

  // Calculate dynamic dashboard stats
  const totalRevenueNet = filteredTxs.reduce((sum, t) => sum + t.order_value, 0);
  const totalDiscounts = filteredTxs.reduce((sum, t) => sum + t.discount_amount, 0);
  const averageAov = filteredFeatures.reduce((sum, f) => sum + f.aov, 0) / (filteredFeatures.length || 1);

  // -------------------------------------------------------------------
  // Panel 1: Customer Value Pyramid Calculation
  // -------------------------------------------------------------------
  const pyramidSegments = [
    { name: "Sovereign VIPs (CLP 75+)", count: 0, revenue: 0 },
    { name: "Core Loyalists (CLP 45-74)", count: 0, revenue: 0 },
    { name: "Baseline Shoppers (CLP 20-44)", count: 0, revenue: 0 },
    { name: "Risky Trialists (CLP < 20)", count: 0, revenue: 0 }
  ];

  filteredFeatures.forEach((f) => {
    if (f.clp_score >= 75) {
      pyramidSegments[0].count++;
      pyramidSegments[0].revenue += f.monetary_value;
    } else if (f.clp_score >= 45) {
      pyramidSegments[1].count++;
      pyramidSegments[1].revenue += f.monetary_value;
    } else if (f.clp_score >= 20) {
      pyramidSegments[2].count++;
      pyramidSegments[2].revenue += f.monetary_value;
    } else {
      pyramidSegments[3].count++;
      pyramidSegments[3].revenue += f.monetary_value;
    }
  });

  const pyramidChartData = pyramidSegments.map((seg) => ({
    name: seg.name,
    customer_count: seg.count,
    revenue_contribution: parseFloat(seg.revenue.toFixed(2))
  }));

  // -------------------------------------------------------------------
  // Panel 2: Promo Dependency vs Retention Scatter Plot
  // -------------------------------------------------------------------
  interface ScatterPoint {
    x: number; // discount dependency rate in %
    y: number; // retention rate in %
    z: number; // spent (AOV)
    id: string;
    group: "Advocate" | "Hybrid" | "Vulture";
  }

  const scatterData: ScatterPoint[] = filteredFeatures.map((f) => {
    let group: ScatterPoint["group"] = "Hybrid";
    if (f.discount_dependency >= 0.25) group = "Vulture";
    else if (f.discount_dependency < 0.05) group = "Advocate";

    return {
      x: parseFloat((f.discount_dependency * 100).toFixed(1)),
      y: f.retention_prob,
      z: f.aov,
      id: f.customer_id,
      group
    };
  });

  // Grouped scatter data for coloring
  const advocatesScatter = scatterData.filter((pt) => pt.group === "Advocate");
  const hybridsScatter = scatterData.filter((pt) => pt.group === "Hybrid");
  const vulturesScatter = scatterData.filter((pt) => pt.group === "Vulture");

  // -------------------------------------------------------------------
  // Panel 3: Geographic Opportunity calculations Map/Bar
  // -------------------------------------------------------------------
  const regionalGroups: Record<string, { nettSpent: number; counts: number; repeats: number }> = {
    North: { nettSpent: 0, counts: 0, repeats: 0 },
    South: { nettSpent: 0, counts: 0, repeats: 0 },
    East: { nettSpent: 0, counts: 0, repeats: 0 },
    West: { nettSpent: 0, counts: 0, repeats: 0 }
  };

  filteredFeatures.forEach((f) => {
    const custTxs = filteredTxs.filter((t) => t.customer_id === f.customer_id);
    if (custTxs.length > 0) {
      const reg = custTxs[0].region;
      if (regionalGroups[reg] !== undefined) {
        regionalGroups[reg].nettSpent += f.monetary_value;
        regionalGroups[reg].counts++;
        if (f.frequency >= 2) {
          regionalGroups[reg].repeats++;
        }
      }
    }
  });

  const geoChartData = Object.entries(regionalGroups).map(([region, data]) => ({
    region_hub: region,
    nett_revenue_usd: parseFloat(data.nettSpent.toFixed(2)),
    customer_count: data.counts,
    repeat_rate: data.counts > 0 ? parseFloat(((data.repeats / data.counts) * 100).toFixed(1)) : 0
  }));

  // -------------------------------------------------------------------
  // Panel 4: Category Funnel Analysis
  // -------------------------------------------------------------------
  const categorySummary: Record<string, { rev: number; orderCount: number; custIds: Set<string> }> = {
    Apparel: { rev: 0, orderCount: 0, custIds: new Set() },
    Footwear: { rev: 0, orderCount: 0, custIds: new Set() },
    Accessories: { rev: 0, orderCount: 0, custIds: new Set() },
    Outerwear: { rev: 0, orderCount: 0, custIds: new Set() }
  };

  filteredTxs.forEach((t) => {
    if (categorySummary[t.category]) {
      categorySummary[t.category].rev += t.order_value;
      categorySummary[t.category].orderCount++;
      categorySummary[t.category].custIds.add(t.customer_id);
    }
  });

  const categoryChartData = Object.entries(categorySummary).map(([cat, d]) => ({
    category_group: cat,
    total_revenue: parseFloat(d.rev.toFixed(2)),
    order_count: d.orderCount,
    avg_unit_retail: d.orderCount > 0 ? parseFloat((d.rev / d.orderCount).toFixed(2)) : 0
  })).sort((a, b) => b.total_revenue - a.total_revenue);

  return (
    <div className="space-y-8 animate-fade-in" id="founder-dashboard-panel">
      {/* Dynamic Filters Hub */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          <div>
            <span className="block font-sans font-bold text-slate-900 text-sm">Interactive Founder Controls</span>
            <span className="block text-4xs text-slate-500 font-mono">D2C Multi-Dimensional Database Slice</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="space-y-1 text-left">
            <span className="block text-4xs text-slate-400 font-mono uppercase">Region Hub</span>
            <select
              id="select-region"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-sans border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white w-full pr-8"
            >
              <option value="All">All Regions (Standard)</option>
              <option value="North">North Cohort</option>
              <option value="South">South Cohort</option>
              <option value="East">East Cohort</option>
              <option value="West">West Cohort</option>
            </select>
          </div>

          <div className="space-y-1 text-left">
            <span className="block text-4xs text-slate-400 font-mono uppercase">Merchandise segment</span>
            <select
              id="select-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-sans border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white w-full pr-8"
            >
              <option value="All">All Categories</option>
              <option value="Apparel">Apparel Category</option>
              <option value="Footwear">Footwear Category</option>
              <option value="Accessories">Accessories Category</option>
              <option value="Outerwear">Outerwear Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Basic Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-3xs flex justify-between items-center">
          <div>
            <span className="block text-4xs text-indigo-400 font-mono uppercase">Total Revenue Sliced</span>
            <span className="text-xl font-sans font-bold text-white mt-1 block">${totalRevenueNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-400">Net Sales</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex justify-between items-center">
          <div>
            <span className="block text-4xs text-slate-400 font-mono uppercase">Customer Accounts</span>
            <span className="text-xl font-sans font-bold text-slate-900 mt-1 block">{filteredFeatures.length} Accounts</span>
          </div>
          <div className="text-right text-[10px] font-mono text-indigo-600">Active base</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex justify-between items-center">
          <div>
            <span className="block text-4xs text-slate-400 font-mono uppercase">Total Discounts Absorbed</span>
            <span className="text-xl font-sans font-bold text-rose-600 mt-1 block">${totalDiscounts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="text-right text-[10px] font-mono text-rose-500">Margin Hit</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex justify-between items-center">
          <div>
            <span className="block text-4xs text-slate-400 font-mono uppercase">AOV Mean Basket</span>
            <span className="text-xl font-sans font-bold text-slate-900 mt-1 block">${averageAov.toFixed(2)}</span>
          </div>
          <div className="text-right text-[10px] font-mono text-slate-400">Order average</div>
        </div>
      </div>

      {/* 4 Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel 1: Value Pyramid */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 select-none">
              <Layers className="w-4 h-4 text-indigo-500" />
              Panel 1: Customer Value Pyramid
            </h4>
            <p className="text-3xs text-slate-500 font-sans mt-0.5">
              Analyzes absolute cashflow contributions grouped by CLP Score tiers.
            </p>
          </div>

          <div className="h-44 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pyramidChartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" hide />
                <YAxis dataKey="name" type="category" stroke="#475569" tickLine={false} width={150} style={{ fontSize: "10px" }} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="revenue_contribution" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-2xs">
            <span className="font-mono font-bold text-slate-700 uppercase block">Power BI Implementation steps:</span>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1 text-3xs">
              <li>Choose native <strong>Treemap</strong> or Stacked Bar Chart model.</li>
              <li>Input engineered <code>CLP_Segment</code> column into <strong>Category / Legend</strong>.</li>
              <li>Drop sum of <code>order_value</code> into <strong>Values</strong>. Sort by spending tier weights.</li>
            </ol>
          </div>
        </div>

        {/* Panel 2: Promo vs Retention Scatter */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 select-none">
              <Percent className="w-4 h-4 text-indigo-500" />
              Panel 2: Promo Dependency vs. Retention Probability
            </h4>
            <p className="text-3xs text-slate-500 font-sans mt-0.5">
              Plots accounts: X-axis represents Markdown Dependency %, Y-axis shows Retention Probability %.
            </p>
          </div>

          <div className="h-44 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" dataKey="x" name="Promo Ratio" unit="%" stroke="#94A3B8" domain={[0, 60]} style={{ fontSize: "9px" }} />
                <YAxis type="number" dataKey="y" name="Retention" unit="%" stroke="#94A3B8" domain={[0, 100]} style={{ fontSize: "9px" }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: any, name: string) => [`${value}%`, name]} />
                <Scatter name="Full-Price VIP" data={advocatesScatter} fill="#059669" shape="circle" />
                <Scatter name="Hybrid Buyer" data={hybridsScatter} fill="#6366F1" shape="circle" />
                <Scatter name="Promo Hunter" data={vulturesScatter} fill="#EF4444" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-2xs">
            <span className="font-mono font-bold text-slate-700 uppercase block">Power BI Implementation steps:</span>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1 text-3xs">
              <li>Insert native <strong>Scatter Chart</strong> component.</li>
              <li>Place <code>discount_dependency_*_100</code> on <strong>X-Axis</strong>, <code>retention_probability</code> on <strong>Y-Axis</strong>.</li>
              <li>Add <code>customer_id</code> to <strong>Details</strong> to bubble point unique customers.</li>
            </ol>
          </div>
        </div>

        {/* Panel 3: Geographic Opportunity Map/Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 select-none">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Panel 3: Geographic Opportunity Performance
            </h4>
            <p className="text-3xs text-slate-500 font-sans mt-0.5">
              Compares aggregate generated D2C USD revenues alongside loyalty group repeat rates across 4 main regional hubs.
            </p>
          </div>

          <div className="h-44 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="region_hub" stroke="#64748B" tickLine={false} style={{ fontSize: "10px" }} />
                <YAxis stroke="#64748B" tickLine={false} style={{ fontSize: "10px" }} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="nett_revenue_usd" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-2xs">
            <span className="font-mono font-bold text-slate-700 uppercase block">Power BI Map Implementation:</span>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1 text-3xs">
              <li>Drag <strong>Map</strong> or <strong>Filled Map</strong> visual into report design space.</li>
              <li>Bind <code>region</code> to <strong>Location</strong> field.</li>
              <li>Place sum <code>order_value</code> into <strong>Bubble Size</strong>, and repeat buying rate into tooltips.</li>
            </ol>
          </div>
        </div>

        {/* Panel 4: Category Funnel/Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 select-none">
              <BarChart2 className="w-4 h-4 text-indigo-505 text-indigo-600" />
              Panel 4: Category funnel & Price Points
            </h4>
            <p className="text-3xs text-slate-500 font-sans mt-0.5">
              Tracks inventory volume order count versus average unit retail (AUR) by merchandise collections.
            </p>
          </div>

          <div className="h-44 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="category_group" stroke="#64748B" tickLine={false} style={{ fontSize: "10px" }} />
                <YAxis stroke="#64748B" tickLine={false} style={{ fontSize: "10px" }} />
                <Tooltip formatter={(value: number, name: any) => name === "avg_unit_retail" ? `$${value.toFixed(2)}` : value} />
                <Bar dataKey="order_count" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={20} name="Order Volume" />
                <Bar dataKey="avg_unit_retail" fill="#059669" radius={[4, 4, 0, 0]} barSize={20} name="AOV / Price Point" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-2xs">
            <span className="font-mono font-bold text-slate-700 uppercase block">Power BI Funnel Implementation:</span>
            <ol className="list-decimal pl-4 text-slate-500 space-y-1 text-3xs">
              <li>Click native <strong>Funnel</strong> icon in Visualizations pane.</li>
              <li>Drag <code>category</code> column into <strong>Group</strong> bucket.</li>
              <li>Drop sum of <code>order_value</code> or total counts into <strong>Values</strong>.</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
