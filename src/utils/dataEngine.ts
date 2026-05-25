import { Transaction, CustomerFeature, SQLQueryResult } from "../types";

// Fixed reference snapshot date: May 25, 2026
export const ANALYSIS_DATE = "2026-05-25";

// Seedable random number generator to ensure consistent dataset generation
function createSeededRandom(seed: number) {
  return function() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

export function generateDataset(): { raw: Transaction[]; clean: Transaction[] } {
  const rand = createSeededRandom(42);
  const categories: Array<Transaction["category"]> = ["Apparel", "Footwear", "Accessories", "Outerwear"];
  const regions: Array<Transaction["region"]> = ["North", "South", "East", "West"];
  const genders: Array<Transaction["gender"]> = ["Female", "Male", "Non-binary", "Unspecified"];

  const customers: Array<{
    id: string;
    region: Transaction["region"];
    gender: Transaction["gender"];
    type: "VIP" | "PromoHunter" | "SleeperChun" | "NormalLoyal" | "NewOpportunist";
    baseRating: number;
  }> = [];

  // Generate 120 unique customers
  for (let i = 1; i <= 120; i++) {
    const id = `CUST_${100 + i}`;
    const region = regions[Math.floor(rand() * regions.length)];
    const gender = genders[Math.floor(rand() * genders.length)];
    
    // Distribute custom customer types to create realistic skews
    const r = rand();
    let type: typeof customers[number]["type"] = "NormalLoyal";
    let baseRating = 4.2;

    if (r < 0.15) {
      type = "VIP"; // Buys a lot, high ticket, highly consistent, rarely needs discount
      baseRating = 4.8;
    } else if (r < 0.35) {
      type = "PromoHunter"; // Buys only with high discount
      baseRating = 3.6;
    } else if (r < 0.55) {
      type = "SleeperChun"; // Placed 1 or 2 orders a long time ago and stopped
      baseRating = 2.8;
    } else if (r < 0.75) {
      type = "NewOpportunist"; // Recent 1-2 purchases, high satisfaction potential
      baseRating = 4.5;
    } else {
      type = "NormalLoyal"; // Standard buyer
      baseRating = 4.05;
    }

    customers.push({ id, region, gender, type, baseRating });
  }

  const transactions: Transaction[] = [];
  let txCount = 1001;

  // Analysis target date properties
  const msInDay = 24 * 60 * 60 * 1000;
  const pivotTime = new Date(ANALYSIS_DATE).getTime();

  // Generate ~450 transactions
  customers.forEach((cust) => {
    let numOrders = 0;
    let recencyRangeDays = 300; // default window back
    let minDateAge = 5; // cannot be fresher than 5 days ago

    if (cust.type === "VIP") {
      numOrders = Math.floor(rand() * 8) + 6; // 6 to 13 orders
      recencyRangeDays = 40; // bought very recently
    } else if (cust.type === "PromoHunter") {
      numOrders = Math.floor(rand() * 5) + 3; // 3 to 7 orders
      recencyRangeDays = 120;
    } else if (cust.type === "SleeperChun") {
      numOrders = Math.floor(rand() * 2) + 1; // 1 to 2 orders
      recencyRangeDays = 450; // bought a year ago
      minDateAge = 180; // at least 180 days ago
    } else if (cust.type === "NewOpportunist") {
      numOrders = Math.floor(rand() * 2) + 1; // 1 to 2 orders
      recencyRangeDays = 15; // very recent
    } else {
      numOrders = Math.floor(rand() * 4) + 2; // 2 to 5 orders
      recencyRangeDays = 180;
    }

    // Generate dates
    const purchaseTimes: number[] = [];
    for (let o = 0; o < numOrders; o++) {
      // Pick random back-dated offset
      const randOffsetDays = Math.floor(rand() * (recencyRangeDays - minDateAge)) + minDateAge;
      const purchaseTime = pivotTime - (randOffsetDays * msInDay);
      purchaseTimes.push(purchaseTime);
    }
    // Sort chronological
    purchaseTimes.sort((a, b) => a - b);

    purchaseTimes.forEach((purchaseTime, idx) => {
      const dateStr = new Date(purchaseTime).toISOString().split("T")[0];
      
      // Determine order_value skewed by profile
      let baseVal = 80;
      if (cust.type === "VIP") baseVal = 180 + rand() * 150;
      else if (cust.type === "PromoHunter") baseVal = 45 + rand() * 50;
      else if (cust.type === "SleeperChun") baseVal = 70 + rand() * 60;
      else if (cust.type === "NewOpportunist") baseVal = 95 + rand() * 80;
      else baseVal = 75 + rand() * 70;

      const order_value = parseFloat(baseVal.toFixed(2));

      // Determine discount
      let discount_amount = 0;
      if (cust.type === "PromoHunter") {
        // High discount dependency (30% to 50% discount)
        discount_amount = parseFloat((order_value * (0.3 + rand() * 0.2)).toFixed(2));
      } else if (cust.type === "VIP") {
        // VIPs get subtle loyalty perks (0% to 10% discount)
        discount_amount = rand() < 0.25 ? parseFloat((order_value * (0.05 + rand() * 0.05)).toFixed(2)) : 0;
      } else {
        // Standard (0 to 20% discount on some purchases)
        discount_amount = rand() < 0.4 ? parseFloat((order_value * (0.1 + rand() * 0.1)).toFixed(2)) : 0;
      }

      // Safeguard discount size
      if (discount_amount >= order_value) {
        discount_amount = parseFloat((order_value * 0.2).toFixed(2));
      }

      const category = categories[Math.floor(rand() * categories.length)];

      // Ratings: Some percentage are left empty (null) to represent incomplete data, except VIPs
      let rating: number | null = null;
      const ratingRoll = rand();
      if (cust.type === "VIP" || ratingRoll < 0.75) {
        // Slight variation in satisfaction score based on customer type
        const val = cust.baseRating + (rand() * 1.0 - 0.5);
        rating = Math.max(1, Math.min(5, Math.round(val)));
      }

      transactions.push({
        transaction_id: `TXN${txCount++}`,
        customer_id: cust.id,
        purchase_date: dateStr,
        order_value,
        category,
        discount_amount,
        region: cust.region,
        gender: cust.gender,
        rating
      });
    });
  });

  // Inject some duplicates and issues into the RAW dataset
  const rawDataset = [...transactions];

  // Inject 12 duplicate transactions
  for (let d = 0; d < 12; d++) {
    // Pick an existing transaction and clone it
    const indexToClone = Math.floor(rand() * (rawDataset.length - 10));
    if (indexToClone >= 0 && indexToClone < rawDataset.length) {
      const clone = { ...rawDataset[indexToClone] };
      clone.is_duplicate = true;
      rawDataset.splice(indexToClone, 0, clone);
    }
  }

  // Ensure ratings are heavily missing on some to make missing-data profiling stark
  // We'll set some extra fields to null in the raw dataset
  const rawDatasetWithMissing = rawDataset.map((t, idx) => {
    if (idx % 11 === 0 && !t.is_duplicate) {
      return { ...t, rating: null };
    }
    return t;
  });

  return {
    raw: rawDatasetWithMissing,
    clean: transactions // Pristine version
  };
}

// -------------------------------------------------------------
// Data Profile Analytics
// -------------------------------------------------------------
export interface DataProfileReport {
  totalRows: number;
  uniqueCustomers: number;
  duplicateCount: number;
  missingRatingCount: number;
  totalRevenueGross: number; // Sum(order_value + discount_amount)
  totalRevenueNet: number; // Sum(order_value)
  totalDiscounts: number;
  averageDiscountRate: number; // total discount / gross revenue
  categoryDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
}

export function profileDataset(data: Transaction[]): DataProfileReport {
  const seenTxIds = new Set<string>();
  let duplicateCount = 0;
  let missingRatingCount = 0;
  let totalRevenueNet = 0;
  let totalDiscounts = 0;
  const customers = new Set<string>();
  const categories: Record<string, number> = {};
  const regions: Record<string, number> = {};

  data.forEach((t, index) => {
    // Duplicate detection - if transaction_id exists already, or marked as duplicate
    if (seenTxIds.has(t.transaction_id)) {
      duplicateCount++;
    } else {
      seenTxIds.add(t.transaction_id);
    }

    if (t.rating === null) {
      missingRatingCount++;
    }

    customers.add(t.customer_id);
    totalRevenueNet += t.order_value;
    totalDiscounts += t.discount_amount;

    categories[t.category] = (categories[t.category] || 0) + 1;
    regions[t.region] = (regions[t.region] || 0) + 1;
  });

  const totalRevenueGross = totalRevenueNet + totalDiscounts;

  return {
    totalRows: data.length,
    uniqueCustomers: customers.size,
    duplicateCount,
    missingRatingCount,
    totalRevenueGross,
    totalRevenueNet,
    totalDiscounts,
    averageDiscountRate: totalRevenueGross > 0 ? (totalDiscounts / totalRevenueGross) * 100 : 0,
    categoryDistribution: categories,
    regionDistribution: regions
  };
}

// -------------------------------------------------------------
// Customer Feature Engineering Pipeline (Pandas equivalent)
// -------------------------------------------------------------
export function engineerCustomerFeatures(transactions: Transaction[]): CustomerFeature[] {
  // Group transactions by customer_id
  const custTx: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (!custTx[t.customer_id]) {
      custTx[t.customer_id] = [];
    }
    custTx[t.customer_id].push(t);
  });

  const features: CustomerFeature[] = [];
  const refTime = new Date(ANALYSIS_DATE).getTime();
  const msInDay = 24 * 60 * 60 * 1000;

  Object.entries(custTx).forEach(([custId, txs]) => {
    // Sort transactions chronologically
    txs.sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());

    // 1. Recency
    const lastTxDate = new Date(txs[txs.length - 1].purchase_date).getTime();
    const recency = Math.max(0, Math.floor((refTime - lastTxDate) / msInDay));

    // 2. Frequency
    const frequency = txs.length;

    // 3. Monetary value
    const monetary_value = txs.reduce((sum, t) => sum + t.order_value, 0);

    // 4. AOV
    const aov = frequency > 0 ? monetary_value / frequency : 0;

    // 5. Discount Dependency Score
    const totalDiscounts = txs.reduce((sum, t) => sum + t.discount_amount, 0);
    const totalGross = monetary_value + totalDiscounts;
    const discount_dependency = totalGross > 0 ? totalDiscounts / totalGross : 0;

    // 6. Category Diversity
    const uniqueCats = new Set(txs.map((t) => t.category));
    const category_diversity = uniqueCats.size;

    // 7. Customer Lifetime Proxy (CLP Score: 0 - 100 scale)
    // Formula: normalized score combining Frequency and Monetary positive weights, Recency negative weight.
    const fScore = Math.min(10, frequency) / 10; // normalized frequency component
    const mScore = Math.min(2500, monetary_value) / 2500; // normalized spend component
    const rScore = Math.max(0, 365 - recency) / 365; // recency decay component (1 = bought today, 0 = haven't bought in a year)
    const rawClp = (fScore * 40) + (mScore * 35) + (rScore * 25);
    const clp_score = Math.min(100, Math.max(1, Math.round(rawClp)));

    // 8. Purchase Consistency (Interval consistency)
    // Measures variance in shopping cycles. Closer to 100 means highly regular interval purchasing.
    let purchase_consistency = 0;
    if (frequency > 2) {
      const dates = txs.map((t) => new Date(t.purchase_date).getTime());
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i - 1]) / msInDay);
      }
      const meanInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
      const variance = intervals.reduce((sum, v) => sum + Math.pow(v - meanInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      // Normalized consistency metric: 100 is perfectly consistent, dropping with deviation score
      const coeffOfVar = meanInterval > 0 ? stdDev / meanInterval : 1;
      purchase_consistency = Math.max(5, Math.min(100, Math.round(100 / (1 + coeffOfVar * 0.5))));
    } else if (frequency === 2) {
      purchase_consistency = 50; // simple baseline
    } else {
      purchase_consistency = 15; // single transaction is inherently inconsistent
    }

    // 9. Retention Probability Score (0 - 100 scale)
    // Likelihood of customer returning. Decays with recency, boosted by high rating.
    const ratings = txs.map((t) => t.rating).filter((r): r is number => r !== null);
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 4.0; // impute default neutral
    const recencyDecay = Math.exp(-recency / 150); // e-folding cycle of 150 days
    const ratingBoost = 0.5 + (avgRating / 10); // 1.0 multiplier at rating = 5, 0.6 at rating = 1
    const retention_prob = Math.min(100, Math.max(5, Math.round(recencyDecay * ratingBoost * 100)));

    // 10. Satisfaction Flag
    const meanRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
    let satisfaction_flag: CustomerFeature["satisfaction_flag"] = "No Rating";
    if (meanRating !== null) {
      if (meanRating >= 4.5) satisfaction_flag = "High (4.5+)";
      else if (meanRating >= 3.0) satisfaction_flag = "Medium (3.0-4.4)";
      else satisfaction_flag = "Low (<3.0)";
    }

    features.push({
      customer_id: custId,
      recency,
      frequency,
      monetary_value: parseFloat(monetary_value.toFixed(2)),
      aov: parseFloat(aov.toFixed(2)),
      discount_dependency: parseFloat(discount_dependency.toFixed(4)),
      category_diversity,
      clp_score,
      purchase_consistency,
      retention_prob,
      satisfaction_flag
    });
  });

  return features;
}

// -------------------------------------------------------------
// Interactive SQL Query Engine Simulation (Returns structured tables)
// -------------------------------------------------------------
export function runSimulatedSQL(queryId: string, transactions: Transaction[], features: CustomerFeature[]): SQLQueryResult {
  // Compile the query results in-memory depending on selected query item
  switch (queryId) {
    case "sql_high_value_loyal": {
      // High frequency and high total spending
      const result = features
        .filter((f) => f.frequency >= 5 && f.monetary_value >= 600)
        .map((f) => {
          const ratingGroup = f.satisfaction_flag;
          return {
            customer_id: f.customer_id,
            frequency: f.frequency,
            total_spent: f.monetary_value,
            avg_order_value: f.aov,
            clp_score: f.clp_score,
            retention_prob: `${f.retention_prob}%`,
            discount_dependency: `${(f.discount_dependency * 100).toFixed(1)}%`,
            rating_profile: ratingGroup
          };
        })
        .sort((a, b) => b.total_spent - a.total_spent);

      return {
        columns: ["customer_id", "frequency", "total_spent", "avg_order_value", "clp_score", "retention_prob", "discount_dependency", "rating_profile"],
        rows: result
      };
    }

    case "sql_discount_dependent": {
      // Purchased a minimum of 2 times AND > 25% of gross revenue resolved as discounts
      const result = features
        .filter((f) => f.frequency >= 2 && f.discount_dependency >= 0.20)
        .map((f) => {
          return {
            customer_id: f.customer_id,
            total_orders: f.frequency,
            total_spent: f.monetary_value,
            promo_dependency: `${(f.discount_dependency * 100).toFixed(1)}%`,
            retention_prob: `${f.retention_prob}%`,
            order_consistency: `${f.purchase_consistency}%`,
            classification: f.discount_dependency >= 0.35 ? "Critical Promo Hunter" : "Opportunistic Promo Buyer"
          };
        })
        .sort((a, b) => parseFloat(b.promo_dependency) - parseFloat(a.promo_dependency));

      return {
        columns: ["customer_id", "total_orders", "total_spent", "promo_dependency", "retention_prob", "order_consistency", "classification"],
        rows: result
      };
    }

    case "sql_at_risk": {
      // Haven't bought in over 120 days OR retention probability score below 40%
      const result = features
        .filter((f) => f.recency >= 120 || f.retention_prob < 40)
        .map((f) => {
          return {
            customer_id: f.customer_id,
            days_inactive: f.recency,
            total_spent: f.monetary_value,
            total_orders: f.frequency,
            retention_lvl: `${f.retention_prob}%`,
            avg_rating: f.satisfaction_flag,
            status: f.recency >= 300 ? "Lapsed (Severely Churned)" : "At Risk (Cooling Off)"
          };
        })
        .sort((a, b) => b.days_inactive - a.days_inactive);

      return {
        columns: ["customer_id", "days_inactive", "total_spent", "total_orders", "retention_lvl", "avg_rating", "status"],
        rows: result
      };
    }

    case "sql_new_potential_loyalists": {
      // Recent registration (within last 60 days), satisfying rating profile, 2-3 orders
      const result = features
        .filter((f) => f.recency <= 60 && f.frequency >= 2 && f.frequency <= 3 && f.satisfaction_flag !== "Low (<3.0)")
        .map((f) => {
          return {
            customer_id: f.customer_id,
            days_since_last: f.recency,
            total_orders: f.frequency,
            total_spent: f.monetary_value,
            avg_rating: f.satisfaction_flag,
            retention_score: `${f.retention_prob}%`,
            loyalty_potential: f.clp_score >= 45 ? "High Potential" : "Medium Potential"
          };
        })
        .sort((a, b) => b.total_spent - a.total_spent);

      return {
        columns: ["customer_id", "days_since_last", "total_orders", "total_spent", "avg_rating", "retention_score", "loyalty_potential"],
        rows: result
      };
    }

    case "sql_region_wise_value": {
      // Roll up transaction stats by region
      const regionalStats: Record<string, { orders: number; revenue: number; promoSpent: number; uniqueCust: Set<string> }> = {};
      
      transactions.forEach((t) => {
        if (!regionalStats[t.region]) {
          regionalStats[t.region] = { orders: 0, revenue: 0, promoSpent: 0, uniqueCust: new Set() };
        }
        regionalStats[t.region].orders++;
        regionalStats[t.region].revenue += t.order_value;
        regionalStats[t.region].promoSpent += t.discount_amount;
        regionalStats[t.region].uniqueCust.add(t.customer_id);
      });

      const result = Object.entries(regionalStats).map(([region, data]) => {
        const netSpent = data.revenue;
        const grossValue = netSpent + data.promoSpent;
        const discRate = grossValue > 0 ? (data.promoSpent / grossValue) * 100 : 0;
        const custCount = data.uniqueCust.size;
        return {
          region,
          customer_cohort: custCount,
          order_count: data.orders,
          net_revenue_usd: parseFloat(netSpent.toFixed(2)),
          average_customer_lifetime_value: parseFloat((netSpent / custCount).toFixed(2)),
          promo_discount_rate: `${discRate.toFixed(1)}%`
        };
      }).sort((a, b) => b.net_revenue_usd - a.net_revenue_usd);

      return {
        columns: ["region", "customer_cohort", "order_count", "net_revenue_usd", "average_customer_lifetime_value", "promo_discount_rate"],
        rows: result
      };
    }

    case "sql_category_segmentation": {
      // Analyze purchase indicators across merchandise groups
      const categoryStats: Record<string, { orders: number; revenue: number; promoSpent: number; uniqueCust: Set<string> }> = {};
      transactions.forEach((t) => {
        if (!categoryStats[t.category]) {
          categoryStats[t.category] = { orders: 0, revenue: 0, promoSpent: 0, uniqueCust: new Set() };
        }
        categoryStats[t.category].orders++;
        categoryStats[t.category].revenue += t.order_value;
        categoryStats[t.category].promoSpent += t.discount_amount;
        categoryStats[t.category].uniqueCust.add(t.customer_id);
      });

      const result = Object.entries(categoryStats).map(([category, data]) => {
        const netSpend = data.revenue;
        return {
          category_group: category,
          total_orders: data.orders,
          total_revenue_usd: parseFloat(netSpend.toFixed(2)),
          avg_unit_retail: parseFloat((netSpend / data.orders).toFixed(2)),
          buyer_count: data.uniqueCust.size,
          discount_penetration: `${((data.promoSpent / (netSpend + data.promoSpent)) * 100).toFixed(1)}%`
        };
      }).sort((a, b) => b.total_revenue_usd - a.total_revenue_usd);

      return {
        columns: ["category_group", "total_orders", "total_revenue_usd", "avg_unit_retail", "buyer_count", "discount_penetration"],
        rows: result
      };
    }

    case "sql_repeat_purchase": {
      // cohort analysis comparing single versus multiple/repeat customer splits
      const repeatCounts = features.reduce((acc, f) => {
        if (f.frequency === 1) {
          acc.single += 1;
        } else {
          acc.repeat += 1;
        }
        return acc;
      }, { single: 0, repeat: 0 });

      const totalCust = features.length;
      const result = [
        {
          cohort_classification: "Single-Buyers (One-time Trialists)",
          customer_count: repeatCounts.single,
          percentage_share: `${((repeatCounts.single / totalCust) * 100).toFixed(1)}%`,
          strategic_status: "Critical leaking bucket"
        },
        {
          cohort_classification: "Repeat Buyers (Loyalty Cohort)",
          customer_count: repeatCounts.repeat,
          percentage_share: `${((repeatCounts.repeat / totalCust) * 100).toFixed(1)}%`,
          strategic_status: "Primary retention driver VIP core"
        }
      ];

      return {
        columns: ["cohort_classification", "customer_count", "percentage_share", "strategic_status"],
        rows: result
      };
    }

    case "sql_revenue_concentration": {
      // Sort customers by spending. Illustrate 80-20 rule.
      const sortedSpent = [...features].sort((a, b) => b.monetary_value - a.monetary_value);
      const totalRev = sortedSpent.reduce((sum, f) => sum + f.monetary_value, 0);

      const segments = [
        { name: "Top 10% Spend VIPs", sliceStart: 0, sliceEnd: Math.ceil(sortedSpent.length * 0.1) },
        { name: "Top 10-30% Key Contributors", sliceStart: Math.ceil(sortedSpent.length * 0.1), sliceEnd: Math.ceil(sortedSpent.length * 0.3) },
        { name: "Top 30-60% Baseline Shoppers", sliceStart: Math.ceil(sortedSpent.length * 0.3), sliceEnd: Math.ceil(sortedSpent.length * 0.6) },
        { name: "Remaining Long Tail", sliceStart: Math.ceil(sortedSpent.length * 0.6), sliceEnd: sortedSpent.length }
      ];

      const result = segments.map((seg) => {
        const slice = sortedSpent.slice(seg.sliceStart, seg.sliceEnd);
        const segmentSpent = slice.reduce((sum, f) => sum + f.monetary_value, 0);
        return {
          customer_tier: seg.name,
          accounts_count: slice.length,
          revenue_contribution_usd: parseFloat(segmentSpent.toFixed(2)),
          revenue_share: `${((segmentSpent / totalRev) * 100).toFixed(1)}%`,
          mean_customer_value: parseFloat((slice.length > 0 ? segmentSpent / slice.length : 0).toFixed(2))
        };
      });

      return {
        columns: ["customer_tier", "accounts_count", "revenue_contribution_usd", "revenue_share", "mean_customer_value"],
        rows: result
      };
    }

    default:
      return { columns: [], rows: [] };
  }
}
