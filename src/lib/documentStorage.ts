import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const DOCUMENT_UPLOAD_SUBDIR = path.join("uploads", "documents");
const DOCUMENT_UPLOAD_PREFIX = `/${DOCUMENT_UPLOAD_SUBDIR.replace(/\\/g, "/")}/`;
const DOCUMENT_UPLOAD_DIR = path.join(process.cwd(), "public", DOCUMENT_UPLOAD_SUBDIR);

function sanitizeFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function storeDocumentFile(file: File) {
  const originalName = file.name || "document";
  const extension = path.extname(originalName).toLowerCase();
  const basename = path.basename(originalName, extension);
  const safeBasename = sanitizeFilenamePart(basename) || "document";
  const filename = `${Date.now()}-${randomUUID()}-${safeBasename}${extension}`;

  await mkdir(DOCUMENT_UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(DOCUMENT_UPLOAD_DIR, filename),
    Buffer.from(await file.arrayBuffer())
  );

  return {
    filename,
    url: `${DOCUMENT_UPLOAD_PREFIX}${filename}`,
  };
}

export async function deleteStoredDocument(url: string) {
  if (!url.startsWith(DOCUMENT_UPLOAD_PREFIX)) {
    return;
  }

  const filename = url.slice(DOCUMENT_UPLOAD_PREFIX.length);
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return;
  }

  try {
    await unlink(path.join(DOCUMENT_UPLOAD_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
