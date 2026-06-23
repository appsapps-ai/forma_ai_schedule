import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { refreshAccessToken } from "@/lib/aps-auth";

export async function GET() {
  const session = await getSession();

  if (!session.accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  if (session.expiresAt && session.expiresAt < Date.now() + 60_000) {
    try {
      const tokens = await refreshAccessToken(session.refreshToken!);
      session.accessToken = tokens.access_token;
      session.refreshToken = tokens.refresh_token;
      session.expiresAt = Date.now() + tokens.expires_in * 1000;
      await session.save();
    } catch {
      return NextResponse.json({ authenticated: false });
    }
  }

  return NextResponse.json({ authenticated: true });
}
