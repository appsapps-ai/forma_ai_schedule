import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/aps-auth";
import { getSession } from "@/lib/session";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const session = await getSession();
  (session as any).oauthState = state;
  await session.save();

  return NextResponse.redirect(getAuthorizationUrl(state));
}
