import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileArchive, Image, Music, File } from "lucide-react";
import { type DetectedFileType, type FileCategory } from "@/lib/fileDetection";
import { useToast } from "@/hooks/use-toast";

function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const CATEGORY_ICON: Record<FileCategory, React.ReactNode> = {
  image: <Image className="w-5 h-5 text-green-400" />,
  audio: <Music className="w-5 h-5 text-purple-400" />,
  pdf: <FileText className="w-5 h-5 text-red-400" />,
  zip: <FileArchive className="w-5 h-5 text-yellow-400" />,
  text: <FileText className="w-5 h-5 text-blue-400" />,
  binary: <File className="w-5 h-5 text-muted-foreground" />,
};

interface FilePreviewProps {
  data: Uint8Array;
  fileType: DetectedFileType;
  suggestedName?: string;
}

export const FilePreview = ({ data, fileType, suggestedName }: FilePreviewProps) => {
  const { toast } = useToast();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const fileName = suggestedName
    ? suggestedName.replace(/\.[^.]+$/, "") + "." + fileType.ext
    : `decrypted.${fileType.ext}`;

  useEffect(() => {
    if (fileType.category === "image" || fileType.category === "audio") {
      const blob = new Blob([data], { type: fileType.mime });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [data, fileType]);

  const handleDownload = () => {
    downloadBlob(data, fileName);
    toast({ title: "Downloaded", description: `${fileName} saved` });
  };

  const label = (
    <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
      {CATEGORY_ICON[fileType.category]}
      <span>
        {fileType.ext.toUpperCase()} &middot; {formatSize(data.length)}
      </span>
    </div>
  );

  switch (fileType.category) {
    case "image":
      return (
        <div className="space-y-2">
          {label}
          {blobUrl && (
            <div className="rounded-lg border border-border bg-secondary/30 p-2 inline-block">
              <img
                src={blobUrl}
                alt="Decrypted image"
                className="max-w-full max-h-80 rounded object-contain"
              />
            </div>
          )}
          <Button variant="outline" onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download {fileName}
          </Button>
        </div>
      );

    case "audio":
      return (
        <div className="space-y-2">
          {label}
          {blobUrl && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <audio controls className="w-full" src={blobUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
          <Button variant="outline" onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download {fileName}
          </Button>
        </div>
      );

    case "pdf":
      return (
        <div className="space-y-2">
          {label}
          <div className="rounded-lg border border-border bg-secondary/30 p-6 flex flex-col items-center justify-center gap-3">
            {CATEGORY_ICON.pdf}
            <span className="text-sm text-muted-foreground">PDF document — click to download</span>
          </div>
          <Button variant="outline" onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download {fileName}
          </Button>
        </div>
      );

    case "zip":
      return (
        <div className="space-y-2">
          {label}
          <div className="rounded-lg border border-border bg-secondary/30 p-6 flex flex-col items-center justify-center gap-3">
            {CATEGORY_ICON.zip}
            <span className="text-sm text-muted-foreground">ZIP archive — click to download</span>
          </div>
          <Button variant="outline" onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download {fileName}
          </Button>
        </div>
      );

    case "text":
      return null;

    case "binary":
    default:
      return (
        <div className="space-y-2">
          {label}
          <div className="rounded-lg border border-border bg-secondary/30 p-6 flex flex-col items-center justify-center gap-3">
            {CATEGORY_ICON.binary}
            <span className="text-sm text-muted-foreground">Binary data — click to download</span>
          </div>
          <Button variant="outline" onClick={handleDownload} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download {fileName}
          </Button>
        </div>
      );
  }
};
