import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getModelProperties } from "@/lib/aps-data";
import { buildCategorySummary } from "@/lib/schedule";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, modelUrn } = await req.json();
  if (!projectId || !modelUrn) return NextResponse.json({ error: "projectId and modelUrn required" }, { status: 400 });

  const properties = await getModelProperties(modelUrn, session.accessToken);
  const result = buildCategorySummary(properties, projectId, modelUrn);

  const topCategories = result.categories
    .slice(0, 10)
    .map(r => `${r.category} (${r.count})`)
    .join(", ");

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
  return NextResponse.json(result);
}
