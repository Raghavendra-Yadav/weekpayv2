"use client";

import { BudgetEntry } from "@/types/budget";
import { formatCurrency } from "@/utils/budgetUtils";
import DonutChart from "./DonutChart";

interface BudgetCardProps {
  entry: BudgetEntry;
  onDelete: () => void;
}

export default function BudgetCard({ entry, onDelete }: BudgetCardProps) {
  const date = new Date(entry.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Week {entry.week}
          </h3>
          <p className="text-sm text-slate-500">
            {new Date(entry.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-start gap-4">
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-800">
              {formatCurrency(entry.weeklyPay, entry.currency)}
            </p>
            <p className="text-sm text-slate-500">Weekly Pay</p>
          </div>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors duration-200"
            aria-label="Delete entry"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-lg p-3 group relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-slate-700">Needs</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(entry.needs, entry.currency)}
          </p>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-emerald-50/90 rounded-lg transition-opacity duration-200 flex items-center justify-center p-2">
            <p className="text-xs text-slate-700 text-center">
              Essential expenses: housing, groceries, utilities, transportation,
              healthcare.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 group relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-slate-700">Wants</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(entry.wants, entry.currency)}
          </p>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-50/90 rounded-lg transition-opacity duration-200 flex items-center justify-center p-2">
            <p className="text-xs text-slate-700 text-center">
              Non-essential expenses: dining out, entertainment, shopping,
              subscriptions, hobbies.
            </p>
          </div>
        </div>

        <div className="bg-violet-50 rounded-lg p-3 group relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-violet-500"></div>
            <span className="text-sm font-medium text-slate-700">Savings</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(entry.savings, entry.currency)}
          </p>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-violet-50/90 rounded-lg transition-opacity duration-200 flex items-center justify-center p-2">
            <p className="text-xs text-slate-700 text-center">
              Future security: emergency fund, retirement accounts, investments,
              debt payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
