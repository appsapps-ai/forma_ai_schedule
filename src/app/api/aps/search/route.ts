import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { searchProjectFiles } from "@/lib/aps-data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const hubId = searchParams.get("hubId");
  const projectId = searchParams.get("projectId");
  const query = searchParams.get("query") ?? "";

  if (!hubId || !projectId || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchProjectFiles(hubId, projectId, session.accessToken, query);
  return NextResponse.json({ results });
}
