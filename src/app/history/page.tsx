"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import BudgetCard from "@/components/BudgetCard";
import { BudgetEntry } from "@/types/budget";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/utils/budgetUtils";

type SortOption = "date" | "amount" | "week";

export default function HistoryPage() {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredAndSortedEntries = budgetEntries
    .filter((entry) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase().trim();
      const weekMatch = entry.week.toString() === searchLower;
      const dateMatch = new Date(entry.date)
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        .toLowerCase()
        .includes(searchLower);
      return weekMatch || dateMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount":
          return b.weeklyPay - a.weeklyPay;
        case "week":
          return b.week - a.week;
        default:
          return 0;
      }
    });

  return (
    <Layout>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-slate-800"
            >
              Budget History
            </motion.h1>

            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by week or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <svg
                  className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="week">Sort by Week</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-[400px] bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </motion.div>
          ) : budgetEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[400px] bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 p-8 text-center"
            >
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
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  Budget Entries
                </h2>
                <span className="text-sm text-slate-500">
                  {filteredAndSortedEntries.length} entries
                </span>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredAndSortedEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                    >
                      <BudgetCard
                        entry={entry}
                        onDelete={() => handleDelete(entry.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </motion.main>
    </Layout>
  );
}
