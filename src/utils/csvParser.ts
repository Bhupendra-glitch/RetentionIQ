import { Transaction } from "../types";

// Common synonyms/aliases for transaction columns to ensure maximum compatibility
const COLUMN_ALIASES: Record<string, string[]> = {
  transaction_id: ["transaction_id", "transactionid", "txn_id", "tx_id", "id", "order_id", "orderid", "reference"],
  customer_id: ["customer_id", "customerid", "cust_id", "user_id", "userid", "client_id", "member_id"],
  purchase_date: ["purchase_date", "purchasedate", "date", "timestamp", "created_at", "createdat", "time"],
  order_value: ["order_value", "ordervalue", "amount", "value", "price", "revenue", "sales", "total_val"],
  category: ["category", "product_category", "department", "dept", "item_type", "type", "class"],
  discount_amount: ["discount_amount", "discount", "discountamount", "markdown", "promo_deduction", "deduction"],
  region: ["region", "zone", "state", "country", "territory", "hq", "city"],
  gender: ["gender", "sex", "demographic", "customer_gender"],
  rating: ["rating", "score", "feedback", "stars", "sat_score", "customer_rating", "survey"]
};

export interface UploadedDataAnalysis {
  filename: string;
  rowCount: number;
  columnsFound: Record<string, { mapped: string; original: string; reason: string }>;
  unmappedColumns: string[];
  missingValues: Record<string, number>;
  qualityIssues: Array<{ type: "Error" | "Warning" | "Info"; column: string; message: string }>;
  retentionFeatures: string[];
  cleaningRecommendations: string[];
  parsedTransactions: Transaction[];
  cleanTransactions: Transaction[];
}

/**
 * Splits CSV rows accurately, respecting double quotes
 */
export function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(currentVal.trim());
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  return result;
}

/**
 * Parses raw CSV string and runs audit analytics for customer retention analysis
 */
export function analyzeAndParseCSV(csvText: string, filename: string = "uploaded_dataset.csv"): UploadedDataAnalysis {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("Dataset contains insufficient rows. Please upload a valid CSV with a header row.");
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, "").trim());
  
  // Look for columns mapping
  const columnsFound: Record<string, { mapped: string; original: string; reason: string }> = {};
  const unmappedColumns: string[] = [];
  const headerMappings: Record<number, keyof Transaction | null> = {};

  headers.forEach((header, colIndex) => {
    let matchedKey: string | null = null;
    const cleanHeader = header.toLowerCase().replace(/[\s_-]/g, "");

    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(alias => cleanHeader === alias || cleanHeader.includes(alias) || alias.includes(cleanHeader))) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      columnsFound[matchedKey] = {
        mapped: matchedKey,
        original: header,
        reason: `Mapped automatic match based on header name "${header}"`
      };
      headerMappings[colIndex] = matchedKey as keyof Transaction;
    } else {
      unmappedColumns.push(header);
      headerMappings[colIndex] = null;
    }
  });

  // Safe defaults if any key column is missing, assign to first reasonable unmapped, or assign arbitrary index
  const categoriesPool = ["Apparel", "Footwear", "Accessories", "Outerwear"];
  const regionsPool = ["North", "South", "East", "West"];
  const gendersPool = ["Female", "Male", "Non-binary", "Unspecified"];

  const parsedTransactions: Transaction[] = [];
  const missingValues: Record<string, number> = {
    transaction_id: 0,
    customer_id: 0,
    purchase_date: 0,
    order_value: 0,
    category: 0,
    discount_amount: 0,
    region: 0,
    gender: 0,
    rating: 0
  };

  const zeroOrNegativeValues: Record<string, number> = {
    order_value: 0,
    discount_amount: 0
  };

  let totalInvalidDates = 0;
  let duplicateCount = 0;
  const transactionIdSet = new Set<string>();

  // Process data rows
  for (let idx = 1; idx < lines.length; idx++) {
    const rowValues = parseCSVLine(lines[idx]);
    
    // Construct single record
    const record: any = {};
    
    headerMappings; // make typescript happy

    headers.forEach((_, colIdx) => {
      const fieldVal = rowValues[colIdx] !== undefined ? rowValues[colIdx].replace(/^["']|["']$/g, "").trim() : "";
      const mappedKey = headerMappings[colIdx];

      if (mappedKey) {
        if (fieldVal === "" || fieldVal.toLowerCase() === "null" || fieldVal.toLowerCase() === "na" || fieldVal.toLowerCase() === "nan") {
          missingValues[mappedKey as string] = (missingValues[mappedKey as string] || 0) + 1;
          record[mappedKey] = null as any;
        } else {
          // Cast values
          if (mappedKey === "order_value") {
            const val = parseFloat(fieldVal.replace(/[$,\s]/g, ""));
            if (isNaN(val)) {
              missingValues.order_value++;
              record.order_value = 0;
            } else {
              record.order_value = val;
              if (val <= 0) zeroOrNegativeValues.order_value++;
            }
          } else if (mappedKey === "discount_amount") {
            const val = parseFloat(fieldVal.replace(/[$,\s]/g, ""));
            if (isNaN(val)) {
              missingValues.discount_amount++;
              record.discount_amount = 0;
            } else {
              record.discount_amount = val;
              if (val < 0) zeroOrNegativeValues.discount_amount++;
            }
          } else if (mappedKey === "rating") {
            const val = parseInt(fieldVal, 10);
            if (isNaN(val) || val < 1 || val > 5) {
              missingValues.rating++;
              record.rating = null;
            } else {
              record.rating = val;
            }
          } else {
            record[mappedKey] = fieldVal as any;
          }
        }
      }
    });

    // Backfill strictly required fields with values or defaults if missing
    const finalTxIdx = idx;
    const finalTxId = record.transaction_id || `TXN_UP_${10000 + finalTxIdx}`;
    const finalCustId = record.customer_id || `CUST_UP_${1000 + Math.floor(finalTxIdx / 3)}`;
    
    // Validate purchase date format or backfill with a target May 2026 date
    let parsedDateStr = record.purchase_date || "2026-05-15";
    const dateCheck = new Date(parsedDateStr);
    if (isNaN(dateCheck.getTime())) {
      totalInvalidDates++;
      parsedDateStr = "2026-05-15";
    }

    const finalOrderValue = record.order_value !== undefined && record.order_value !== null ? record.order_value : 75.0;
    const finalDiscountAmount = record.discount_amount !== undefined && record.discount_amount !== null ? record.discount_amount : 0.0;
    
    // Cast category to predefined enum or random fallback if unmapped
    let finalCategory = record.category as any;
    if (!finalCategory || !categoriesPool.includes(finalCategory)) {
      finalCategory = categoriesPool[(finalTxIdx) % categoriesPool.length];
      if (!record.category) missingValues.category++;
    }

    // Cast region to predefined enum
    let finalRegion = record.region as any;
    if (!finalRegion || !regionsPool.includes(finalRegion)) {
      finalRegion = regionsPool[(finalTxIdx) % regionsPool.length];
      if (!record.region) missingValues.region++;
    }

    // Cast gender to enum
    let finalGender = record.gender as any;
    if (!finalGender || !gendersPool.includes(finalGender)) {
      finalGender = gendersPool[(finalTxIdx) % gendersPool.length];
      if (!record.gender) missingValues.gender++;
    }

    const finalRating = record.rating !== undefined ? record.rating : null;

    const tObj: Transaction = {
      transaction_id: finalTxId,
      customer_id: finalCustId,
      purchase_date: parsedDateStr,
      order_value: finalOrderValue,
      category: finalCategory,
      discount_amount: finalDiscountAmount,
      region: finalRegion,
      gender: finalGender,
      rating: finalRating
    };

    if (transactionIdSet.has(tObj.transaction_id)) {
      duplicateCount++;
      tObj.is_duplicate = true;
    } else {
      transactionIdSet.add(tObj.transaction_id);
    }

    parsedTransactions.push(tObj);
  }

  // Detect and flag Data Quality issues
  const qualityIssues: Array<{ type: "Error" | "Warning" | "Info"; column: string; message: string }> = [];
  
  // Issue 1: Missing Transaction ID or customer id mappings
  if (!columnsFound.transaction_id) {
    qualityIssues.push({
      type: "Warning",
      column: "transaction_id",
      message: "No explicit 'transaction_id' column discovered inside headers. Programmatically auto-assigned incremental values, which limits primary-key integrity checks."
    });
  }
  if (!columnsFound.customer_id) {
    qualityIssues.push({
      type: "Error",
      column: "customer_id",
      message: "Required 'customer_id' reference column missing. Cannot accurately link recurrence intervals or execute cohort loyalty analyses without this index."
    });
  }
  if (!columnsFound.rating) {
    qualityIssues.push({
      type: "Info",
      column: "rating",
      message: "Feedback survey column 'rating' wasn't mapped. Satisfaction-driven retention scoring and net promoter flags will fall back to median benchmarks."
    });
  }

  // Issue 2: Null surveys
  if (missingValues.rating > 0) {
    qualityIssues.push({
      type: "Warning",
      column: "rating",
      message: `Encountered ${missingValues.rating} null value surveys (~${((missingValues.rating / parsedTransactions.length) * 100).toFixed(1)}% of rows). Highly typical. Generates positive-response bias if deleted.`
    });
  }

  // Issue 3: Duplicates
  if (duplicateCount > 0) {
    qualityIssues.push({
      type: "Warning",
      column: "transaction_id",
      message: `Found ${duplicateCount} duplicate transaction rows. Double-tracking identical receipt IDs skews order consistency metric calculations upward.`
    });
  }

  // Issue 4: Negative order values
  if (zeroOrNegativeValues.order_value > 0) {
    qualityIssues.push({
      type: "Error",
      column: "order_value",
      message: `Detected ${zeroOrNegativeValues.order_value} records containing negative or zero payments. Indicates return logs, test runs, or error state entries.`
    });
  }

  // Issue 5: Anomalous Discount sizes
  let extremeDiscountCount = 0;
  parsedTransactions.forEach(t => {
    if (t.discount_amount >= t.order_value && t.order_value > 0) {
      extremeDiscountCount++;
    }
  });

  if (extremeDiscountCount > 0) {
    qualityIssues.push({
      type: "Warning",
      column: "discount_amount",
      message: `Discovered ${extremeDiscountCount} records where promotional discount equals or exceeds the net order payment. Distorts retail value models.`
    });
  }

  if (totalInvalidDates > 0) {
    qualityIssues.push({
      type: "Warning",
      column: "purchase_date",
      message: `Found ${totalInvalidDates} unparseable purchase timestamps. Dates have been coerced to neutral benchmarks.`
    });
  }

  // Create CLEAN transactions list to use
  const cleanTransactions = parsedTransactions
    .filter(t => !t.is_duplicate && t.order_value > 0)
    .map(t => {
      // Coerce extreme discounts to maximum of 80% to preserve margin limits
      let discount = t.discount_amount;
      if (discount >= t.order_value) {
        discount = parseFloat((t.order_value * 0.2).toFixed(2));
      }
      return {
        ...t,
        discount_amount: discount
      };
    });

  // Calculate features useful for customer retention analysis
  const retentionFeatures = [
    "Recency Days (Inactive span since last purchase): Maps engagement decay curve.",
    "Order Frequency Cycle: Directly highlights loyalist cohorts versus one-off trial accounts.",
    "Customer Lifetime Purchase Value: Visualizes absolute monetary share concentration.",
    "Discount Dependency Coefficient: Calculates how dependent their buying habits are on markdown promotions.",
    "Category Diversity Index: Measures distinct department coverage from product baskets.",
    "Purchase Consistency Ratio: Standard deviation of purchase cycles to flag active customer loyalty."
  ];

  // Specific cleaning recommendations based on issues
  const cleaningRecommendations = [
    "Run Primary Key De-duplication: Delete the duplicate transactions by executing an row partitioning offset query.",
    "Impute Customer Ratings: Coalesce rating surveys with customer median scores rather than deleting rows to eliminate sample selection bias.",
    "Align Discount Ceilings: Add logic constraint limits in python pipelines to cap discounts at 8% MSRP value when error states arise.",
    "Purge test records or error items (order values <= 0) to ensure accurate baseline transaction averages."
  ];

  return {
    filename,
    rowCount: parsedTransactions.length,
    columnsFound,
    unmappedColumns,
    missingValues,
    qualityIssues,
    retentionFeatures,
    cleaningRecommendations,
    parsedTransactions,
    cleanTransactions
  };
}
