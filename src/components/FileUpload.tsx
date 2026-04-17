import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, FileArchive, Image, Music, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MAX_FILE_SIZE = 1024 * 1024;

export const ACCEPTED_EXTENSIONS: Record<string, string[]> = {
  "PDF Document": [".pdf"],
  "ZIP Archive": [".zip"],
  Image: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  Audio: [".mp3", ".wav", ".ogg"],
};

const ALL_EXTENSIONS = Object.values(ACCEPTED_EXTENSIONS).flat();
const ACCEPT_STRING = ALL_EXTENSIONS.join(",");

const EXTENSION_CATEGORY: Record<string, string> = {};
for (const [cat, exts] of Object.entries(ACCEPTED_EXTENSIONS)) {
  for (const ext of exts) EXTENSION_CATEGORY[ext] = cat;
}

function getFileCategory(file: File): string {
  const name = file.name.toLowerCase();
  for (const ext of ALL_EXTENSIONS) {
    if (name.endsWith(ext)) return EXTENSION_CATEGORY[ext];
  }
  return "Unknown";
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "PDF Document": return <FileText className="w-5 h-5 text-red-400" />;
    case "ZIP Archive": return <FileArchive className="w-5 h-5 text-yellow-400" />;
    case "Image": return <Image className="w-5 h-5 text-green-400" />;
    case "Audio": return <Music className="w-5 h-5 text-purple-400" />;
    default: return <FileText className="w-5 h-5 text-muted-foreground" />;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface FileUploadProps {
  onFileLoaded: (data: Uint8Array, name: string, type: string) => void;
  onClear: () => void;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export const FileUpload = ({ onFileLoaded, onClear, fileName, fileSize, fileType }: FileUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateAndLoad = useCallback((file: File) => {
    setError(null);

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALL_EXTENSIONS.includes(ext)) {
      const msg = `Unsupported file type: ${ext}. Accepted: ${ALL_EXTENSIONS.join(", ")}`;
      setError(msg);
      toast({ title: "Invalid file type", description: msg, variant: "destructive" });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const msg = `File too large (${formatSize(file.size)}). Maximum is ${formatSize(MAX_FILE_SIZE)}.`;
      setError(msg);
      toast({ title: "File too large", description: msg, variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      onFileLoaded(data, file.name, ext);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      toast({ title: "Read error", description: "Could not read the file.", variant: "destructive" });
    };
    reader.readAsArrayBuffer(file);
  }, [onFileLoaded, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndLoad(file);
  }, [validateAndLoad]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndLoad(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [validateAndLoad]);

  if (fileName && fileSize !== undefined) {
    const category = fileType ? (EXTENSION_CATEGORY[fileType] || "Unknown") : "Unknown";
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
        {getCategoryIcon(category)}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm truncate" title={fileName}>{fileName}</div>
          <div className="text-[11px] text-muted-foreground">
            {category} &middot; {formatSize(fileSize)} &middot; {category === "Image" || category === "Audio" || category === "PDF Document" ? "binary" : "binary"} data
          </div>
        </div>
        <button
          onClick={() => { onClear(); setError(null); }}
          className="shrink-0 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/10"
            : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium mb-1">
          {dragging ? "Drop file here" : "Drag & drop or click to browse"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          PDF, ZIP, Images (PNG/JPG/GIF/WebP), Audio (MP3/WAV/OGG) &middot; Max {formatSize(MAX_FILE_SIZE)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
