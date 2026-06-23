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
  if (!metaRes.ok) throw new Error(`Metadata fetch failed: ${await metaRes.text()}`);
  const metaJson = await metaRes.json();
  const metadataList: any[] = metaJson?.data?.metadata || [];
  if (!metadataList.length) throw new Error("No metadata found. Ensure the model is translated.");

  const selected =
    metadataList.find((m: any) => String(m.role || "").toLowerCase() === "3d") ||
    metadataList[0];

  const propsRes = await fetch(
    `${APS_BASE}/modelderivative/v2/designdata/${modelUrn}/metadata/${selected.guid}/properties?forceget=true`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
  );
  if (!propsRes.ok) throw new Error(`Properties fetch failed: ${await propsRes.text()}`);
  const propsJson = await propsRes.json();
  return propsJson?.data?.collection || [];
}
