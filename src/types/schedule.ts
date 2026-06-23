export interface ElementRow {
  id: string;
  name: string;
  family: string;
  type: string;
  level: string;
}

export interface CategoryRow {
  category: string;
  count: number;
  families: string;
  types: string;
  levels: string;
  examples: string;
  elements: ElementRow[];
}

export interface ScheduleResult {
  projectId: string;
  modelUrn: string;
  totalElementsScanned: number;
  totalCategorizedElements: number;
  totalCategoriesFound: number;
  uncategorizedElements: number;
  categories: CategoryRow[];
  aiSummary?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
