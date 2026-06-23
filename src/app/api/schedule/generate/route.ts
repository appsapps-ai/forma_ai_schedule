import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getModelProperties } from "@/lib/aps-data";
import { buildCategorySummary } from "@/lib/schedule";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, modelUrn } = await req.json();
    if (!projectId || !modelUrn) return NextResponse.json({ error: "projectId and modelUrn required" }, { status: 400 });

    let properties: any[];
    try {
      properties = await getModelProperties(modelUrn, session.accessToken);
    } catch (e: any) {
      const msg: string = e.message || "";
      if (msg.includes("202") || msg.toLowerCase().includes("still being processed") || msg.toLowerCase().includes("translation")) {
        return NextResponse.json(
          { error: "Model is still being processed by Autodesk. Please wait a few minutes and try again." },
          { status: 202 }
        );
      }
      if (msg.includes("404")) {
        return NextResponse.json(
          { error: "Model not found or not yet translated. Open the model in Autodesk Construction Cloud first to trigger translation." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: `Failed to load model properties: ${msg}` }, { status: 500 });
    }

    if (!properties.length) {
      return NextResponse.json(
        { error: "No element data found in this model. The model may not be fully translated yet." },
        { status: 422 }
      );
    }

    const result = buildCategorySummary(properties, projectId, modelUrn);

    const topCategories = result.categories
      .slice(0, 10)
      .map(r => `${r.category} (${r.count})`)
      .join(", ");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a BIM analyst. Summarize the following Revit model schedule in 3-4 concise sentences for an architect or project manager. Focus on what disciplines are present, the dominant element types, and any notable observations.

Model statistics:
- Total elements scanned: ${result.totalElementsScanned}
- Categorized elements: ${result.totalCategorizedElements}
- Categories found: ${result.totalCategoriesFound}
- Uncategorized: ${result.uncategorizedElements}
- Top categories: ${topCategories}`,
      });
      result.aiSummary = response.text ?? "";
    } catch {
      result.aiSummary = "";
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Schedule generate error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate schedule" }, { status: 500 });
  }
}
