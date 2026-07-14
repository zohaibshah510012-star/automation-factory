import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function saveGeneratedFile(taskId: string, filename: string, bytes: Uint8Array) {
  const directory = path.join(process.cwd(), "public", "generated", taskId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return "/generated/" + taskId + "/" + filename;
}
