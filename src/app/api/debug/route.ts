import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.APS_CLIENT_ID;
    const callbackUrl = process.env.APS_CALLBACK_URL;
    const sessionSecret = process.env.SESSION_SECRET;

    const oauthUrl = clientId && callbackUrl
        ? `https://developer.api.autodesk.com/authentication/v2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=data%3Aread+viewables%3Aread&state=debug`
        : null;

    return NextResponse.json({
        APS_CLIENT_ID: clientId ? `${clientId.slice(0, 6)}...${clientId.slice(-4)}` : "MISSING",
        APS_CALLBACK_URL: callbackUrl || "MISSING",
        SESSION_SECRET: sessionSecret ? `set (${sessionSecret.length} chars)` : "MISSING",
        oauth_url: oauthUrl
    });
}
