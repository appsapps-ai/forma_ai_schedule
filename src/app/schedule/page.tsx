"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleResult, ChatMessage } from "@/types/schedule";

function ScheduleContent() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get("projectId") ?? "";
  const modelUrn = params.get("modelUrn") ?? "";
  const modelName = params.get("name") ?? "Model";

  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [exportLoading, setExportLoading] = useState<"xlsx" | "csv" | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!projectId || !modelUrn) { router.push("/dashboard"); return; }
    generateSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function generateSchedule() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, modelUrn }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSchedule(await res.json());
    } catch (e: any) {
      setGenError(e.message || "Failed to generate schedule");
    } finally {
      setGenerating(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || !schedule || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/schedule/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], schedule }),
      });
      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: updated[updated.length - 1].content + chunk };
          return updated;
        });
      }
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Error: " + (e.message || "Chat failed") };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  }

  async function exportSchedule(format: "xlsx" | "csv") {
    if (!schedule) return;
    setExportLoading(format);
    try {
      const res = await fetch("/api/schedule/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule, format }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forma-ai-schedule.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-5 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mr-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="rounded-xl bg-blue-600 p-2">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">Forma AI Schedule</p>
            <p className="text-gray-400 text-sm truncate max-w-sm">{modelName}</p>
          </div>
        </div>
        <a href="/api/auth/logout" className="text-base text-gray-500 hover:text-gray-900 transition-colors font-medium">Sign out</a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Schedule panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {generating && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
              <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Scanning model elements and generating schedule…</p>
            </div>
          )}

          {genError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 mb-6">
              <p className="font-medium mb-1">Failed to generate schedule</p>
              <p className="text-red-500">{genError}</p>
              <button onClick={generateSchedule} className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                Retry
              </button>
            </div>
          )}

          {schedule && !generating && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Elements Scanned", value: schedule.totalElementsScanned.toLocaleString(), color: "text-gray-900" },
                  { label: "Categorized", value: schedule.totalCategorizedElements.toLocaleString(), color: "text-blue-600" },
                  { label: "Categories Found", value: schedule.totalCategoriesFound, color: "text-blue-600" },
                  { label: "Uncategorized", value: schedule.uncategorizedElements.toLocaleString(), color: "text-gray-400" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border border-gray-200 px-6 py-5 bg-white hover:border-blue-200 transition-colors">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              {schedule.aiSummary && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 mb-6 flex gap-3">
                  <svg className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">AI Summary</p>
                    <p className="text-sm text-blue-900 leading-relaxed">{schedule.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Toolbar: search + export */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900 shrink-0">Category Schedule</h2>
                {/* Search */}
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search categories or elements…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => exportSchedule("xlsx")}
                    disabled={!!exportLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {exportLoading === "xlsx" ? <span className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : "⬇"}
                    Excel
                  </button>
                  <button
                    onClick={() => exportSchedule("csv")}
                    disabled={!!exportLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {exportLoading === "csv" ? <span className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : "⬇"}
                    CSV
                  </button>
                  <button
                    onClick={generateSchedule}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Table */}
              {(() => {
                const q = search.trim().toLowerCase();
                const filtered = schedule.categories
                  .map(row => {
                    if (!q) return { row, matchedElements: row.elements, categoryMatch: true };
                    const categoryMatch = [row.category, row.families, row.types, row.levels]
                      .some(v => v.toLowerCase().includes(q));
                    const matchedElements = row.elements.filter(el =>
                      [el.name, el.family, el.type, el.level].some(v => v.toLowerCase().includes(q))
                    );
                    if (categoryMatch || matchedElements.length > 0) {
                      return { row, matchedElements: categoryMatch ? row.elements : matchedElements, categoryMatch };
                    }
                    return null;
                  })
                  .filter(Boolean) as { row: typeof schedule.categories[0]; matchedElements: typeof schedule.categories[0]["elements"]; categoryMatch: boolean }[];

                return (
                  <>
                    {q && (
                      <p className="text-xs text-gray-400 mb-2">
                        {filtered.length === 0
                          ? "No results found"
                          : `${filtered.length} categor${filtered.length === 1 ? "y" : "ies"} matched`}
                      </p>
                    )}
                    <div className="rounded-xl border border-gray-200 overflow-x-auto bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-5 py-4 font-bold text-gray-500 text-sm w-12">#</th>
                            <th className="text-left px-5 py-4 font-bold text-gray-500 text-sm">Category</th>
                            <th className="text-right px-5 py-4 font-bold text-gray-500 text-sm w-24">Count</th>
                            <th className="text-left px-5 py-4 font-bold text-gray-500 text-sm">Families</th>
                            <th className="text-left px-5 py-4 font-bold text-gray-500 text-sm">Types</th>
                            <th className="text-left px-5 py-4 font-bold text-gray-500 text-sm">Level(s)</th>
                            <th className="w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filtered.map(({ row, matchedElements, categoryMatch }, i) => {
                            const isExpanded = expandedCategory === row.category || (!categoryMatch && matchedElements.length > 0 && !!q);
                            return (
                              <React.Fragment key={row.category}>
                                <tr
                                  onClick={() => setExpandedCategory(isExpanded && categoryMatch ? null : row.category)}
                                  className="hover:bg-blue-50 transition-colors cursor-pointer select-none"
                                >
                                  <td className="px-5 py-4 text-gray-400 text-sm">{i + 1}</td>
                                  <td className="px-5 py-4 font-semibold text-gray-900 text-base">{row.category}</td>
                                  <td className="px-5 py-4 text-right font-bold text-blue-700 text-base">
                                    {!categoryMatch && q
                                      ? <><span className="text-blue-700">{matchedElements.length}</span><span className="text-gray-300 text-xs font-normal ml-1">/ {row.count}</span></>
                                      : row.count.toLocaleString()}
                                  </td>
                                  <td className="px-5 py-4 text-gray-500 text-sm max-w-xs truncate">{row.families}</td>
                                  <td className="px-5 py-4 text-gray-500 text-sm max-w-xs truncate">{row.types}</td>
                                  <td className="px-5 py-4 text-gray-500 text-sm">{row.levels}</td>
                                  <td className="px-4 py-4 text-gray-400">
                                    <svg className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr key={`${row.category}-expanded`}>
                                    <td colSpan={7} className="p-0 bg-blue-50 border-b border-blue-100">
                                      <div className="px-6 py-3">
                                        <p className="text-xs font-semibold text-blue-700 mb-2">
                                          Elements in {row.category}
                                          {!q && row.count > 200 && <span className="text-blue-400 font-normal ml-1">(showing first 200 of {row.count.toLocaleString()})</span>}
                                          {q && !categoryMatch && <span className="text-blue-400 font-normal ml-1">({matchedElements.length} matching "{search}")</span>}
                                        </p>
                                        <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="bg-blue-100 border-b border-blue-200">
                                                <th className="text-left px-3 py-2 font-semibold text-blue-700 w-8">#</th>
                                                <th className="text-left px-3 py-2 font-semibold text-blue-700">Name</th>
                                                <th className="text-left px-3 py-2 font-semibold text-blue-700">Family</th>
                                                <th className="text-left px-3 py-2 font-semibold text-blue-700">Type</th>
                                                <th className="text-left px-3 py-2 font-semibold text-blue-700">Level</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-blue-50">
                                              {matchedElements.map((el, j) => (
                                                <tr key={el.id || j} className="hover:bg-blue-50 transition-colors">
                                                  <td className="px-3 py-1.5 text-gray-400">{j + 1}</td>
                                                  <td className="px-3 py-1.5 text-gray-800 font-medium max-w-xs truncate">{el.name}</td>
                                                  <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate">{el.family}</td>
                                                  <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate">{el.type}</td>
                                                  <td className="px-3 py-1.5 text-gray-500">{el.level}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {filtered.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                              {q ? `No results for "${search}"` : "No supported Revit categories found in this model"}
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </main>

        {/* AI Chat panel */}
        <aside className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200 bg-white flex items-center gap-3">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">Ask AI</p>
              <p className="text-sm text-gray-400">Powered by Gemini</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-12 px-4 leading-relaxed">
                Ask anything about this model — element counts, categories, levels, and more.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.content || (chatLoading && i === messages.length - 1 ? <span className="animate-pulse text-gray-400">…</span> : "")}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder={schedule ? "Ask about this model…" : "Generate schedule first…"}
                value={chatInput}
                disabled={!schedule || chatLoading}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              />
              <button
                onClick={sendChat}
                disabled={!schedule || chatLoading || !chatInput.trim()}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense>
      <ScheduleContent />
    </Suspense>
  );
}
