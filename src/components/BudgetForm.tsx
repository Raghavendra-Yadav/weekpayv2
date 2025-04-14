"use client";

import { useState } from "react";
import { BudgetEntry } from "@/types/budget";
import {
  calculateBudgetBreakdown,
  formatCurrency,
  getWeekOfMonth,
} from "@/utils/budgetUtils";

interface BudgetFormProps {
  onSubmit: (entry: BudgetEntry) => void;
  existingEntries: BudgetEntry[];
}

export default function BudgetForm({
  onSubmit,
  existingEntries,
}: BudgetFormProps) {
  const [weeklyPay, setWeeklyPay] = useState<string>("");
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFloat(weeklyPay);
    if (isNaN(payAmount) || payAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const selectedDate = new Date(date);
    const { week, month, year } = getWeekOfMonth(selectedDate);

    const hasExistingEntry = existingEntries.some((entry) => {
      const entryDate = new Date(entry.date);
      const entryWeekInfo = getWeekOfMonth(entryDate);
      return (
        entryWeekInfo.month === month &&
        entryWeekInfo.year === year &&
        entryWeekInfo.week === week
      );
    });

    if (hasExistingEntry) {
      setError(
        `An entry for Week ${week} already exists in ${month + 1}/${year}`
      );
      return;
    }

    setError("");
    const breakdown = calculateBudgetBreakdown(payAmount);
    const entry: BudgetEntry = {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      weeklyPay: payAmount,
      currency,
      week,
      month,
      year,
      ...breakdown,
    };

    onSubmit(entry);
    setWeeklyPay("");
  };

  const handlePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setWeeklyPay(value);
      setError("");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    setError("");

    const selectedDate = new Date(newDate);
    const { week, month, year } = getWeekOfMonth(selectedDate);

    const hasExistingEntry = existingEntries.some((entry) => {
      const entryDate = new Date(entry.date);
      const entryWeekInfo = getWeekOfMonth(entryDate);
      return (
        entryWeekInfo.month === month &&
        entryWeekInfo.year === year &&
        entryWeekInfo.week === week
      );
    });

    if (hasExistingEntry) {
      setError(`Week ${week} already has an entry in ${month + 1}/${year}`);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
        Enter Weekly Pay
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="weeklyPay"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Weekly Pay
            </label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-slate-400 sm:text-sm">
                  {currency === "USD" ? "$" : "₹"}
                </span>
              </div>
              <input
                type="text"
                name="weeklyPay"
                id="weeklyPay"
                value={weeklyPay}
                onChange={handlePayChange}
                className={`block w-full pl-8 pr-12 py-2.5 sm:text-sm rounded-xl border ${
                  isFocused
                    ? "border-indigo-500 ring-2 ring-indigo-100"
                    : "border-slate-200"
                } focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all duration-200 ${
                  error ? "border-red-300" : ""
                }`}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={handleDateChange}
              className={`mt-1 block w-full pl-3.5 pr-10 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl bg-white transition-all duration-200 ${
                error ? "border-red-300" : ""
              }`}
              required
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "USD" | "INR")}
            className="mt-1 block w-full pl-3.5 pr-10 py-2.5 text-sm border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl bg-white transition-all duration-200"
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!!error}
          className={`w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white ${
            error
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 border border-indigo-600`}
        >
          Calculate Budget
        </button>
      </form>

      {!error && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-3">
            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
            Budget Breakdown
            <div className="relative w-5 h-5 group">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-blue-500 border-r-blue-500 border-b-violet-500 border-l-violet-500 group-hover:scale-125 group-hover:rotate-180 transition-all duration-300 cursor-pointer"></div>
              <div className="absolute inset-[3px] bg-white rounded-full"></div>

              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 -top-3 left-6 transform -translate-y-full w-44 bg-white shadow-lg rounded-xl p-2 text-xs text-slate-700 z-10 transition-opacity duration-300 pointer-events-none border border-slate-100">
                <div className="relative">
                  <div className="absolute w-2 h-2 bg-white -bottom-3 left-0 transform -translate-x-1/2 rotate-45 border-b border-r border-slate-100"></div>
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-medium">Needs: 50%</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 text-blue-700">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium">Wants: 30%</span>
                  </div>
                  <div className="flex items-center gap-2 text-violet-700">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                    <span className="font-medium">Savings: 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </h3>
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Needs (50%)
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(
                    calculateBudgetBreakdown(parseFloat(weeklyPay) || 0).needs,
                    currency
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 pl-4">
                Essential expenses: housing, groceries, utilities,
                transportation, healthcare, and minimum debt payments.
              </p>
            </div>
            <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Wants (30%)
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(
                    calculateBudgetBreakdown(parseFloat(weeklyPay) || 0).wants,
                    currency
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 pl-4">
                Non-essential expenses: dining out, entertainment, shopping,
                subscriptions, hobbies, and travel.
              </p>
            </div>
            <div className="flex flex-col p-3 bg-white rounded-lg shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Savings (20%)
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(
                    calculateBudgetBreakdown(parseFloat(weeklyPay) || 0)
                      .savings,
                    currency
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 pl-4">
                Future security: emergency fund, retirement accounts,
                investments, and additional debt payments.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
