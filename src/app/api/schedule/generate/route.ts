import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getModelProperties } from "@/lib/aps-data";
import { buildCategorySummary, getUnclassifiedNames, COMMON_REVIT_CATEGORIES } from "@/lib/schedule";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

    // First pass — code-based classification
    let result = buildCategorySummary(properties, projectId, modelUrn);

    // If there are uncategorized elements, ask Claude to classify them
    if (result.uncategorizedElements > 0) {
      try {
        const unknownNames = getUnclassifiedNames(properties);
        if (unknownNames.length > 0) {
          const classifyResponse = await anthropic.messages.create({
            model: "claude-opus-4-8",
            max_tokens: 1024,
            messages: [{
              role: "user",
              content: `You are a Revit BIM expert. Classify each element family name into the correct Revit category.
Return ONLY a JSON object with no extra text. Map each name to a category from this list:
${COMMON_REVIT_CATEGORIES.join(", ")}
Use "Unknown" if you cannot determine the category.

Element names to classify:
${unknownNames.map(n => `- "${n}"`).join("\n")}`,
            }],
          });
          const text = classifyResponse.content.find(b => b.type === "text")?.text ?? "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiMap: Record<string, string> = JSON.parse(jsonMatch[0]);
            // Second pass — rebuild with AI-provided categories
            result = buildCategorySummary(properties, projectId, modelUrn, aiMap);
          }
        }
      } catch {
        // AI classification failed — continue with first-pass result
      }
    }

    const topCategories = result.categories
      .slice(0, 10)
      .map(r => `${r.category} (${r.count})`)
      .join(", ");

    try {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: `You are a BIM analyst. Summarize the following Revit model schedule in 3-4 concise sentences for an architect or project manager. Focus on what disciplines are present, the dominant element types, and any notable observations.

Model statistics:
- Total elements scanned: ${result.totalElementsScanned}
- Categorized elements: ${result.totalCategorizedElements}
- Categories found: ${result.totalCategoriesFound}
- Uncategorized: ${result.uncategorizedElements}
- Top categories: ${topCategories}`,
        }],
      });
      const textBlock = response.content.find(b => b.type === "text");
      result.aiSummary = textBlock?.text ?? "";
    } catch {
      result.aiSummary = "";
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Schedule generate error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate schedule" }, { status: 500 });
  }
}
