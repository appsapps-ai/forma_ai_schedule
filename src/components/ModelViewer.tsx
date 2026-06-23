"use client";

import { useEffect, useRef, useState } from "react";

declare const Autodesk: any;

interface Props {
    urn: string;
}

export default function ModelViewer({ urn }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                const res = await fetch("/api/aps/token");
                if (!res.ok) throw new Error("Failed to get token");
                const { access_token, expires_in } = await res.json();

                await loadViewerAssets();
                if (cancelled || !containerRef.current) return;

                const options = {
                    env: "AutodeskProduction2",
                    api: "streamingV2",
                    getAccessToken: (cb: (t: string, e: number) => void) => cb(access_token, expires_in)
                };

                Autodesk.Viewing.Initializer(options, () => {
                    if (cancelled || !containerRef.current) return;

                    const viewer = new Autodesk.Viewing.GuiViewer3D(containerRef.current, {
                        extensions: ["Autodesk.DefaultTools.NavTools"]
                    });
                    viewerRef.current = viewer;
                    viewer.start();

                    Autodesk.Viewing.Document.load(
                        `urn:${urn}`,
                        (doc: any) => {
                            const viewable = doc.getRoot().getDefaultGeometry();
                            viewer.loadDocumentNode(doc, viewable).then(() => {
                                if (!cancelled) setStatus("ready");
                            });
                        },
                        (err: any) => {
                            if (!cancelled) {
                                setStatus("error");
                                setErrorMsg(`Failed to load model: ${err}`);
                            }
                        }
                    );
                });
            } catch (e: any) {
                if (!cancelled) {
                    setStatus("error");
                    setErrorMsg(e.message || "Viewer failed to initialize");
                }
            }
        }

        init();

        return () => {
            cancelled = true;
            if (viewerRef.current) {
                viewerRef.current.finish();
                viewerRef.current = null;
            }
        };
    }, [urn]);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden">
            {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-gray-900">
                    <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading 3D model…</p>
                </div>
            )}
            {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-gray-900 px-8 text-center">
                    <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    <p className="text-sm text-red-400">{errorMsg}</p>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}

function loadViewerAssets(): Promise<void> {
    return new Promise((resolve, reject) => {
        const CSS_ID = "autodesk-viewer-css";
        const JS_ID = "autodesk-viewer-js";
        const BASE = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*";

        if (!document.getElementById(CSS_ID)) {
            const link = document.createElement("link");
            link.id = CSS_ID;
            link.rel = "stylesheet";
            link.href = `${BASE}/style.min.css`;
            document.head.appendChild(link);
        }

        if (typeof Autodesk !== "undefined") {
            resolve();
            return;
        }

        if (document.getElementById(JS_ID)) {
            const check = setInterval(() => {
                if (typeof Autodesk !== "undefined") { clearInterval(check); resolve(); }
            }, 100);
            return;
        }

        const script = document.createElement("script");
        script.id = JS_ID;
        script.src = `${BASE}/viewer3D.min.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Autodesk Viewer script"));
        document.head.appendChild(script);
    });
}
