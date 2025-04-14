"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { BudgetEntry } from "@/types/budget";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  entry: BudgetEntry;
}

export default function DonutChart({ entry }: DonutChartProps) {
  const data = {
    labels: ["NEEDS", "WANTS", "SAVINGS"],
    datasets: [
      {
        data: [entry.needs, entry.wants, entry.savings],
        backgroundColor: [
          "rgba(0, 112, 192, 0.85)", // Blue for Needs
          "rgba(255, 67, 67, 0.85)", // Red for Wants
          "rgba(33, 176, 76, 0.85)", // Green for Savings
        ],
        borderColor: [
          "rgba(0, 112, 192, 1)",
          "rgba(255, 67, 67, 1)",
          "rgba(33, 176, 76, 1)",
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
            size: 13,
            family: "Calibri, sans-serif",
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#000",
        bodyColor: "#000",
        titleFont: {
          size: 13,
          family: "Calibri, sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "Calibri, sans-serif",
        },
        padding: 10,
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
            return `${label}: ${percentage}%`;
          },
        },
      },
    },
    cutout: "65%",
  };

  return (
    <div className="h-full w-full">
      <Doughnut data={data} options={options} />
    </div>
  );
}
