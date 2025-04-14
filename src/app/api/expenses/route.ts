import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "expenses.json");

// Ensure the data file exists
async function ensureDataFileExists() {
  try {
    await fs.access(dataFilePath);
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(dataFilePath, "[]", "utf-8");
  }
}

export async function GET() {
  try {
    // Ensure the data file exists
    await ensureDataFileExists();

    // Read the data
    const data = await fs.readFile(dataFilePath, "utf-8");
    const expenses = JSON.parse(data || "[]");

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ensure the data file exists
    await ensureDataFileExists();

    // Read existing data
    const data = await fs.readFile(dataFilePath, "utf-8");
    const expenses = JSON.parse(data || "[]");

    // Parse the new expense from the request body
    const newExpense = await request.json();

    // Add the new expense to the array
    expenses.push(newExpense);

    // Write the updated data back to the file
    await fs.writeFile(
      dataFilePath,
      JSON.stringify(expenses, null, 2),
      "utf-8"
    );

    return NextResponse.json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
