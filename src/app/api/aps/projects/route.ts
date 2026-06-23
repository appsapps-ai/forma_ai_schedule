import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getProjects } from "@/lib/aps-data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hubId = req.nextUrl.searchParams.get("hubId");
  if (!hubId) return NextResponse.json({ error: "hubId required" }, { status: 400 });
  const projects = await getProjects(hubId, session.accessToken);
  return NextResponse.json({ projects });
}
