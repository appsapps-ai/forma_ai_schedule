"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleResult, ChatMessage } from "@/types/schedule";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ScheduleCharts = dynamic(() => import("@/components/ScheduleCharts"), { ssr: false });

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

  const [exportLoading, setExportLoading] = useState<"xlsx" | "csv" | "pdf" | null>(null);
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
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Server error ${res.status}`);
      }
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
        body: JSON.stringify({
          messages: [...messages, userMsg],
          // Strip elements arrays — too large to send; server only needs summary fields
          schedule: {
            ...schedule,
            categories: schedule.categories.map(({ elements: _e, ...rest }) => rest),
          },
        }),
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
      const safeName = modelName.replace(/[^a-zA-Z0-9\s\-_.]/g, "").replace(/\s+/g, "_").replace(/\.rvt$/i, "").trim() || "forma-ai-schedule";
      a.download = `${safeName}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(null);
    }
  }

  function exportPDF() {
    if (!schedule) return;
    setExportLoading("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      // Dark header bar
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageW, 22, "F");
      // Blue left accent strip
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 4, 22, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FORMA AI SCHEDULE", 12, 10);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Reliant Design Solutions", 12, 17);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const displayName = modelName.replace(/\.rvt$/i, "");
      doc.text(displayName, pageW / 2, 13, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), pageW - 12, 13, { align: "right" });

      // Stats row — light background band
      doc.setFillColor(248, 250, 252); // gray-50
      doc.rect(0, 22, pageW, 24, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(0, 46, pageW, 46);

      const stats = [
        { label: "Elements Scanned", value: schedule.totalElementsScanned.toLocaleString(), color: [15, 23, 42] as [number,number,number] },
        { label: "Categorized", value: schedule.totalCategorizedElements.toLocaleString(), color: [37, 99, 235] as [number,number,number] },
        { label: "Categories Found", value: String(schedule.totalCategoriesFound), color: [99, 102, 241] as [number,number,number] },
        { label: "Uncategorized", value: schedule.uncategorizedElements.toLocaleString(), color: [100, 116, 139] as [number,number,number] },
      ];
      const cellW = (pageW - 28) / stats.length;
      stats.forEach((s, i) => {
        const x = 14 + i * cellW;
        // Colored top pip
        doc.setFillColor(...s.color);
        doc.rect(x, 22, 3, 2, "F");
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...s.color);
        doc.text(s.value, x, 33);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(s.label, x, 40);
      });

      // AI summary
      let curY = 52;
      if (schedule.aiSummary) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text("AI SUMMARY", 14, curY);
        curY += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(schedule.aiSummary, pageW - 28) as string[];
        doc.text(lines, 14, curY);
        curY += lines.length * 4 + 5;
      }

      // Element Distribution bar chart (top 10 categories)
      const top10 = schedule.categories.slice(0, 10);
      if (top10.length > 0) {
        const maxCount = Math.max(...top10.map(c => c.count));
        const chartH = 40;
        const chartLeft = 14;
        const chartRight = pageW - 14;
        const chartW = chartRight - chartLeft;
        const barSlotW = chartW / top10.length;
        const barPadding = Math.max(barSlotW * 0.18, 1);
        const chartBottom = curY + 6 + chartH;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Element Distribution", chartLeft, curY + 4);

        // X-axis baseline
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(chartLeft, chartBottom, chartRight, chartBottom);

        top10.forEach((cat, i) => {
          const bh = maxCount > 0 ? (cat.count / maxCount) * chartH : 0;
          const bx = chartLeft + i * barSlotW + barPadding;
          const bw = barSlotW - 2 * barPadding;
          const by = chartBottom - bh;

          // Alternate bar colour for readability
          const r = i % 2 === 0 ? 37 : 99;
          const g = i % 2 === 0 ? 99 : 130;
          const b = i % 2 === 0 ? 235 : 200;
          doc.setFillColor(r, g, b);
          doc.rect(bx, by, bw, bh, "F");

          // Count label above bar
          doc.setFontSize(5.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(37, 99, 235);
          doc.text(cat.count.toLocaleString(), bx + bw / 2, by - 1, { align: "center" });

          // Category label below axis
          doc.setFontSize(5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          const label = cat.category.length > 14 ? cat.category.slice(0, 13) + "…" : cat.category;
          doc.text(label, bx + bw / 2, chartBottom + 4, { align: "center" });
        });

        curY = chartBottom + 10;
      }

      // Schedule table
      const rows = (schedule.scheduleRows ?? []).map((r, i) => [
        i + 1, r.category, r.family, r.type, r.instances.toLocaleString(),
      ]);

      autoTable(doc, {
        startY: curY,
        head: [["#", "Category", "Family", "Type", "Instances"]],
        body: rows,
        styles: { fontSize: 7.5, cellPadding: 2.2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", textColor: [150, 150, 150] },
          1: { fontStyle: "bold", textColor: [30, 41, 59] },
          4: { cellWidth: 24, halign: "right", textColor: [37, 99, 235], fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => {
          // Footer on each page
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Forma AI Schedule — ${displayName} — Page ${data.pageNumber} of ${pageCount}`,
            pageW / 2, doc.internal.pageSize.getHeight() - 6,
            { align: "center" }
          );
        },
      });

      const pdfName = modelName.replace(/[^a-zA-Z0-9\s\-_.]/g, "").replace(/\s+/g, "_").replace(/\.rvt$/i, "").trim() || "forma-ai-schedule";
      doc.save(`${pdfName}.pdf`);
    } finally {
      setExportLoading(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 px-8 py-4 flex items-center justify-between bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="rounded-xl bg-blue-600 p-2 shadow shadow-blue-200">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base leading-tight">Forma AI Schedule</p>
            <p className="text-gray-400 text-xs truncate max-w-sm">{modelName}</p>
          </div>
        </div>
        <a href="/api/auth/logout" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Sign out</a>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Elements Scanned", value: schedule.totalElementsScanned.toLocaleString(), accent: "border-t-slate-800", num: "text-slate-800" },
                  { label: "Categorized", value: schedule.totalCategorizedElements.toLocaleString(), accent: "border-t-blue-600", num: "text-blue-600" },
                  { label: "Categories Found", value: schedule.totalCategoriesFound, accent: "border-t-indigo-500", num: "text-indigo-600" },
                  { label: "Uncategorized", value: schedule.uncategorizedElements.toLocaleString(), accent: "border-t-slate-400", num: "text-slate-400" },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border-t-4 ${s.accent} border border-gray-200 border-t-[4px] px-5 py-5 bg-white shadow-sm hover:shadow-md transition-shadow`}>
                    <p className={`text-3xl font-bold tabular-nums ${s.num}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1.5 font-medium uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              {schedule.aiSummary && (
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-5 py-4 mb-6 flex gap-3 shadow-sm">
                  <div className="shrink-0 mt-0.5 h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1.5">AI Summary</p>
                    <p className="text-sm text-blue-950 leading-relaxed">{schedule.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest shrink-0">Element Schedule</h2>
                <div className="relative flex-1">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search category, family or type…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {[
                    { label: "Excel", format: "xlsx" as const, cls: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50" },
                    { label: "CSV", format: "csv" as const, cls: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50" },
                    { label: "PDF", format: "pdf" as const, cls: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
                  ].map(b => (
                    <button
                      key={b.label}
                      onClick={() => b.format === "pdf" ? exportPDF() : exportSchedule(b.format)}
                      disabled={!!exportLoading}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors ${b.cls}`}
                    >
                      {exportLoading === b.format
                        ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      }
                      {b.label}
                    </button>
                  ))}
                  <button onClick={generateSchedule} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Schedule table */}
              {(() => {
                const q = search.trim().toLowerCase();
                const rows = (schedule.scheduleRows ?? []).filter(r =>
                  !q || [r.category, r.family, r.type].some(v => v.toLowerCase().includes(q))
                );
                let lastCategory = "";
                let rowNum = 0;
                return (
                  <>
                    {q && (
                      <p className="text-xs text-gray-400 mb-2">
                        {rows.length === 0 ? "No results" : `${rows.length} row${rows.length === 1 ? "" : "s"} matched`}
                      </p>
                    )}
                    <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest w-12 text-slate-400">#</th>
                            <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest">Category</th>
                            <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest">Family</th>
                            <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest">Type</th>
                            <th className="text-right px-5 py-3 font-bold text-xs uppercase tracking-widest w-28">Instances</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {rows.map((r, i) => {
                            const isNewCategory = r.category !== lastCategory;
                            lastCategory = r.category;
                            rowNum++;
                            return (
                              <tr key={i} className={`hover:bg-blue-50/60 transition-colors ${isNewCategory && i > 0 ? "border-t-2 border-gray-200" : ""}`}>
                                <td className="px-5 py-2.5 text-gray-300 text-xs tabular-nums">{rowNum}</td>
                                <td className="px-5 py-2.5 text-sm font-bold text-gray-900">{isNewCategory ? r.category : ""}</td>
                                <td className="px-5 py-2.5 text-sm text-gray-600">{r.family}</td>
                                <td className="px-5 py-2.5 text-sm text-gray-400">{r.type}</td>
                                <td className="px-5 py-2.5 text-right font-bold text-blue-600 text-sm tabular-nums">{r.instances.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                          {rows.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                              {q ? `No results for "${search}"` : "No supported Revit categories found in this model"}
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}

              {/* Charts */}
              {schedule.categories.length > 0 && (
                <div className="mt-6">
                  <ScheduleCharts categories={schedule.categories} />
                </div>
              )}

              {/* Uncategorized elements */}
              {schedule.uncategorizedNames && schedule.uncategorizedNames.length > 0 && (
                <div className="mt-6">
                  <details className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
                    <summary className="px-5 py-4 cursor-pointer flex items-center gap-2 select-none hover:bg-amber-100 transition-colors">
                      <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <span className="text-sm font-semibold text-amber-800">
                        {schedule.uncategorizedNames.reduce((s, n) => s + n.count, 0).toLocaleString()} Elements Placed in Generic Models (unknown category)
                      </span>
                      <span className="ml-auto text-xs text-amber-600">click to expand</span>
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-xs text-amber-700 mb-3">
                        These element families could not be matched to a standard Revit category. They have been placed in Generic Models in the schedule above. They may be custom families, linked elements, or elements with non-standard naming.
                      </p>
                      <div className="rounded-lg border border-amber-200 overflow-x-auto bg-white">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-amber-50 border-b border-amber-200">
                              <th className="text-left px-4 py-2.5 font-bold text-amber-700 text-xs uppercase tracking-wide">#</th>
                              <th className="text-left px-4 py-2.5 font-bold text-amber-700 text-xs uppercase tracking-wide">Element Family / Name</th>
                              <th className="text-right px-4 py-2.5 font-bold text-amber-700 text-xs uppercase tracking-wide w-28">Count</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100">
                            {schedule.uncategorizedNames.map((item, i) => (
                              <tr key={i} className="hover:bg-amber-50 transition-colors">
                                <td className="px-4 py-2.5 text-amber-400 text-xs">{i + 1}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-700 font-mono">{item.name}</td>
                                <td className="px-4 py-2.5 text-right text-sm font-bold text-amber-700">{item.count.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </main>

        {/* AI Chat panel */}
        <aside className="w-96 shrink-0 border-l border-gray-200 bg-white flex flex-col">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-slate-800">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Ask AI</p>
              <p className="text-xs text-slate-400">Powered by Claude</p>
            </div>
          </div>

          {/* Input at TOP */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder-gray-400"
                placeholder={schedule ? "Ask about this model…" : "Generate schedule first…"}
                value={chatInput}
                disabled={!schedule || chatLoading}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              />
              <button
                onClick={sendChat}
                disabled={!schedule || chatLoading || !chatInput.trim()}
                className="rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm shadow-blue-200 shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-10 px-4 leading-relaxed">
                Ask anything about this model —<br />element counts, categories, levels, and more.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                }`}>
                  {msg.content || (chatLoading && i === messages.length - 1 ? <span className="animate-pulse text-gray-400">…</span> : "")}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
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
