import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/aps-auth";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", req.url));
  }

  const session = await getSession();
  const savedState = (session as any).oauthState;
  if (state && savedState && state !== savedState) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", req.url));
  }

  const tokens = await exchangeCodeForTokens(code);
  session.accessToken = tokens.access_token;
  session.refreshToken = tokens.refresh_token;
  session.expiresAt = Date.now() + tokens.expires_in * 1000;
  (session as any).oauthState = undefined;
  await session.save();

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
