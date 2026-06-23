import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { refreshAccessToken } from "@/lib/aps-auth";

export async function GET() {
    const session = await getSession();

    if (!session.accessToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (Date.now() > (session.expiresAt || 0) - 60000) {
        try {
            const tokens = await refreshAccessToken(session.refreshToken!);
            session.accessToken = tokens.access_token;
            session.refreshToken = tokens.refresh_token;
            session.expiresAt = Date.now() + tokens.expires_in * 1000;
            await session.save();
        } catch {
            return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
        }
    }

    return NextResponse.json({
        access_token: session.accessToken,
        expires_in: Math.floor(((session.expiresAt || 0) - Date.now()) / 1000)
    });
}
