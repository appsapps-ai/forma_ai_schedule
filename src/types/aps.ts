export interface Hub {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  hubId: string;
}

export interface FolderItem {
  type: "Folder" | "File";
  name: string;
  id: string;
  latestVersionId?: string;
  modelUrn?: string;
}

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}
