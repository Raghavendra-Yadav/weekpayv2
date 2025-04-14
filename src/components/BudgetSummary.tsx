import { BudgetEntry } from "@/types/budget";
import {
  formatCurrency,
  getExchangeRate,
  convertCurrencyRealtime,
} from "@/utils/budgetUtils";
import { useState, useMemo, useEffect } from "react";

interface BudgetSummaryProps {
  entries: BudgetEntry[];
}

type MonthKey = string; // Format: "YYYY-MM"
type MonthData = {
  month: string;
  year: number;
  weeklyData: {
    [week: number]: {
      needs: number;
      wants: number;
      savings: number;
      total: number;
    };
  };
  totals: {
    needs: number;
    wants: number;
    savings: number;
    total: number;
  };
};

export default function BudgetSummary({ entries }: BudgetSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showConversion, setShowConversion] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(83.13); // Default fallback rate
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);

  // Group entries by month and calculate monthly totals
  const monthlyData = useMemo(() => {
    const data: Record<MonthKey, MonthData> = {};

    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${entry.year}-${entry.month + 1}`;
      const monthName = date.toLocaleString("default", { month: "long" });

      if (!data[monthKey]) {
        data[monthKey] = {
          month: monthName,
          year: entry.year,
          weeklyData: {},
          totals: {
            needs: 0,
            wants: 0,
            savings: 0,
            total: 0,
          },
        };
      }

      // Update weekly data
      if (!data[monthKey].weeklyData[entry.week]) {
        data[monthKey].weeklyData[entry.week] = {
          needs: 0,
          wants: 0,
          savings: 0,
          total: 0,
        };
      }

      data[monthKey].weeklyData[entry.week].needs += entry.needs;
      data[monthKey].weeklyData[entry.week].wants += entry.wants;
      data[monthKey].weeklyData[entry.week].savings += entry.savings;
      data[monthKey].weeklyData[entry.week].total += entry.weeklyPay;

      // Update monthly totals
      data[monthKey].totals.needs += entry.needs;
      data[monthKey].totals.wants += entry.wants;
      data[monthKey].totals.savings += entry.savings;
      data[monthKey].totals.total += entry.weeklyPay;
    });

    return data;
  }, [entries]);

  // Set default selected month to the most recent month
  useMemo(() => {
    if (Object.keys(monthlyData).length > 0 && !selectedMonth) {
      const months = Object.keys(monthlyData).sort().reverse();
      setSelectedMonth(months[0]);
    }
  }, [monthlyData, selectedMonth]);

  const months = useMemo(() => {
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        key,
        label: `${data.month} ${data.year}`,
      }))
      .sort((a, b) => (b.key > a.key ? 1 : -1));
  }, [monthlyData]);

  // Get the data for the selected month
  const selectedMonthData = selectedMonth ? monthlyData[selectedMonth] : null;

  // Default currency to USD if no entries or if the entries have different currencies
  const currency = useMemo(() => {
    const currencies = new Set(entries.map((entry) => entry.currency));
    return currencies.size === 1 ? entries[0]?.currency : "USD";
  }, [entries]);

  // Fetch exchange rates when component mounts or currency changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (currency === "USD") {
        setIsLoadingRate(true);
        try {
          const rate = await getExchangeRate("USD", "INR");
          setExchangeRate(rate);
        } catch (error) {
          console.error("Failed to fetch exchange rate:", error);
          // Keep using the default rate
        } finally {
          setIsLoadingRate(false);
        }
      }
    };

    fetchExchangeRate();
  }, [currency]);

  // Convert USD to INR with the current exchange rate
  const convertToINR = (amount: number): string => {
    return `₹${Math.round(amount * exchangeRate).toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          Monthly Budget Summary
          <div className="relative w-6 h-6 ml-2 group">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-blue-500 border-r-blue-500 border-b-violet-500 border-l-violet-500 group-hover:scale-125 group-hover:rotate-180 transition-all duration-300 cursor-pointer"></div>
            <div className="absolute inset-[3px] bg-white rounded-full"></div>

            {/* Tooltip */}
            <div className="absolute opacity-0 group-hover:opacity-100 -top-3 left-7 transform -translate-y-full w-64 bg-white shadow-lg rounded-xl p-3 text-xs text-slate-700 z-10 transition-opacity duration-300 pointer-events-none border border-slate-100">
              <div className="relative">
                <div className="absolute w-2 h-2 bg-white -bottom-3 left-0 transform -translate-x-1/2 rotate-45 border-b border-r border-slate-100"></div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  50/30/20 Budget Rule
                </h4>
                <div className="flex items-center gap-2 mb-1.5 text-emerald-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">Needs: 50%</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5 text-blue-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Wants: 30%</span>
                </div>
                <div className="flex items-center gap-2 mb-2 text-violet-700">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <span className="font-medium">Savings: 20%</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5 text-[10px] leading-tight text-slate-600">
                  A simple budgeting approach to help manage your finances
                  effectively and maintain a healthy financial balance.
                </div>
              </div>
            </div>
          </div>
        </h2>

        {entries.length > 0 && (
          <div className="hidden sm:block">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {selectedMonth ? monthlyData[selectedMonth]?.month : ""}{" "}
              {selectedMonth ? monthlyData[selectedMonth]?.year : ""}
            </span>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-slate-500 py-8">
          No budget entries yet. Start by adding your weekly budgets.
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="month-select"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Select Month
              </label>
              <div className="relative">
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10 transition-all duration-200 hover:border-indigo-300"
                >
                  {months.map((month) => (
                    <option key={month.key} value={month.key}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {currency === "USD" && (
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 transition-all duration-200">
                  <span className="text-sm font-medium text-slate-700">
                    Show INR conversion
                  </span>
                  <div className="relative inline-block w-11 align-middle select-none">
                    <input
                      type="checkbox"
                      id="toggle"
                      checked={showConversion}
                      onChange={() => setShowConversion(!showConversion)}
                      className="sr-only peer"
                    />
                    <div className="h-6 w-11 bg-slate-200 rounded-full peer peer-checked:bg-indigo-500 transition-all duration-200"></div>
                    <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full shadow transition-all duration-200 peer-checked:left-5.5 peer-checked:translate-x-full"></div>
                  </div>
                  {isLoadingRate && (
                    <span className="ml-1 text-xs text-slate-500 animate-pulse flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading rates
                    </span>
                  )}
                </label>
              </div>
            )}
          </div>

          {selectedMonthData && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Week
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Needs (50%)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Wants (30%)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Savings (20%)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {[1, 2, 3, 4].map((week) => {
                      const weekData = selectedMonthData.weeklyData[week];

                      if (!weekData) {
                        return (
                          <tr key={week} className="bg-slate-50/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              Week {week}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              -
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={week}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                            Week {week}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {formatCurrency(weekData.needs, currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {formatCurrency(weekData.wants, currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {formatCurrency(weekData.savings, currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {formatCurrency(weekData.total, currency)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-indigo-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                        Monthly Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700">
                        {formatCurrency(
                          selectedMonthData.totals.needs,
                          currency
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                        {formatCurrency(
                          selectedMonthData.totals.wants,
                          currency
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-violet-700">
                        {formatCurrency(
                          selectedMonthData.totals.savings,
                          currency
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {formatCurrency(
                          selectedMonthData.totals.total,
                          currency
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium text-slate-700">
                      Monthly Needs
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800 mb-1">
                    {formatCurrency(selectedMonthData.totals.needs, currency)}
                  </p>
                  {showConversion && currency === "USD" && (
                    <p className="text-xs font-medium text-emerald-700 mb-1">
                      ≈ {convertToINR(selectedMonthData.totals.needs)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {Math.round(
                      (selectedMonthData.totals.needs /
                        selectedMonthData.totals.total) *
                        100
                    )}
                    % of monthly income
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-slate-700">
                      Monthly Wants
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800 mb-1">
                    {formatCurrency(selectedMonthData.totals.wants, currency)}
                  </p>
                  {showConversion && currency === "USD" && (
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      ≈ {convertToINR(selectedMonthData.totals.wants)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {Math.round(
                      (selectedMonthData.totals.wants /
                        selectedMonthData.totals.total) *
                        100
                    )}
                    % of monthly income
                  </p>
                </div>

                <div className="bg-violet-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                    <span className="text-sm font-medium text-slate-700">
                      Monthly Savings
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800 mb-1 group relative">
                    {formatCurrency(selectedMonthData.totals.savings, currency)}
                    {currency === "USD" && (
                      <span className="absolute opacity-0 group-hover:opacity-100 bottom-6 left-0 bg-white shadow-lg rounded-md p-2 text-xs text-slate-700 w-48 z-10 transition-opacity duration-200 pointer-events-none border border-slate-100">
                        <span className="font-medium">
                          USD to INR Conversion:
                        </span>
                        <br />
                        $1 USD ≈ {exchangeRate.toFixed(2)} INR
                        <br />${selectedMonthData.totals.savings.toFixed(
                          2
                        )} ≈ {convertToINR(selectedMonthData.totals.savings)}
                      </span>
                    )}
                  </p>
                  {currency === "USD" && (
                    <p className="text-xs font-medium text-violet-700 mb-1">
                      ≈ {convertToINR(selectedMonthData.totals.savings)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {Math.round(
                      (selectedMonthData.totals.savings /
                        selectedMonthData.totals.total) *
                        100
                    )}
                    % of monthly income
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    <span className="text-sm font-medium text-slate-700">
                      Monthly Total
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800 mb-1">
                    {formatCurrency(selectedMonthData.totals.total, currency)}
                  </p>
                  {showConversion && currency === "USD" && (
                    <p className="text-xs font-medium text-slate-700 mb-1">
                      ≈ {convertToINR(selectedMonthData.totals.total)}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Total monthly income</p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
