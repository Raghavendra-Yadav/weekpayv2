"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  weekId: string;
}

interface AccountBalance {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  color: string;
  isGoalAccount?: boolean;
  goalId?: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  weeklyContribution: number;
  progress: number;
}

const COLORS = {
  needs: "#10B981", // emerald-500
  wants: "#3B82F6", // blue-500
  savings: "#8B5CF6", // violet-500
};

// Currency conversion rates (simplified for demo)
const CURRENCY_RATES = {
  USD: 1,
  INR: 83.5, // 1 USD = 83.5 INR (approximate)
};

export default function AccountsPage() {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    allocated: number;
    spent: number;
  }>({ allocated: 0, spent: 0 });
  const [insights, setInsights] = useState<{
    savingsRate: number;
    needsRatio: number;
    wantsRatio: number;
    savingsRatio: number;
    mostExpensiveCategory: string;
    mostExpensiveAmount: number;
    averageExpense: number;
    totalExpenses: number;
  }>({
    savingsRate: 0,
    needsRatio: 0,
    wantsRatio: 0,
    savingsRatio: 0,
    mostExpensiveCategory: "",
    mostExpensiveAmount: 0,
    averageExpense: 0,
    totalExpenses: 0,
  });
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    name: string;
    targetAmount: number;
    deadline: string;
    category: string;
  }>({
    name: "",
    targetAmount: 0,
    deadline: "",
    category: "Savings",
  });

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
      } catch (error) {
        console.error("Error fetching budget entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetEntries();
  }, []);

  // Load expenses from localStorage
  useEffect(() => {
    const loadExpenses = () => {
      const storedExpenses = localStorage.getItem("expenses");
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    };

    loadExpenses();
  }, []);

  // Initialize goal accounts for existing goals
  useEffect(() => {
    if (savingsGoals.length > 0 && accountBalances.length > 0) {
      // Check if we need to create goal accounts for existing goals
      const existingGoalIds = accountBalances
        .filter((account) => account.isGoalAccount)
        .map((account) => account.goalId);

      const goalsWithoutAccounts = savingsGoals.filter(
        (goal) => !existingGoalIds.includes(goal.id)
      );

      if (goalsWithoutAccounts.length > 0) {
        // Create accounts for goals that don't have them
        const newGoalAccounts = goalsWithoutAccounts.map((goal) => ({
          name: `Goal: ${goal.name}`,
          allocated: 0,
          spent: 0,
          remaining: 0,
          color: "#8B5CF6", // violet-500
          isGoalAccount: true,
          goalId: goal.id,
        }));

        setAccountBalances((prev) => [...prev, ...newGoalAccounts]);
      }
    }
  }, [savingsGoals, accountBalances]);

  // Calculate all-time account balances and insights
  useEffect(() => {
    if (budgetEntries.length === 0) return;

    // Calculate total allocated amounts
    const totalNeedsAllocated = budgetEntries.reduce(
      (sum, entry) => sum + entry.needs,
      0
    );
    const totalWantsAllocated = budgetEntries.reduce(
      (sum, entry) => sum + entry.wants,
      0
    );
    const totalSavingsAllocated = budgetEntries.reduce(
      (sum, entry) => sum + entry.savings,
      0
    );

    // Calculate total spent amounts
    const needsSpent = expenses
      .filter((e) => e.category === "Needs")
      .reduce((sum, e) => sum + e.amount, 0);

    const wantsSpent = expenses
      .filter((e) => e.category === "Wants")
      .reduce((sum, e) => sum + e.amount, 0);

    const savingsSpent = expenses
      .filter((e) => e.category === "Savings")
      .reduce((sum, e) => sum + e.amount, 0);

    const balances: AccountBalance[] = [
      {
        name: "Needs",
        allocated: totalNeedsAllocated,
        spent: needsSpent,
        remaining: totalNeedsAllocated - needsSpent,
        color: COLORS.needs,
      },
      {
        name: "Wants",
        allocated: totalWantsAllocated,
        spent: wantsSpent,
        remaining: totalWantsAllocated - wantsSpent,
        color: COLORS.wants,
      },
      {
        name: "Savings",
        allocated: totalSavingsAllocated,
        spent: savingsSpent,
        remaining: totalSavingsAllocated - savingsSpent,
        color: COLORS.savings,
      },
    ];

    setAccountBalances(balances);

    // Calculate insights
    const totalAllocated =
      totalNeedsAllocated + totalWantsAllocated + totalSavingsAllocated;
    const totalSpent = needsSpent + wantsSpent + savingsSpent;

    // Calculate ratios
    const needsRatio =
      totalNeedsAllocated > 0 ? (needsSpent / totalNeedsAllocated) * 100 : 0;
    const wantsRatio =
      totalWantsAllocated > 0 ? (wantsSpent / totalWantsAllocated) * 100 : 0;
    const savingsRatio =
      totalSavingsAllocated > 0
        ? (savingsSpent / totalSavingsAllocated) * 100
        : 0;

    // Calculate savings rate
    const savingsRate =
      totalAllocated > 0
        ? ((totalSavingsAllocated - savingsSpent) / totalAllocated) * 100
        : 0;

    // Find most expensive category
    const categorySpending = [
      { category: "Needs", amount: needsSpent },
      { category: "Wants", amount: wantsSpent },
      { category: "Savings", amount: savingsSpent },
    ];

    const mostExpensive = categorySpending.reduce(
      (max, current) => (current.amount > max.amount ? current : max),
      { category: "", amount: 0 }
    );

    // Calculate average expense
    const averageExpense =
      expenses.length > 0 ? totalSpent / expenses.length : 0;

    setInsights({
      savingsRate,
      needsRatio,
      wantsRatio,
      savingsRatio,
      mostExpensiveCategory: mostExpensive.category,
      mostExpensiveAmount: mostExpensive.amount,
      averageExpense,
      totalExpenses: totalSpent,
    });
  }, [budgetEntries, expenses]);

  // Calculate savings goal progress
  useEffect(() => {
    if (savingsGoals.length > 0 && accountBalances.length > 0) {
      const updatedGoals = savingsGoals.map((goal) => {
        // Find the goal's dedicated account
        const goalAccount = accountBalances.find(
          (account) => account.isGoalAccount && account.goalId === goal.id
        );

        if (goalAccount) {
          // Calculate progress based on the goal account's remaining balance
          const progress = Math.min(
            (goalAccount.remaining / goal.targetAmount) * 100,
            100
          );

          // Calculate weekly contribution needed
          const deadlineDate = new Date(goal.deadline);
          const today = new Date();
          const weeksRemaining = Math.max(
            Math.ceil(
              (deadlineDate.getTime() - today.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            ),
            1
          );

          const remainingAmount = goal.targetAmount - goalAccount.remaining;
          const weeklyContribution = remainingAmount / weeksRemaining;

          return {
            ...goal,
            currentAmount: goalAccount.remaining,
            progress,
            weeklyContribution,
          };
        }

        return goal;
      });

      setSavingsGoals(updatedGoals);
    }
  }, [accountBalances, savingsGoals]);

  // Format currency based on selected currency
  const formatCurrency = (amount: number) => {
    const convertedAmount =
      currency === "INR" ? amount * CURRENCY_RATES.INR : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(convertedAmount);
  };

  // Handle edit button click
  const handleEditClick = (account: AccountBalance) => {
    setEditingAccount(account.name);
    setEditValues({
      allocated: account.allocated,
      spent: account.spent,
    });
  };

  // Handle save button click
  const handleSaveClick = () => {
    if (!editingAccount) return;

    setAccountBalances((prevBalances) =>
      prevBalances.map((account) => {
        if (account.name === editingAccount) {
          return {
            ...account,
            allocated: editValues.allocated,
            spent: editValues.spent,
            remaining: editValues.allocated - editValues.spent,
          };
        }
        return account;
      })
    );

    // Update savings goals if we're editing a goal account
    if (
      accountBalances.some(
        (account) => account.name === editingAccount && account.isGoalAccount
      )
    ) {
      const goalAccount = accountBalances.find(
        (account) => account.name === editingAccount
      );
      if (goalAccount && goalAccount.goalId) {
        setSavingsGoals((prevGoals) =>
          prevGoals.map((goal) => {
            if (goal.id === goalAccount.goalId) {
              return {
                ...goal,
                currentAmount: editValues.allocated - editValues.spent,
                progress: Math.min(
                  ((editValues.allocated - editValues.spent) /
                    goal.targetAmount) *
                    100,
                  100
                ),
              };
            }
            return goal;
          })
        );
      }
    }

    setEditingAccount(null);
  };

  // Handle cancel button click
  const handleCancelClick = () => {
    setEditingAccount(null);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  // Prepare data for the pie chart
  const pieChartData = accountBalances
    .filter((account) => !account.isGoalAccount) // Exclude goal accounts from the main pie chart
    .map((account) => ({
      name: account.name,
      value: account.remaining,
      color: account.color,
    }));

  // Prepare data for the bar chart
  const barChartData = accountBalances.map((account) => ({
    name: account.name,
    allocated: account.allocated,
    spent: account.spent,
    remaining: account.remaining,
  }));

  const totalAllocated = accountBalances.reduce(
    (sum, account) => sum + account.allocated,
    0
  );
  const totalSpent = accountBalances.reduce(
    (sum, account) => sum + account.spent,
    0
  );
  const totalRemaining = accountBalances.reduce(
    (sum, account) => sum + account.remaining,
    0
  );

  // Handle adding a new savings goal
  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) {
      return;
    }

    const goalId = Date.now().toString();
    const goal: SavingsGoal = {
      id: goalId,
      name: newGoal.name,
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      deadline: newGoal.deadline,
      category: newGoal.category,
      weeklyContribution: 0,
      progress: 0,
    };

    // Create a new virtual account for this goal
    const goalAccount: AccountBalance = {
      name: `Goal: ${newGoal.name}`,
      allocated: 0,
      spent: 0,
      remaining: 0,
      color: "#8B5CF6", // violet-500
      isGoalAccount: true,
      goalId: goalId,
    };

    // Update state in the correct order to avoid race conditions
    setSavingsGoals((prevGoals) => [...prevGoals, goal]);
    setAccountBalances((prevBalances) => [...prevBalances, goalAccount]);

    // Reset form and close modal
    setNewGoal({
      name: "",
      targetAmount: 0,
      deadline: "",
      category: "Savings",
    });
    setShowAddGoalModal(false);
  };

  // Handle deleting a savings goal
  const handleDeleteGoal = (id: string) => {
    // Remove the goal
    setSavingsGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));

    // Remove the associated virtual account
    setAccountBalances((prevBalances) =>
      prevBalances.filter(
        (account) => !(account.isGoalAccount && account.goalId === id)
      )
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Virtual Budget Accounts
            </h1>
            <p className="text-gray-600 mt-2">
              All-time account balances and spending summary
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
            <div className="relative inline-flex h-7 w-14 items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md">
              <button
                onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
                className={`${
                  currency === "INR" ? "translate-x-7" : "translate-x-1"
                } inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out`}
              />
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              {currency}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : budgetEntries.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-lg shadow-md p-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">No budget entries found.</p>
            <p className="mt-2">
              Please create a budget on the dashboard first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Financial Summary Card */}
            <div className="lg:col-span-1">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 h-full">
                <h2 className="text-base font-semibold mb-3 text-gray-800">
                  All-Time Summary
                </h2>

                <div className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-xs font-medium text-gray-600">
                      Total Allocated
                    </span>
                    <p className="text-lg font-bold text-indigo-700">
                      {formatCurrency(totalAllocated)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-xs font-medium text-gray-600">
                      Total Spent
                    </span>
                    <p className="text-lg font-bold text-indigo-700">
                      {formatCurrency(totalSpent)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-xs font-medium text-gray-600">
                      Total Remaining
                    </span>
                    <p className="text-lg font-bold text-indigo-700">
                      {formatCurrency(totalRemaining)}
                    </p>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-xs font-medium mb-1 text-gray-800">
                      Remaining Balance Distribution
                    </h3>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={45}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              formatCurrency(value),
                              "Remaining",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Cards */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800">
                    Main Accounts
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
                  {accountBalances
                    .filter((account) => !account.isGoalAccount)
                    .map((account) => (
                      <div
                        key={account.name}
                        className="p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-semibold flex items-center">
                            <span
                              className={`w-3 h-3 rounded-full mr-2 ${
                                account.color === COLORS.needs
                                  ? "bg-emerald-500"
                                  : account.color === COLORS.wants
                                  ? "bg-blue-500"
                                  : "bg-violet-500"
                              }`}
                            ></span>
                            {account.name}
                          </h2>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500">
                              {(
                                (account.spent / account.allocated) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                            {editingAccount === account.name ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={handleSaveClick}
                                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelClick}
                                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(account)}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">Allocated</span>
                              {editingAccount === account.name ? (
                                <input
                                  type="number"
                                  name="allocated"
                                  value={editValues.allocated}
                                  onChange={handleInputChange}
                                  className="w-24 text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                                />
                              ) : (
                                <span className="font-medium">
                                  {formatCurrency(account.allocated)}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: "100%",
                                  backgroundColor: account.color,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">Spent</span>
                              {editingAccount === account.name ? (
                                <input
                                  type="number"
                                  name="spent"
                                  value={editValues.spent}
                                  onChange={handleInputChange}
                                  className="w-24 text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                                />
                              ) : (
                                <span className="font-medium">
                                  {formatCurrency(account.spent)}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${
                                    (account.spent / account.allocated) * 100
                                  }%`,
                                  backgroundColor: account.color,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">Remaining</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  editingAccount === account.name
                                    ? editValues.allocated - editValues.spent
                                    : account.remaining
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${
                                    ((editingAccount === account.name
                                      ? editValues.allocated - editValues.spent
                                      : account.remaining) /
                                      account.allocated) *
                                    100
                                  }%`,
                                  backgroundColor: account.color,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 text-gray-800">
                  Financial Insights
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-emerald-800 mb-1">
                      Savings Rate
                    </h3>
                    <p className="text-xl font-bold text-emerald-700">
                      {insights.savingsRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Of total budget remains in savings
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                      Most Expensive Category
                    </h3>
                    <p className="text-xl font-bold text-blue-700">
                      {insights.mostExpensiveCategory}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formatCurrency(insights.mostExpensiveAmount)} spent
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-violet-800 mb-1">
                      Average Expense
                    </h3>
                    <p className="text-xl font-bold text-violet-700">
                      {formatCurrency(insights.averageExpense)}
                    </p>
                    <p className="text-xs text-violet-600 mt-1">
                      Per transaction
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-amber-800 mb-1">
                      Budget Utilization
                    </h3>
                    <p className="text-xl font-bold text-amber-700">
                      {totalAllocated > 0
                        ? ((totalSpent / totalAllocated) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Of total budget spent
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4 text-gray-800">
                    Category Breakdown
                  </h3>
                  <div className="h-56 bg-gray-50 p-4 rounded-xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                          ]}
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            border: "1px solid #E5E7EB",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="allocated"
                          name="Allocated"
                          fill="#E5E7EB"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="spent"
                          name="Spent"
                          fill="#6366F1"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="remaining"
                          name="Remaining"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">
                      Needs Category
                    </h3>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Budget utilization
                      </span>
                      <span className="text-xs font-medium">
                        {insights.needsRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-emerald-500"
                        style={{ width: `${insights.needsRatio}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">
                      Wants Category
                    </h3>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Budget utilization
                      </span>
                      <span className="text-xs font-medium">
                        {insights.wantsRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-blue-500"
                        style={{ width: `${insights.wantsRatio}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">
                      Savings Category
                    </h3>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Budget utilization
                      </span>
                      <span className="text-xs font-medium">
                        {insights.savingsRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-violet-500"
                        style={{ width: `${insights.savingsRatio}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Goals Section */}
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Savings Goals
                  </h2>
                  <button
                    onClick={() => setShowAddGoalModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Goal
                  </button>
                </div>

                {savingsGoals.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-2">No savings goals yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Set a savings goal to track your progress
                    </p>
                    <button
                      onClick={() => setShowAddGoalModal(true)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Create your first goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savingsGoals.map((goal) => {
                      // Find the associated goal account
                      const goalAccount = accountBalances.find(
                        (account) =>
                          account.isGoalAccount && account.goalId === goal.id
                      );

                      return (
                        <div
                          key={goal.id}
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {goal.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                Due by{" "}
                                {new Date(goal.deadline).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">
                                {goal.progress.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full bg-violet-500"
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600 text-xs">Target</p>
                              <p className="font-medium">
                                {formatCurrency(goal.targetAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Current</p>
                              <p className="font-medium">
                                {formatCurrency(goal.currentAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Remaining</p>
                              <p className="font-medium">
                                {formatCurrency(
                                  goal.targetAmount - goal.currentAmount
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Weekly</p>
                              <p className="font-medium">
                                {formatCurrency(goal.weeklyContribution)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h4 className="text-xs font-medium text-gray-700 mb-2">
                              Step-by-Step Plan
                            </h4>
                            <ol className="text-xs space-y-1">
                              <li className="flex items-start">
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-100 text-violet-800 text-xs font-medium mr-2 mt-0.5">
                                  1
                                </span>
                                <span>
                                  Save {formatCurrency(goal.weeklyContribution)}{" "}
                                  per week
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-100 text-violet-800 text-xs font-medium mr-2 mt-0.5">
                                  2
                                </span>
                                <span>
                                  Track your progress in the dedicated goal
                                  account
                                </span>
                              </li>
                              <li className="flex items-start">
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-100 text-violet-800 text-xs font-medium mr-2 mt-0.5">
                                  3
                                </span>
                                <span>
                                  Reach your goal by{" "}
                                  {new Date(goal.deadline).toLocaleDateString()}
                                </span>
                              </li>
                            </ol>
                          </div>

                          {goalAccount && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-medium text-gray-700">
                                  Goal Account
                                </h4>
                                <button
                                  onClick={() => handleEditClick(goalAccount)}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-600">Allocated</p>
                                  {editingAccount === goalAccount.name ? (
                                    <input
                                      type="number"
                                      name="allocated"
                                      value={editValues.allocated}
                                      onChange={handleInputChange}
                                      className="w-full text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                                    />
                                  ) : (
                                    <p className="font-medium">
                                      {formatCurrency(goalAccount.allocated)}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-gray-600">Spent</p>
                                  {editingAccount === goalAccount.name ? (
                                    <input
                                      type="number"
                                      name="spent"
                                      value={editValues.spent}
                                      onChange={handleInputChange}
                                      className="w-full text-right border border-gray-300 rounded px-1 py-0.5 text-xs"
                                    />
                                  ) : (
                                    <p className="font-medium">
                                      {formatCurrency(goalAccount.spent)}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-gray-600">Remaining</p>
                                  <p className="font-medium">
                                    {formatCurrency(
                                      editingAccount === goalAccount.name
                                        ? editValues.allocated -
                                            editValues.spent
                                        : goalAccount.remaining
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Progress</p>
                                  <p className="font-medium">
                                    {(
                                      ((editingAccount === goalAccount.name
                                        ? editValues.allocated -
                                          editValues.spent
                                        : goalAccount.remaining) /
                                        goal.targetAmount) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </p>
                                </div>
                              </div>
                              {editingAccount === goalAccount.name && (
                                <div className="mt-2 flex justify-end space-x-2">
                                  <button
                                    onClick={handleSaveClick}
                                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelClick}
                                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {showAddGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add Savings Goal
                </h3>
                <button
                  onClick={() => setShowAddGoalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="goalName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Goal Name
                  </label>
                  <input
                    type="text"
                    id="goalName"
                    value={newGoal.name}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., New Car, Emergency Fund"
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      {currency === "USD" ? "$" : "₹"}
                    </span>
                    <input
                      type="number"
                      id="targetAmount"
                      value={newGoal.targetAmount || ""}
                      onChange={(e) =>
                        setNewGoal({
                          ...newGoal,
                          targetAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="deadline"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Deadline
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={newGoal.deadline}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={newGoal.category}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Needs">Needs</option>
                    <option value="Wants">Wants</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
