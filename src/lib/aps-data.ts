const APS_BASE = "https://developer.api.autodesk.com";

async function apsGet(path: string, token: string) {
  const res = await fetch(`${APS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`APS request failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

export async function getHubs(token: string) {
  const json = await apsGet("/project/v1/hubs", token);
  return (json.data || []).map((h: any) => ({
    id: h.id,
    name: h.attributes?.name || h.id,
  }));
}

export async function getProjects(hubId: string, token: string) {
  const json = await apsGet(`/project/v1/hubs/${hubId}/projects`, token);
  return (json.data || []).map((p: any) => ({
    id: p.id,
    name: p.attributes?.name || p.id,
    hubId,
  }));
}

export async function getTopFolders(hubId: string, projectId: string, token: string) {
  const json = await apsGet(
    `/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`,
    token
  );
  return (json.data || []).map((f: any) => ({
    type: "Folder" as const,
    name: f.attributes?.displayName || f.attributes?.name || "Unnamed",
    id: f.id,
  }));
}

export async function getFolderContents(projectId: string, folderId: string, token: string) {
  const json = await apsGet(
    `/data/v1/projects/${projectId}/folders/${folderId}/contents`,
    token
  );
  const items = json.data || [];
  const result = [];

  for (const item of items) {
    const name = item.attributes?.displayName || item.attributes?.name || "Unnamed";

    if (item.type === "folders") {
      result.push({ type: "Folder" as const, name, id: item.id });
    } else {
      const entry: any = { type: "File" as const, name, id: item.id };
      try {
        const versionsJson = await apsGet(
          `/data/v1/projects/${projectId}/items/${item.id}/versions`,
          token
        );
        const latest = (versionsJson.data || [])[0];
        if (latest) {
          entry.latestVersionId = latest.id;
          entry.modelUrn = toDerivativeUrn(latest.id);
        }
      } catch {
        // version fetch failed — item still returned without URN
      }
      result.push(entry);
    }
  }
  return result;
}

export function toDerivativeUrn(versionId: string): string {
  return Buffer.from(versionId)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function getModelProperties(modelUrn: string, token: string): Promise<any[]> {
  const metaRes = await fetch(
    `${APS_BASE}/modelderivative/v2/designdata/${modelUrn}/metadata`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
  );
  if (!metaRes.ok) throw new Error(`Metadata fetch failed [${metaRes.status}]: ${await metaRes.text()}`);
  const metaJson = await metaRes.json();
  const metadataList: any[] = metaJson?.data?.metadata || [];
  if (!metadataList.length) throw new Error("No metadata found. Ensure the model is translated.");

  const selected =
    metadataList.find((m: any) => String(m.role || "").toLowerCase() === "3d") ||
    metadataList[0];

  // Fetch without forceget — uses APS cached translation (much faster for large models)
  const all: any[] = [];
  const PAGE = 200;
  let offset = 0;

  while (true) {
    const url = `${APS_BASE}/modelderivative/v2/designdata/${modelUrn}/metadata/${selected.guid}/properties?limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (res.status === 202) {
      // APS is still processing — treat as not-ready
      throw new Error("202: Model properties are still being prepared by Autodesk. Please try again in a minute.");
    }
    if (!res.ok) throw new Error(`Properties fetch failed [${res.status}]: ${await res.text()}`);

    const json = await res.json();
    const page: any[] = json?.data?.collection || [];
    all.push(...page);

    // If we got a full page, there may be more
    if (page.length < PAGE) break;
    offset += PAGE;

    // Safety cap at 5000 elements to avoid timeouts on extremely large models
    if (all.length >= 5000) break;
  }

  return all;
}
