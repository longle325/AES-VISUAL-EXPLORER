export type FileCategory = "image" | "audio" | "pdf" | "zip" | "text" | "binary";

export interface DetectedFileType {
  mime: string;
  ext: string;
  category: FileCategory;
}

const UNKNOWN: DetectedFileType = { mime: "application/octet-stream", ext: "bin", category: "binary" };

function bytesAt(data: Uint8Array, offset: number, len: number): number[] {
  const out: number[] = [];
  for (let i = offset; i < offset + len && i < data.length; i++) out.push(data[i]);
  return out;
}

function startsWith(data: Uint8Array, signature: number[]): boolean {
  if (data.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) return false;
  }
  return true;
}

export function detectFileType(data: Uint8Array): DetectedFileType {
  if (data.length === 0) return { mime: "text/plain", ext: "txt", category: "text" };

  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: "png", category: "image" };
  }
  if (startsWith(data, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", ext: "jpg", category: "image" };
  }
  if (startsWith(data, [0x47, 0x49, 0x46, 0x38])) {
    return { mime: "image/gif", ext: "gif", category: "image" };
  }
  if (data.length >= 12 && startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data.slice(8), [0x57, 0x45, 0x42, 0x50])) {
    return { mime: "image/webp", ext: "webp", category: "image" };
  }

  if (startsWith(data, [0x25, 0x50, 0x44, 0x46])) {
    return { mime: "application/pdf", ext: "pdf", category: "pdf" };
  }

  if (startsWith(data, [0x50, 0x4b, 0x03, 0x04]) || startsWith(data, [0x50, 0x4b, 0x05, 0x06])) {
    return { mime: "application/zip", ext: "zip", category: "zip" };
  }

  if (startsWith(data, [0x49, 0x44, 0x33]) || startsWith(data, [0xff, 0xfb]) || startsWith(data, [0xff, 0xf3]) || startsWith(data, [0xff, 0xf2])) {
    return { mime: "audio/mpeg", ext: "mp3", category: "audio" };
  }
  if (startsWith(data, [0x52, 0x49, 0x46, 0x46]) && data.length >= 12) {
    const fmt = bytesAt(data, 8, 4);
    if (fmt[0] === 0x57 && fmt[1] === 0x41 && fmt[2] === 0x56 && fmt[3] === 0x45) {
      return { mime: "audio/wav", ext: "wav", category: "audio" };
    }
  }
  if (startsWith(data, [0x4f, 0x67, 0x67, 0x53])) {
    return { mime: "audio/ogg", ext: "ogg", category: "audio" };
  }

  if (isLikelyText(data)) {
    return { mime: "text/plain", ext: "txt", category: "text" };
  }

  return UNKNOWN;
}

function isLikelyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  const sample = bytes.length > 512 ? bytes.slice(0, 512) : bytes;
  let printable = 0;
  for (const b of sample) {
    if ((b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d || b >= 0x80) {
      printable++;
    }
  }
  return printable / sample.length > 0.85;
}

const EXT_CATEGORY: Record<string, FileCategory> = {
  ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image",
  ".pdf": "pdf",
  ".zip": "zip",
  ".mp3": "audio", ".wav": "audio", ".ogg": "audio",
};

export function categoryFromExt(ext: string): FileCategory | null {
  return EXT_CATEGORY[ext.toLowerCase()] ?? null;
}
