import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "budget.json");

// Helper function to ensure data directory and file exist
async function ensureDataFileExists() {
  try {
    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), "data");
    try {
      await fs.access(dataDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Check if the file exists
    try {
      await fs.access(dataFilePath);
    } catch {
      // File doesn't exist, create it with empty array
      await fs.writeFile(dataFilePath, "[]");
    }
  } catch (error) {
    console.error("Error ensuring data file exists:", error);
    throw error;
  }
}

export async function GET() {
  try {
    // Ensure the data file exists
    await ensureDataFileExists();

    // Read the data
    const data = await fs.readFile(dataFilePath, "utf-8");
    const entries = JSON.parse(data || "[]");

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching budget entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ensure the data file exists
    await ensureDataFileExists();

    const newEntry = await request.json();

    // Read existing data
    const data = await fs.readFile(dataFilePath, "utf-8");
    const entries = JSON.parse(data || "[]");

    // Add new entry
    entries.push(newEntry);

    // Write updated data
    await fs.writeFile(dataFilePath, JSON.stringify(entries, null, 2));

    return NextResponse.json({ message: "Entry added successfully" });
  } catch (error) {
    console.error("Error adding budget entry:", error);
    return NextResponse.json(
      { error: "Failed to add budget entry" },
      { status: 500 }
    );
  }
}
