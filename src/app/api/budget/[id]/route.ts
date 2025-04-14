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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure the data file exists
    await ensureDataFileExists();

    // Read the existing data
    const data = await fs.readFile(dataFilePath, "utf-8");
    const entries = JSON.parse(data || "[]");

    // Filter out the entry with the matching ID
    const filteredEntries = entries.filter(
      (entry: any) => entry.id !== params.id
    );

    // Write the updated data back to the file
    await fs.writeFile(dataFilePath, JSON.stringify(filteredEntries, null, 2));

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget entry:", error);
    return NextResponse.json(
      { error: "Failed to delete budget entry" },
      { status: 500 }
    );
  }
}
