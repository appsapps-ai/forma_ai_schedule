import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { GoogleGenAI } from "@google/genai";
import { ScheduleResult, ChatMessage } from "@/types/schedule";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, schedule }: { messages: ChatMessage[]; schedule: ScheduleResult } = await req.json();

    // Build compact schedule summary — don't send full elements arrays (too large)
    const categorySummary = schedule.categories
      .map(r => `- ${r.category}: ${r.count} elements | Families: ${r.families} | Types: ${r.types} | Levels: ${r.levels}`)
      .join("\n");

    const scheduleRowsSummary = (schedule.scheduleRows ?? [])
      .slice(0, 100)
      .map(r => `  ${r.category} | ${r.family} | ${r.type} | ${r.instances} instances`)
      .join("\n");

    const systemInstruction = `You are a BIM schedule assistant for Forma AI Schedule. Answer questions about the Revit model schedule below. Be concise and specific.

Model Statistics:
- Total elements scanned: ${schedule.totalElementsScanned}
- Categorized: ${schedule.totalCategorizedElements}
- Categories found: ${schedule.totalCategoriesFound}
- Uncategorized: ${schedule.uncategorizedElements}

Category Summary:
${categorySummary}

Schedule Breakdown (Category | Family | Type | Instances):
${scheduleRowsSummary || "(regenerate schedule to see breakdown)"}`;

    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        config: { systemInstruction },
        contents,
      });
    } catch (e: any) {
      const msg = parseGeminiError(e);
      return new Response(msg, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (e: any) {
          controller.enqueue(encoder.encode(parseGeminiError(e)));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    return new Response(parseGeminiError(e), { status: 500 });
  }
}

function parseGeminiError(e: any): string {
  const msg: string = e?.message || String(e);
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Too Many Requests")) {
    return "⚠️ Gemini API quota exceeded. Please wait 30–60 seconds and try again.";
  }
  if (msg.includes("401") || msg.includes("API_KEY")) {
    return "⚠️ Invalid Gemini API key. Check your GOOGLE_AI_API_KEY in Vercel settings.";
  }
  try {
    const json = JSON.parse(msg);
    return `⚠️ ${json?.error?.message || msg}`;
  } catch {
    return `⚠️ ${msg}`;
  }
}
