"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Layout from "@/components/Layout";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  weekId: string;
}

interface BudgetEntry {
  id: string;
  week: number;
  date: string;
  weeklyPay: number;
  needs: number;
  wants: number;
  savings: number;
  currency: string;
}

const defaultCategories = ["Needs", "Wants", "Savings"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Needs");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load budget entries from API
  useEffect(() => {
    const fetchBudgetEntries = async () => {
      try {
        const response = await fetch("/api/budget");
        if (!response.ok) {
          throw new Error("Failed to fetch budget entries");
        }
        const data = await response.json();
        setBudgetEntries(data);

        // Set the selected week to the most recent one if available
        if (data.length > 0) {
          setSelectedWeek(data[data.length - 1].id);
        }
      } catch (error) {
        console.error("Error fetching budget entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetEntries();
  }, []);

  // Load expenses from API
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/expenses");
        if (!response.ok) {
          throw new Error("Failed to fetch expenses");
        }
        const data = await response.json();
        // Validate expense data
        const validatedExpenses = data.map((expense: any) => ({
          ...expense,
          amount: expense.amount ? parseFloat(expense.amount) : 0,
          date: expense.date || new Date().toISOString(),
          category: expense.category || "Uncategorized",
          description: expense.description || "No description",
        }));
        setExpenses(validatedExpenses);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while loading expenses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;

    // Validate form data
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (!category) {
      setError("Please select a category");
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount,
      category,
      description: description.trim(),
      date: new Date().toISOString(),
      weekId: selectedWeek,
    };

    try {
      setError(null);
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) {
        throw new Error("Failed to save expense");
      }

      const savedExpense = await response.json();
      setExpenses((prev) => [...prev, savedExpense]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  // Get expenses for the selected week
  const weekExpenses = expenses.filter(
    (expense) => expense.weekId === selectedWeek
  );

  // Calculate spending by category for the selected week
  const spendingByCategory = {
    Needs: weekExpenses
      .filter((e) => e.category === "Needs")
      .reduce((sum, e) => sum + e.amount, 0),
    Wants: weekExpenses
      .filter((e) => e.category === "Wants")
      .reduce((sum, e) => sum + e.amount, 0),
    Savings: weekExpenses
      .filter((e) => e.category === "Savings")
      .reduce((sum, e) => sum + e.amount, 0),
  };

  // Get the selected budget entry
  const selectedBudgetEntry = budgetEntries.find(
    (entry) => entry.id === selectedWeek
  );

  // Calculate percentage of budget used for each category
  const getBudgetPercentage = (category: string) => {
    if (!selectedBudgetEntry) return 0;

    const budgetAmount =
      category === "Needs"
        ? selectedBudgetEntry.needs
        : category === "Wants"
        ? selectedBudgetEntry.wants
        : selectedBudgetEntry.savings;

    const spentAmount =
      category === "Needs"
        ? spendingByCategory.Needs
        : category === "Wants"
        ? spendingByCategory.Wants
        : spendingByCategory.Savings;

    return budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  };

  // Get color based on percentage of budget used
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-emerald-500";
    if (percentage < 80) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Expense Tracking</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Expense Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setShowCustomCategory(true);
                      } else {
                        setShowCustomCategory(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="Needs">Needs</option>
                    <option value="Wants">Wants</option>
                    <option value="Savings">Savings</option>
                    <option value="custom">Custom Category</option>
                  </select>
                </div>

                {showCustomCategory && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Custom Category
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Budget Week
                  </label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a budget week</option>
                    {budgetEntries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        Week {entry.week} -{" "}
                        {format(new Date(entry.date), "MMM dd, yyyy")}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Expense
                </button>
              </form>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Budget Overview</h2>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : selectedBudgetEntry ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      Week {selectedBudgetEntry.week} -{" "}
                      {format(
                        new Date(selectedBudgetEntry.date),
                        "MMM dd, yyyy"
                      )}
                    </h3>
                    <span className="text-sm font-medium text-gray-500">
                      Weekly Pay: ${selectedBudgetEntry.weeklyPay.toFixed(2)}
                    </span>
                  </div>

                  {/* Needs Progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-emerald-700">
                        Needs (50%)
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        ${spendingByCategory.Needs.toFixed(2)} / $
                        {selectedBudgetEntry.needs.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(
                          getBudgetPercentage("Needs")
                        )}`}
                        style={{
                          width: `${Math.min(
                            getBudgetPercentage("Needs"),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getBudgetPercentage("Needs").toFixed(1)}% of budget used
                    </p>
                  </div>

                  {/* Wants Progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-blue-700">
                        Wants (30%)
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        ${spendingByCategory.Wants.toFixed(2)} / $
                        {selectedBudgetEntry.wants.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(
                          getBudgetPercentage("Wants")
                        )}`}
                        style={{
                          width: `${Math.min(
                            getBudgetPercentage("Wants"),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getBudgetPercentage("Wants").toFixed(1)}% of budget used
                    </p>
                  </div>

                  {/* Savings Progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-violet-700">
                        Savings (20%)
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        ${spendingByCategory.Savings.toFixed(2)} / $
                        {selectedBudgetEntry.savings.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(
                          getBudgetPercentage("Savings")
                        )}`}
                        style={{
                          width: `${Math.min(
                            getBudgetPercentage("Savings"),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getBudgetPercentage("Savings").toFixed(1)}% of budget
                      used
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {budgetEntries.length === 0
                    ? "No budget entries found. Please create a budget first."
                    : "Please select a budget week to view the overview."}
                </div>
              )}
            </div>

            {/* Expenses List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
              <div className="space-y-4">
                {weekExpenses.length > 0 ? (
                  weekExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{expense.description}</h3>
                          <p className="text-sm text-gray-600">
                            {format(expense.date, "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            $
                            {expense.amount
                              ? expense.amount.toFixed(2)
                              : "0.00"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {expense.category}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="ml-4 text-gray-400 hover:text-red-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {selectedWeek
                      ? "No expenses for this week yet"
                      : "Please select a budget week to view expenses"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
