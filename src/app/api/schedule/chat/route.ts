import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";
import { ScheduleResult, ChatMessage } from "@/types/schedule";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

    const system = `You are a BIM schedule assistant for Forma AI Schedule. Answer questions about the Revit model schedule below. Be concise and specific.

Model Statistics:
- Total elements scanned: ${schedule.totalElementsScanned}
- Categorized: ${schedule.totalCategorizedElements}
- Categories found: ${schedule.totalCategoriesFound}
- Uncategorized: ${schedule.uncategorizedElements}

Category Summary:
${categorySummary}

Schedule Breakdown (Category | Family | Type | Instances):
${scheduleRowsSummary || "(regenerate schedule to see breakdown)"}`;

    const anthropicMessages = messages.map(m => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    }));

    let stream;
    try {
      stream = anthropic.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 2048,
        system,
        messages: anthropicMessages,
      });
    } catch (e: any) {
      const msg = parseClaudeError(e);
      return new Response(msg, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
          await stream.finalMessage();
        } catch (e: any) {
          controller.enqueue(encoder.encode(parseClaudeError(e)));
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
    return new Response(parseClaudeError(e), { status: 500 });
  }
}

function parseClaudeError(e: any): string {
  if (e instanceof Anthropic.RateLimitError) {
    return "⚠️ Claude API rate limit exceeded. Please wait a moment and try again.";
  }
  if (e instanceof Anthropic.AuthenticationError) {
    return "⚠️ Invalid Anthropic API key. Check your ANTHROPIC_API_KEY in Vercel settings.";
  }
  if (e instanceof Anthropic.APIError) {
    return `⚠️ ${e.message}`;
  }
  const msg: string = e?.message || String(e);
  return `⚠️ ${msg}`;
}
