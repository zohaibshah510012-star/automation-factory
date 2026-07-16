import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function writeIfAvailable(baseDirectory: string, taskId: string, filename: string, bytes: Uint8Array) {
  try {
    await access(baseDirectory);
  } catch {
    return;
  }
  const directory = path.join(baseDirectory, "generated", taskId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
}

export async function saveGeneratedFile(taskId: string, filename: string, bytes: Uint8Array) {
  const publicDirectory = path.join(process.cwd(), "public");
  const standalonePublicDirectory = path.join(process.cwd(), ".next", "standalone", "public");
  const directory = path.join(publicDirectory, "generated", taskId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  if (standalonePublicDirectory !== publicDirectory) {
    await writeIfAvailable(standalonePublicDirectory, taskId, filename, bytes);
  }
  return "/generated/" + taskId + "/" + filename;
}
