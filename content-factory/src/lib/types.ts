export type TaskStatus = "pending" | "running" | "generating" | "completed" | "failed";

export type ContentAsset = {
  id: string;
  type: "image" | "voice" | "video";
  name: string;
  url: string;
  provider: string;
};

export type ContentTask = {
  id: string;
  userId?: string;
  topic: string;
  brief?: string;
  taskType?: "marketing" | "short_video_script" | "video" | "image" | "drama" | "ecommerce" | "social";
  promptId?: string;
  agentId?: string;
  creditsCharged?: number;
  status: TaskStatus;
  title?: string;
  script?: string;
  storyboard?: string[];
  assets: ContentAsset[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
};

export type ContentPack = Pick<ContentTask, "title" | "script" | "storyboard" | "assets">;
