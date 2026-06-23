"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hub, Project, FolderItem } from "@/types/aps";

type Breadcrumb = { label: string; folderId?: string };

export default function DashboardPage() {
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [items, setItems] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<FolderItem | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (!d.authenticated) router.push("/"); });
  }, [router]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/aps/hubs")
      .then(r => r.json())
      .then(d => {
        if (d.error) setError("API error: " + d.error);
        else if (!d.hubs?.length) setError("No ACC accounts found for this Autodesk login. Make sure your account has ACC access and the APS app has Data Management API enabled.");
        else setHubs(d.hubs);
      })
      .catch(e => setError("Failed to load accounts: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  async function selectHub(hub: Hub) {
    setSelectedHub(hub);
    setSelectedProject(null);
    setItems([]);
    setBreadcrumbs([]);
    setLoading(true);
    try {
      const r = await fetch(`/api/aps/projects?hubId=${hub.id}`);
      const d = await r.json();
      setProjects(d.projects || []);
    } catch { setError("Failed to load projects"); }
    finally { setLoading(false); }
  }

  async function selectProject(project: Project) {
    setSelectedProject(project);
    setBreadcrumbs([{ label: "Top folders" }]);
    setLoading(true);
    try {
      const r = await fetch(`/api/aps/folders?hubId=${selectedHub!.id}&projectId=${project.id}`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { setError("Failed to load folders"); }
    finally { setLoading(false); }
  }

  async function openFolder(item: FolderItem) {
    if (item.type !== "Folder") return;
    setBreadcrumbs(prev => [...prev, { label: item.name, folderId: item.id }]);
    setLoading(true);
    try {
      const r = await fetch(`/api/aps/folders?projectId=${selectedProject!.id}&folderId=${item.id}`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { setError("Failed to load folder"); }
    finally { setLoading(false); }
  }

  async function navigateBreadcrumb(idx: number) {
    const crumb = breadcrumbs[idx];
    const newCrumbs = breadcrumbs.slice(0, idx + 1);
    setBreadcrumbs(newCrumbs);
    setLoading(true);
    try {
      const params = crumb.folderId
        ? `projectId=${selectedProject!.id}&folderId=${crumb.folderId}`
        : `hubId=${selectedHub!.id}&projectId=${selectedProject!.id}`;
      const r = await fetch(`/api/aps/folders?${params}`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { setError("Failed to navigate"); }
    finally { setLoading(false); }
  }

  function openSchedule(item: FolderItem) {
    if (!item.modelUrn || !selectedProject) return;
    const params = new URLSearchParams({ projectId: selectedProject.id, modelUrn: item.modelUrn, name: item.name });
    router.push(`/schedule?${params}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-5 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-xl">Forma AI Schedule</span>
        </div>
        <a href="/api/auth/logout" className="text-base text-gray-500 hover:text-gray-900 transition-colors font-medium">Sign out</a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Accounts</p>
            {loading && hubs.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-base text-gray-400">
                <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            )}
            {hubs.map(hub => (
              <button
                key={hub.id}
                onClick={() => selectHub(hub)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base mb-1 transition-colors font-semibold ${
                  selectedHub?.id === hub.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {hub.name}
              </button>
            ))}
          </div>

          {projects.length > 0 && (
            <div className="px-6 pb-6 flex-1 overflow-y-auto border-t border-gray-200 pt-6">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Projects</p>
              {projects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => selectProject(proj)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base mb-1 transition-colors ${
                    selectedProject?.id === proj.id
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  {proj.name}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto bg-white">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-base text-red-700 flex items-start gap-3">
              <svg className="h-5 w-5 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {error}
            </div>
          )}

          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-14 max-w-md">
                <svg className="h-16 w-16 mx-auto mb-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <p className="text-lg font-semibold text-gray-600 mb-2">No project selected</p>
                <p className="text-base text-gray-400">Choose an account and project from the sidebar to browse your models.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-base mb-6 flex-wrap">
                <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <span className="text-gray-500 font-semibold">{selectedProject.name}</span>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="text-gray-300">/</span>
                    <button
                      onClick={() => navigateBreadcrumb(i)}
                      className={i === breadcrumbs.length - 1 ? "text-gray-900 font-semibold" : "text-blue-600 hover:underline"}
                    >
                      {crumb.label}
                    </button>
                  </span>
                ))}
              </nav>

              {loading ? (
                <div className="flex items-center gap-3 text-gray-400 text-base py-10">
                  <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Loading contents…
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  {items.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-base text-gray-400">This folder is empty</p>
                    </div>
                  ) : items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => item.type === "Folder" ? openFolder(item) : undefined}
                      className={`flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0 transition-colors ${item.type === "Folder" ? "hover:bg-gray-50 cursor-pointer" : ""}`}
                    >
                      {item.type === "Folder" ? (
                        <svg className="h-6 w-6 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      )}
                      <span className="text-base text-gray-800 flex-1 truncate font-medium">{item.name}</span>
                      {item.type === "File" && item.modelUrn && (
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                        >
                          Generate Schedule
                        </button>
                      )}
                      {item.type === "File" && !item.modelUrn && (
                        <span className="text-sm text-gray-300 shrink-0 italic">No URN</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-6 overflow-hidden">
            {/* Modal header */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Generate Schedule</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Review model details before proceeding</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Model details */}
            <div className="px-8 py-6 space-y-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-gray-400 w-24 shrink-0 pt-0.5">Model</span>
                  <span className="text-base font-semibold text-gray-900 break-all">{previewItem.name}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-gray-400 w-24 shrink-0 pt-0.5">Project</span>
                  <span className="text-base text-gray-700">{selectedProject?.name}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-gray-400 w-24 shrink-0 pt-0.5">Model URN</span>
                  <span className="text-xs text-gray-400 font-mono break-all leading-relaxed">{previewItem.modelUrn}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 flex gap-3">
                <svg className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This will scan all elements in the model and extract Revit categories, families, types, and levels. Large models may take a moment.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-5 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-xl border border-gray-200 px-6 py-3 text-base font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { openSchedule(previewItem); setPreviewItem(null); }}
                className="rounded-xl bg-blue-600 px-8 py-3 text-base font-bold text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0l6.75-6.75M20.25 12l-6.75 6.75" />
                </svg>
                Run Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
