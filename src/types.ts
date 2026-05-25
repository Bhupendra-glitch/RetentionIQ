export interface Transaction {
  transaction_id: string;
  customer_id: string;
  purchase_date: string;
  order_value: number;
  category: "Apparel" | "Footwear" | "Accessories" | "Outerwear";
  discount_amount: number;
  region: "North" | "South" | "East" | "West";
  gender: "Female" | "Male" | "Non-binary" | "Unspecified";
  rating: number | null; // NULL represents missing rating
  is_duplicate?: boolean; // for illustrating data issues
}

export interface CustomerFeature {
  customer_id: string;
  recency: number; // days since last order (as of 2026-05-25)
  frequency: number; // total orders
  monetary_value: number; // total spent
  aov: number; // average order value
  discount_dependency: number; // total discount / total gross value
  category_diversity: number; // count of unique categories purchased
  clp_score: number; // Customer Lifetime Proxy (1-100 score combining Recency, Freq, Value)
  purchase_consistency: number; // percentage consistency of shopping intervals (higher is more consistent)
  retention_prob: number; // probability score 0-100 based on recency + satisfaction
  satisfaction_flag: "High (4.5+)" | "Medium (3.0-4.4)" | "Low (<3.0)" | "No Rating";
}

export interface SQLQueryResult {
  columns: string[];
  rows: any[];
}

export interface SQLQuerySelector {
  id: string;
  title: string;
  query: string;
  logic: string;
  insight: string;
  expectedResult: SQLQueryResult;
}

export interface LoyaltyDefinition {
  name: string;
  description: string;
  formula: string;
  advantages: string[];
  weaknesses: string[];
  businessInterpretation: string;
  validationMethod: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}
