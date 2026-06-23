import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getHubs } from "@/lib/aps-data";

export async function GET() {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const hubs = await getHubs(session.accessToken);
    return NextResponse.json({ hubs });
  } catch (e: any) {
    console.error("Hubs error:", e.message);
    return NextResponse.json({ error: e.message, hubs: [] }, { status: 200 });
  }
}
