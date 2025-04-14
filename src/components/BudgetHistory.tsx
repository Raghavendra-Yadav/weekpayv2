"use client";

import { BudgetEntry } from "@/types/budget";
import { formatCurrency } from "@/utils/budgetUtils";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import BudgetCard from "./BudgetCard";
import { Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface BudgetHistoryProps {
  entries: BudgetEntry[];
  onDeleteEntry: (id: string) => void;
}

interface GroupedEntries {
  [key: string]: BudgetEntry[];
}

export default function BudgetHistory({
  entries,
  onDeleteEntry,
}: BudgetHistoryProps) {
  const latestEntry = entries[entries.length - 1];

  // Group entries by month and week
  const groupedEntries = entries.reduce((acc: GroupedEntries, entry) => {
    const date = new Date(entry.date);
    const monthYear = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const key = `${monthYear}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {});

  const chartData = {
    labels: ["NEEDS", "WANTS", "SAVINGS"],
    datasets: [
      {
        data: [latestEntry.needs, latestEntry.wants, latestEntry.savings],
        backgroundColor: [
          "rgba(29, 53, 87, 0.85)", // Deep Navy for Needs
          "rgba(123, 17, 58, 0.85)", // Burgundy for Wants
          "rgba(35, 78, 35, 0.85)", // Forest Green for Savings
        ],
        borderColor: [
          "rgba(29, 53, 87, 1)",
          "rgba(123, 17, 58, 1)",
          "rgba(35, 78, 35, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: "easeInOutQuart" as const,
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 12,
            family: "Calibri, sans-serif",
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#000",
        bodyColor: "#000",
        titleFont: {
          size: 12,
          family: "Calibri, sans-serif",
        },
        bodyFont: {
          size: 11,
          family: "Calibri, sans-serif",
        },
        padding: 8,
        cornerRadius: 4,
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${formatCurrency(
              value,
              latestEntry.currency
            )} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "70%",
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 p-8">
        <h2 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          Budget History
        </h2>
        <div className="h-[300px] w-full">
          <Line
            data={{
              labels: entries.map((entry) =>
                new Date(entry.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              ),
              datasets: [
                {
                  label: "Needs",
                  data: entries.map((entry) => entry.needs),
                  borderColor: "rgb(16, 185, 129)",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  borderWidth: 2,
                  tension: 0.4,
                },
                {
                  label: "Wants",
                  data: entries.map((entry) => entry.wants),
                  borderColor: "rgb(59, 130, 246)",
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  borderWidth: 2,
                  tension: 0.4,
                },
                {
                  label: "Savings",
                  data: entries.map((entry) => entry.savings),
                  borderColor: "rgb(139, 92, 246)",
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  borderWidth: 2,
                  tension: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top" as const,
                  labels: {
                    padding: 20,
                    font: {
                      size: 12,
                      family: "Inter",
                    },
                    usePointStyle: true,
                    pointStyle: "circle",
                  },
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: "rgba(148, 163, 184, 0.1)",
                  },
                  ticks: {
                    font: {
                      size: 12,
                      family: "Inter",
                    },
                    color: "rgb(100, 116, 139)",
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    font: {
                      size: 12,
                      family: "Inter",
                    },
                    color: "rgb(100, 116, 139)",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 p-8">
        <h2 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          Recent Entries
        </h2>
        <div className="grid gap-4">
          {entries.map((entry) => (
            <BudgetCard
              key={entry.id}
              entry={entry}
              onDelete={() => onDeleteEntry(entry.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
