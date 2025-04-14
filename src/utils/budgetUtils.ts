import { BudgetEntry, BudgetSummary } from "@/types/budget";

const NEEDS_PERCENTAGE = 0.5;
const WANTS_PERCENTAGE = 0.3;
const SAVINGS_PERCENTAGE = 0.2;

export const calculateBudgetBreakdown = (
  weeklyPay: number
): {
  needs: number;
  wants: number;
  savings: number;
} => {
  return {
    needs: weeklyPay * NEEDS_PERCENTAGE,
    wants: weeklyPay * WANTS_PERCENTAGE,
    savings: weeklyPay * SAVINGS_PERCENTAGE,
  };
};

export const convertCurrency = (
  amount: number,
  fromCurrency: "USD" | "INR",
  toCurrency: "USD" | "INR"
): number => {
  const USD_TO_INR = 85.63; // Fixed conversion rate
  if (fromCurrency === toCurrency) return amount;
  if (fromCurrency === "USD") return amount * USD_TO_INR;
  return amount / USD_TO_INR;
};

export const calculateBudgetSummary = (
  entries: BudgetEntry[]
): BudgetSummary => {
  const totalNeeds = entries.reduce((sum, entry) => sum + entry.needs, 0);
  const totalWants = entries.reduce((sum, entry) => sum + entry.wants, 0);
  const totalSavings = entries.reduce((sum, entry) => sum + entry.savings, 0);
  const averageWeeklyPay =
    entries.reduce((sum, entry) => sum + entry.weeklyPay, 0) / entries.length;

  return {
    totalNeeds,
    totalWants,
    totalSavings,
    averageWeeklyPay,
    currency: entries[0]?.currency || "USD",
  };
};

export const formatCurrency = (
  amount: number,
  currency: "USD" | "INR"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export function getWeekOfMonth(date: Date): {
  week: number;
  month: number;
  year: number;
} {
  const dayOfMonth = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();

  // If it's past the 28th, consider it part of week 1 of next month
  if (dayOfMonth > 28) {
    month = (month + 1) % 12;
    if (month === 0) {
      year++;
    }
    return { week: 1, month, year };
  }

  // Regular week calculation for days 1-28
  if (dayOfMonth <= 7) return { week: 1, month, year };
  if (dayOfMonth <= 14) return { week: 2, month, year };
  if (dayOfMonth <= 21) return { week: 3, month, year };
  return { week: 4, month, year }; // days 22-28
}

// Cache for exchange rates
let exchangeRatesCache: {
  rates: Record<string, number>;
  lastUpdated: number;
} | null = null;

// Function to get exchange rates with caching
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    // Check if we have cached rates that are less than 1 hour old
    const now = Date.now();
    if (exchangeRatesCache && now - exchangeRatesCache.lastUpdated < 3600000) {
      return (
        exchangeRatesCache.rates[toCurrency] /
        exchangeRatesCache.rates[fromCurrency]
      );
    }

    // Fetch new rates
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();

    if (data.result === "success") {
      // Update cache
      exchangeRatesCache = {
        rates: data.rates,
        lastUpdated: now,
      };

      // Return the conversion rate
      return (
        exchangeRatesCache.rates[toCurrency] /
        exchangeRatesCache.rates[fromCurrency]
      );
    } else {
      // Fallback to hardcoded rate if API fails
      return fromCurrency === "USD" && toCurrency === "INR" ? 83.13 : 1;
    }
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Fallback to hardcoded rate if API fails
    return fromCurrency === "USD" && toCurrency === "INR" ? 83.13 : 1;
  }
}

// Function to convert currency with real-time rates
export async function convertCurrencyRealtime(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}
