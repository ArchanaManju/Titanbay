export interface Fund {
  id: string;
  name: string;
  vintage_year: number;
  target_size_usd: number;
  status: "Fundraising" | "Investing" | "Closed";
  created_at: string;
}

export interface Investor {
  id: string;
  name: string;
  investor_type: "Individual" | "Institution" | "Family Office";
  email: string;
  created_at: string;
}

export interface Investment {
  id: string;
  investor_id: string;
  fund_id: string;
  amount_usd: number;
  investment_date: string;
  created_at?: string;
}

export interface Transaction {
  transaction_id: string;
  fund_id: string;
  amount: string;
  fee_percentage: number;
  calculated_fees?: number;
  status: "completed" | "pending" | "reversed";
  reversed_at?: string;
  created_at: string;
}