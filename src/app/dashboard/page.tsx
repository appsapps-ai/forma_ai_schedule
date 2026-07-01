"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Hub, Project, FolderItem } from "@/types/aps";
import type { SearchFileResult } from "@/lib/aps-data";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), { ssr: false });

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
  const [projectSearch, setProjectSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchFileResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        else if (!d.hubs?.length) setError("No ACC accounts found. Make sure your account has ACC access.");
        else setHubs(d.hubs);
      })
      .catch(e => setError("Failed to load accounts: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!fileSearch.trim() || fileSearch.length < 2 || !selectedHub || !selectedProject) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/aps/search?hubId=${encodeURIComponent(selectedHub.id)}&projectId=${encodeURIComponent(selectedProject.id)}&query=${encodeURIComponent(fileSearch)}`
        );
        const d = await r.json();
        setSearchResults(d.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileSearch, selectedHub?.id, selectedProject?.id]);

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
    setFileSearch("");
    setSearchResults(null);
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
    setFileSearch("");
    setSearchResults(null);
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
    setFileSearch("");
    setSearchResults(null);
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
    const currentFolderId = breadcrumbs[breadcrumbs.length - 1]?.folderId ?? "";
    const params = new URLSearchParams({
      projectId: selectedProject.id,
      modelUrn: item.modelUrn,
      name: item.name,
      hubId: selectedHub?.id ?? "",
      folderId: currentFolderId,
    });
    router.push(`/schedule?${params}`);
  }

  const filteredProjects = projectSearch.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
    : projects;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 shadow shadow-blue-200">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Forma AI Schedule</span>
        </div>
        <a href="/api/auth/logout" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          Sign out
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Accounts section */}
          <div className="p-5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Accounts</p>
            {loading && hubs.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400">
                <div className="h-3.5 w-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                Loading…
              </div>
            ) : hubs.length === 0 ? (
              <p className="text-sm text-gray-400 px-3">No accounts found</p>
            ) : (
              hubs.map(hub => (
                <button
                  key={hub.id}
                  onClick={() => selectHub(hub)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all font-medium flex items-center gap-2.5 ${
                    selectedHub?.id === hub.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${selectedHub?.id === hub.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {hub.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{hub.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Projects section */}
          {projects.length > 0 && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Projects</p>
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full tabular-nums">
                  {filteredProjects.length}
                </span>
              </div>
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-7 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
                {projectSearch && (
                  <button onClick={() => setProjectSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {filteredProjects.length === 0 ? (
                <p className="text-sm text-gray-400 px-1 py-2">No matches for &ldquo;{projectSearch}&rdquo;</p>
              ) : (
                filteredProjects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => selectProject(proj)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all flex items-center gap-2.5 ${
                      selectedProject?.id === proj.id
                        ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${selectedProject?.id === proj.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                      {proj.name[0]?.toUpperCase() ?? "P"}
                    </div>
                    <span className="truncate">{proj.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 flex items-start gap-3">
              <svg className="h-5 w-5 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!selectedProject ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-600 mb-2">No project selected</p>
                <p className="text-sm text-gray-400 leading-relaxed">Choose an account and project from the sidebar to browse your Revit models.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5">
                  <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <span className="font-semibold text-gray-700">{selectedProject.name}</span>
                </div>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    <button
                      onClick={() => navigateBreadcrumb(i)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        i === breadcrumbs.length - 1
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-blue-600 hover:bg-blue-50 font-medium"
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </span>
                ))}
              </nav>

              {/* File / deep search */}
              {!loading && (
                <div className="relative mb-5">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search all files across all subfolders…"
                    value={fileSearch}
                    onChange={e => setFileSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                  {fileSearch && (
                    <button onClick={() => { setFileSearch(""); setSearchResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Deep search results */}
              {fileSearch.length >= 2 && (searchLoading || searchResults !== null) && (
                <div className="mb-5">
                  {searchLoading ? (
                    <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
                      <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Searching all folders…
                    </div>
                  ) : searchResults!.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center">
                      <svg className="h-10 w-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
                      </svg>
                      <p className="text-sm text-gray-400">No files found for &ldquo;{fileSearch}&rdquo;</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-2.5 px-1">
                        {searchResults!.length} file{searchResults!.length !== 1 ? "s" : ""} found across all folders
                      </p>
                      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        {searchResults!.map(result => (
                          <FileRow
                            key={result.id}
                            name={result.name}
                            subtitle={result.path}
                            hasUrn={!!result.modelUrn}
                            onClick={() => result.modelUrn && setPreviewItem({ id: result.id, name: result.name, type: "File", modelUrn: result.modelUrn })}
                            onGenerate={() => result.modelUrn && setPreviewItem({ id: result.id, name: result.name, type: "File", modelUrn: result.modelUrn })}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Folder contents */}
              {!fileSearch && loading ? (
                <div className="flex items-center gap-3 text-gray-400 text-sm py-10">
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Loading contents…
                </div>
              ) : !fileSearch && items.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
                  <svg className="h-10 w-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <p className="text-sm text-gray-400">This folder is empty</p>
                </div>
              ) : !fileSearch ? (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {items.map(item => (
                    item.type === "Folder" ? (
                      <FolderRow key={item.id} name={item.name} onClick={() => openFolder(item)} />
                    ) : (
                      <FileRow
                        key={item.id}
                        name={item.name}
                        hasUrn={!!item.modelUrn}
                        onClick={() => item.modelUrn && setPreviewItem(item)}
                        onGenerate={() => item.modelUrn && setPreviewItem(item)}
                      />
                    )
                  ))}
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>

      {/* 3D Model Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3.5">
                <div className="rounded-xl bg-blue-50 p-2.5 ring-1 ring-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 truncate max-w-xl">{previewItem.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedProject?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-xl p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-4 shrink-0"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 3D Viewer */}
            <div className="flex-1 min-h-0 bg-gray-900">
              <ModelViewer urn={previewItem.modelUrn!} />
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <p className="text-sm text-gray-400">Review the 3D model, then generate the AI schedule.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { openSchedule(previewItem); setPreviewItem(null); }}
                  className="rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generate AI Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderRow({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 last:border-0 hover:bg-amber-50/60 cursor-pointer transition-colors"
    >
      <svg className="h-5 w-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
      <span className="text-sm text-gray-700 flex-1 truncate font-medium group-hover:text-amber-800">{name}</span>
      <svg className="h-4 w-4 text-gray-300 group-hover:text-amber-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}

function FileRow({
  name, subtitle, hasUrn, onClick, onGenerate,
}: {
  name: string;
  subtitle?: string;
  hasUrn: boolean;
  onClick: () => void;
  onGenerate: () => void;
}) {
  const isRvt = name.toLowerCase().endsWith(".rvt");
  return (
    <div
      onClick={hasUrn ? onClick : undefined}
      className={`group flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 last:border-0 transition-colors ${hasUrn ? "cursor-pointer hover:bg-blue-50/50" : "opacity-60"}`}
    >
      <div className="shrink-0">
        {isRvt ? (
          <div className="h-9 w-9 rounded-lg bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">RVT</span>
          </div>
        ) : (
          <div className="h-9 w-9 rounded-lg bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium truncate">{name}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</p>}
        {!hasUrn && <p className="text-xs text-gray-400 italic mt-0.5">Not yet translated — open in ACC first</p>}
      </div>
      {hasUrn && (
        <button
          onClick={e => { e.stopPropagation(); onGenerate(); }}
          className="shrink-0 invisible group-hover:visible rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Generate
        </button>
      )}
    </div>
  );
}
