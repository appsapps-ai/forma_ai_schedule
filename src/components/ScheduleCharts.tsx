"use client";

import { useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend,
} from "recharts";
import { CategoryRow } from "@/types/schedule";

const COLORS = [
    "#3b82f6","#6366f1","#8b5cf6","#ec4899","#f59e0b",
    "#10b981","#14b8a6","#f97316","#ef4444","#06b6d4",
    "#84cc16","#a855f7","#fb923c","#e879f9","#34d399",
];

interface Props {
    categories: CategoryRow[];
}

export default function ScheduleCharts({ categories }: Props) {
    const [view, setView] = useState<"bar" | "pie">("bar");

    if (!categories || categories.length === 0) return null;

    const data = categories.map((c, i) => ({
        name: c.category,
        count: c.count,
        color: COLORS[i % COLORS.length],
    }));

    return (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
            {/* Chart header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Element Distribution</h3>
                <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                    <button
                        onClick={() => setView("bar")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "bar" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V19a1 1 0 001 1h4a1 1 0 001-1v-5.5M9 8.5V19a1 1 0 001 1h4a1 1 0 001-1V8.5M15 4.5V19a1 1 0 001 1h4a1 1 0 001-1V4.5" />
                        </svg>
                        Bar
                    </button>
                    <button
                        onClick={() => setView("pie")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "pie" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                        </svg>
                        Pie
                    </button>
                </div>
            </div>

            {/* Bar chart */}
            {view === "bar" && (
                <div className="px-4 py-6" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 60, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                                formatter={(v: number) => [v.toLocaleString(), "Elements"]}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                                {data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Pie chart */}
            {view === "pie" && (
                <div className="px-4 py-6" style={{ height: 360 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                outerRadius={120}
                                innerRadius={52}
                                paddingAngle={2}
                                label={({ name, percent }) =>
                                    percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ""
                                }
                                labelLine={false}
                            >
                                {data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                                formatter={(v: number) => [v.toLocaleString(), "Elements"]}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={9}
                                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
