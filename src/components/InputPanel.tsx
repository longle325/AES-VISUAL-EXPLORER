import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Play, KeyRound, FileText, Paperclip } from "lucide-react";
import { padPlaintext, padBytes, toHex } from "@/lib/aes";
import { FileUpload } from "@/components/FileUpload";

type KeyBits = 128 | 192 | 256;
type InputMode = "text" | "file";

interface InputPanelProps {
  plaintext: string;
  setPlaintext: (s: string) => void;
  keyText: string;
  setKeyText: (s: string) => void;
  keyBits: KeyBits;
  setKeyBits: (b: KeyBits) => void;
  onEncrypt: () => void;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  fileBytes: Uint8Array | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  onFileLoaded: (data: Uint8Array, name: string, type: string) => void;
  onFileClear: () => void;
}

const ROUND_INFO: Record<KeyBits, { rounds: number; bytes: number }> = {
  128: { rounds: 10, bytes: 16 },
  192: { rounds: 12, bytes: 24 },
  256: { rounds: 14, bytes: 32 },
};

export const InputPanel = (props: InputPanelProps) => {
  const {
    plaintext, setPlaintext, keyText, setKeyText, keyBits, setKeyBits, onEncrypt,
    inputMode, setInputMode, fileBytes, fileName, fileSize, fileType,
    onFileLoaded, onFileClear,
  } = props;

  const textBlocks = useMemo(() => {
    if (!plaintext) return [];
    return padPlaintext(plaintext);
  }, [plaintext]);

  const fileBlocks = useMemo(() => {
    if (!fileBytes) return [];
    return padBytes(fileBytes);
  }, [fileBytes]);

  const blocks = inputMode === "text" ? textBlocks : fileBlocks;
  const info = ROUND_INFO[keyBits];
  const keyBytesUsed = Math.min(new TextEncoder().encode(keyText).length, info.bytes);
  const canEncrypt = inputMode === "text" ? !!plaintext && !!keyText : !!fileBytes && !!keyText;

  return (
    <Card className="bg-card/60 backdrop-blur border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-5 h-5 text-primary" />
          Input & Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key length selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="font-mono uppercase text-xs tracking-widest">Key Length</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Key length determines the number of rounds: 128-bit → 10 rounds, 192-bit → 12 rounds, 256-bit → 14 rounds.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([128, 192, 256] as KeyBits[]).map((b) => (
              <button
                key={b}
                onClick={() => setKeyBits(b)}
                className={`group relative rounded-lg border p-3 text-left transition-cipher ${
                  keyBits === b
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border bg-secondary/40 hover:border-primary/40"
                }`}
              >
                <div className={`font-mono text-lg font-bold ${keyBits === b ? "text-primary" : "text-foreground"}`}>
                  {b}-bit
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {ROUND_INFO[b].rounds} rounds
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input mode tabs */}
        <div className="space-y-2">
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
            <TabsList className="grid grid-cols-2 w-48">
              <TabsTrigger value="text" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Text
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-3 space-y-2">
              <Label htmlFor="plaintext" className="font-mono uppercase text-xs tracking-widest">
                Plaintext
              </Label>
              <Textarea
                id="plaintext"
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                placeholder="Enter the message to encrypt…"
                className="font-mono min-h-[110px] resize-none bg-input/60"
              />
            </TabsContent>

            <TabsContent value="file" className="mt-3">
              <Label className="font-mono uppercase text-xs tracking-widest mb-2 block">
                File Input
              </Label>
              <FileUpload
                onFileLoaded={onFileLoaded}
                onClear={onFileClear}
                fileName={fileName || undefined}
                fileSize={fileBytes ? fileSize : undefined}
                fileType={fileType || undefined}
              />
            </TabsContent>
          </Tabs>

          {blocks.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Divided into {blocks.length} block{blocks.length > 1 ? "s" : ""} of 128 bits (PKCS#7 padded)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {blocks.slice(0, 16).map((b, i) => (
                  <div
                    key={i}
                    className="font-mono text-[10px] px-2 py-1.5 rounded-md bg-secondary/60 border border-border text-muted-foreground"
                    title={`Block ${i + 1}`}
                  >
                    <span className="text-primary">#{i + 1}</span> {toHex(b, " ")}
                  </div>
                ))}
                {blocks.length > 16 && (
                  <div className="font-mono text-[10px] px-2 py-1.5 rounded-md bg-secondary/60 border border-border text-muted-foreground">
                    +{blocks.length - 16} more…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Key */}
        <div className="space-y-2">
          <Label htmlFor="key" className="font-mono uppercase text-xs tracking-widest flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" />
            Secret Key
          </Label>
          <Input
            id="key"
            value={keyText}
            onChange={(e) => setKeyText(e.target.value)}
            placeholder={`Up to ${info.bytes} characters (${keyBits} bits)`}
            className="font-mono bg-input/60"
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>
              Using <span className="text-primary">{keyBytesUsed}</span> / {info.bytes} bytes
              {keyBytesUsed < info.bytes && " (zero-padded)"}
            </span>
          </div>
        </div>

        <Button
          onClick={onEncrypt}
          disabled={!canEncrypt}
          className="w-full bg-gradient-cipher text-primary-foreground font-semibold hover:opacity-90 shadow-glow transition-cipher"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Encrypt & Visualize
        </Button>
      </CardContent>
    </Card>
  );
};
