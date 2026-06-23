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
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
          </svg>
          <span className="font-semibold text-lg">Forma AI Schedule</span>
        </div>
        <a href="/api/auth/logout" className="text-sm text-blue-200 hover:text-white">Sign out</a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Accounts</p>
            {hubs.map(hub => (
              <button
                key={hub.id}
                onClick={() => selectHub(hub)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${selectedHub?.id === hub.id ? "bg-blue-50 text-blue-900 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {hub.name}
              </button>
            ))}
          </div>

          {projects.length > 0 && (
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Projects</p>
              {projects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => selectProject(proj)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${selectedProject?.id === proj.id ? "bg-blue-50 text-blue-900 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {proj.name}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              <p className="text-sm">Select an account and project to browse models</p>
            </div>
          ) : (
            <>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap">
                <span className="text-gray-500">{selectedProject.name}</span>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-gray-400">/</span>
                    <button
                      onClick={() => navigateBreadcrumb(i)}
                      className={`${i === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : "text-blue-600 hover:underline"}`}
                    >
                      {crumb.label}
                    </button>
                  </span>
                ))}
              </nav>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {items.length === 0 ? (
                    <p className="p-6 text-sm text-gray-400 text-center">This folder is empty</p>
                  ) : items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      {item.type === "Folder" ? (
                        <svg className="h-5 w-5 text-yellow-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-800 flex-1 truncate">{item.name}</span>
                      {item.type === "Folder" && (
                        <button onClick={() => openFolder(item)} className="text-xs text-blue-600 hover:underline shrink-0">Open</button>
                      )}
                      {item.type === "File" && item.modelUrn && (
                        <button
                          onClick={() => openSchedule(item)}
                          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          Generate Schedule
                        </button>
                      )}
                      {item.type === "File" && !item.modelUrn && (
                        <span className="text-xs text-gray-400 shrink-0">No model URN</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
