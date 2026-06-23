import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";
import { ScheduleResult } from "@/types/schedule";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { schedule, format }: { schedule: ScheduleResult; format: "xlsx" | "csv" } = await req.json();

  const rows = [
    ["No.", "Category", "Count", "Example Families", "Example Types", "Level(s)"],
    ...schedule.categories.map((r, i) => [
      i + 1, r.category, r.count, r.families, r.types, r.levels,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Schedule");

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="forma-ai-schedule.csv"`,
      },
    });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="forma-ai-schedule.xlsx"`,
    },
  });
}
