export type TaskStatus = "pending" | "generating" | "completed" | "failed";

export type ContentAsset = {
  id: string;
  type: "image" | "voice" | "video";
  name: string;
  url: string;
  provider: string;
};

export type ContentTask = {
  id: string;
  topic: string;
  brief?: string;
  status: TaskStatus;
  title?: string;
  script?: string;
  storyboard?: string[];
  assets: ContentAsset[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentPack = Pick<ContentTask, "title" | "script" | "storyboard" | "assets">;
