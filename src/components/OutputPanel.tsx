import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, FileOutput, Download, ImageIcon } from "lucide-react";
import { StateMatrix } from "./StateMatrix";
import { toBase64, toHex, bytesToState } from "@/lib/aes";
import { useToast } from "@/hooks/use-toast";

const MAX_HEX_DISPLAY = 4096;

function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function GrayscaleCanvas({ data }: { data: Uint8Array }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const len = data.length;
    const width = Math.ceil(Math.sqrt(len));
    const height = Math.ceil(len / width);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < len; i++) {
      const v = data[i];
      imgData.data[i * 4] = v;
      imgData.data[i * 4 + 1] = v;
      imgData.data[i * 4 + 2] = v;
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    setPngUrl(canvas.toDataURL("image/png"));
  }, [data]);

  const handleDownloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "ciphertext-noise.png";
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-secondary/30 p-2 inline-block">
        <canvas
          ref={canvasRef}
          className="max-w-full rounded"
          style={{ imageRendering: "pixelated", maxHeight: 280 }}
        />
      </div>
      <div className="text-[11px] font-mono text-muted-foreground">
        {data.length} bytes rendered as {Math.ceil(Math.sqrt(data.length))}×{Math.ceil(data.length / Math.ceil(Math.sqrt(data.length)))} grayscale pixels
      </div>
      {pngUrl && (
        <Button variant="outline" size="sm" onClick={handleDownloadPng} className="gap-2">
          <Download className="w-3.5 h-3.5" />
          Download as PNG
        </Button>
      )}
    </div>
  );
}

interface OutputPanelProps {
  ciphertext: Uint8Array;
  finalState: number[][];
  isBinary?: boolean;
  fileName?: string;
}

export const OutputPanel = ({ ciphertext, finalState, isBinary, fileName }: OutputPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [showFullHex, setShowFullHex] = useState(false);
  const { toast } = useToast();

  const fullHex = toHex(ciphertext, " ");
  const b64 = toBase64(ciphertext);
  const hexTruncated = fullHex.length > MAX_HEX_DISPLAY && !showFullHex;
  const hexDisplay = hexTruncated ? fullHex.slice(0, MAX_HEX_DISPLAY) + "…" : fullHex;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: `${text.length} characters` });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "ciphertext";
    downloadBlob(ciphertext, `${baseName}.enc`);
    toast({ title: "Downloaded", description: `${baseName}.enc saved` });
  };

  return (
    <Card className="bg-card/60 backdrop-blur border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileOutput className="w-5 h-5 text-accent" />
          Ciphertext Output
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <StateMatrix state={finalState} label="Final State" />
          <div className="text-center">
            <div className="text-xs font-mono text-muted-foreground mb-1">read column-by-column →</div>
          </div>
          <StateMatrix state={bytesToState(ciphertext)} label="Output Bytes" />
        </div>

        <Tabs defaultValue="hex">
          <TabsList className="grid grid-cols-3 w-full md:w-72">
            <TabsTrigger value="hex">Hex</TabsTrigger>
            <TabsTrigger value="b64">Base64</TabsTrigger>
            <TabsTrigger value="visual" className="gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              Visual
            </TabsTrigger>
          </TabsList>
          <TabsContent value="hex" className="mt-3">
            <div className="relative">
              <div className="font-mono text-sm p-4 rounded-lg bg-secondary/60 border border-border break-all text-accent">
                {hexDisplay}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(fullHex.replace(/ /g, ""))}
                className="absolute top-2 right-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            {hexTruncated && (
              <Button variant="link" size="sm" onClick={() => setShowFullHex(true)} className="mt-1 text-xs">
                Show all ({fullHex.length.toLocaleString()} chars)
              </Button>
            )}
          </TabsContent>
          <TabsContent value="b64" className="mt-3">
            <div className="relative">
              <div className="font-mono text-sm p-4 rounded-lg bg-secondary/60 border border-border break-all text-accent" style={{ maxHeight: 300, overflow: "auto" }}>
                {b64}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(b64)}
                className="absolute top-2 right-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="visual" className="mt-3">
            <GrayscaleCanvas data={ciphertext} />
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          onClick={handleDownload}
          className="w-full gap-2"
        >
          <Download className="w-4 h-4" />
          Download as .enc
        </Button>
      </CardContent>
    </Card>
  );
};
