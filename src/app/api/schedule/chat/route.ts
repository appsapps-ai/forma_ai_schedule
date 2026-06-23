import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { GoogleGenAI } from "@google/genai";
import { ScheduleResult, ChatMessage } from "@/types/schedule";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { messages, schedule }: { messages: ChatMessage[]; schedule: ScheduleResult } = await req.json();

  const systemInstruction = `You are a BIM schedule assistant for Forma AI Schedule. The user is asking questions about a Revit model schedule.

Schedule data:
- Project ID: ${schedule.projectId}
- Total elements scanned: ${schedule.totalElementsScanned}
- Categorized elements: ${schedule.totalCategorizedElements}
- Categories found: ${schedule.totalCategoriesFound}
- Uncategorized: ${schedule.uncategorizedElements}

Category breakdown:
${schedule.categories.map(r => `- ${r.category}: ${r.count} elements | Families: ${r.families} | Types: ${r.types} | Levels: ${r.levels}`).join("\n")}

Answer questions accurately based on this data. Be concise and specific.`;

  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    config: { systemInstruction },
    contents,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
