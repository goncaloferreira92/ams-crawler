import type { FileSink } from "bun";

export async function initLog() {
  let fileWriter: FileSink;
  const date = new Date().toISOString();
  const path = `log/log_${date}.txt`;
  const file = Bun.file(path);
  fileWriter = file.writer();
  return fileWriter;
}
