"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import BudgetHistory from "@/components/BudgetHistory";
import BudgetForm from "@/components/BudgetForm";
import BudgetSummary from "@/components/BudgetSummary";
import { BudgetEntry } from "@/types/budget";

export default function Home() {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBudgetEntries();
  }, []);

  const fetchBudgetEntries = async () => {
    try {
      const response = await fetch("/api/budget");
      const data = await response.json();
      setBudgetEntries(data);
    } catch (error) {
      console.error("Failed to fetch budget entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (entry: BudgetEntry) => {
    try {
      const response = await fetch("/api/budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error("Failed to save budget entry");
      }

      setBudgetEntries((prev) => [...prev, entry]);
    } catch (error) {
      console.error("Error saving budget entry:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/budget/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete budget entry");
      }

      setBudgetEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Error deleting budget entry:", error);
      alert("Failed to delete the budget entry. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-800">
              WeekPay Dashboard
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Your AI-powered personal budgeting assistant. Track your weekly
              expenses and maintain a healthy financial balance.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              The 50/30/20 Budget Rule
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-emerald-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <h3 className="font-medium text-slate-800">Needs (50%)</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Essential expenses you can't avoid: rent/mortgage, utilities,
                  groceries, transportation, insurance, healthcare, and minimum
                  debt payments.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h3 className="font-medium text-slate-800">Wants (30%)</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Non-essential expenses that improve your life: dining out,
                  entertainment, shopping, subscriptions, hobbies, travel, and
                  other lifestyle choices.
                </p>
              </div>
              <div className="bg-violet-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <h3 className="font-medium text-slate-800">Savings (20%)</h3>
                </div>
                <p className="text-slate-600 text-xs">
                  Future security and financial goals: emergency fund,
                  retirement accounts, investments, education, major purchases,
                  and additional debt payments.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <BudgetForm
              onSubmit={handleSubmit}
              existingEntries={budgetEntries}
            />
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px] bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : budgetEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                <svg
                  className="w-16 h-16 text-slate-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No Budget Entries Yet
                </h3>
                <p className="text-slate-600">
                  Start by entering your weekly pay to track your budget.
                </p>
              </div>
            ) : (
              <BudgetHistory
                entries={budgetEntries}
                onDeleteEntry={handleDelete}
              />
            )}
          </div>

          {budgetEntries.length > 0 && (
            <div className="col-span-full">
              <BudgetSummary entries={budgetEntries} />
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
