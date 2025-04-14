export interface BudgetEntry {
  id: string;
  date: string;
  weeklyPay: number;
  currency: "USD" | "INR";
  week: number;
  month: number;
  year: number;
  needs: number;
  wants: number;
  savings: number;
}

export interface BudgetSummary {
  totalNeeds: number;
  totalWants: number;
  totalSavings: number;
  averageWeeklyPay: number;
  currency: "USD" | "INR";
}

export interface BudgetInsight {
  type: "suggestion" | "anomaly" | "prediction";
  message: string;
  severity: "low" | "medium" | "high";
  category: "needs" | "wants" | "savings";
}

export interface CurrencyConversion {
  usdToInr: number;
  lastUpdated: string;
}
