import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTopFolders, getFolderContents } from "@/lib/aps-data";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const hubId = searchParams.get("hubId");
  const projectId = searchParams.get("projectId");
  const folderId = searchParams.get("folderId");

  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const items = folderId
    ? await getFolderContents(projectId, folderId, session.accessToken)
    : hubId
      ? await getTopFolders(hubId, projectId, session.accessToken)
      : [];

  return NextResponse.json({ items });
}
