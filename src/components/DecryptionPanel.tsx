import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Unlock, RotateCcw, AlertTriangle, ArrowRight, Paperclip, FileText } from "lucide-react";
import { decryptBytes, fromHex, normalizeKey, decryptBlockWithSteps, type DecipherRun } from "@/lib/aes";
import { detectFileType, type DetectedFileType } from "@/lib/fileDetection";
import { StepWalker } from "@/components/StepWalker";
import { FileUpload } from "@/components/FileUpload";
import { FilePreview } from "@/components/FilePreview";
import { useToast } from "@/hooks/use-toast";

type KeyBits = 128 | 192 | 256;
type DecryptInputMode = "hex" | "file";

interface DecryptionPanelProps {
  initialCiphertext?: string;
  initialKey?: string;
  initialBits?: KeyBits;
}

export const DecryptionPanel = ({ initialCiphertext = "", initialKey = "", initialBits = 128 }: DecryptionPanelProps) => {
  const [decryptMode, setDecryptMode] = useState<DecryptInputMode>("hex");
  const [cipherHex, setCipherHex] = useState(initialCiphertext);
  const [cipherFileBytes, setCipherFileBytes] = useState<Uint8Array | null>(null);
  const [cipherFileName, setCipherFileName] = useState("");
  const [cipherFileSize, setCipherFileSize] = useState(0);
  const [cipherFileType, setCipherFileType] = useState("");
  const [keyText, setKeyText] = useState(initialKey || "MySecretKey12345");
  const [bits, setBits] = useState<KeyBits>(initialBits);
  const [output, setOutput] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);
  const [outputFileType, setOutputFileType] = useState<DetectedFileType | null>(null);
  const [decRun, setDecRun] = useState<{ run: DecipherRun; blockCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDecrypt = () => {
    setError(null);
    setOutput(null);
    setOutputBytes(null);
    setOutputFileType(null);
    setDecRun(null);

    let ciphertextBytes: Uint8Array;

    if (decryptMode === "file") {
      if (!cipherFileBytes) {
        setError("Please upload an encrypted file.");
        return;
      }
      ciphertextBytes = cipherFileBytes;
    } else {
      try {
        ciphertextBytes = fromHex(cipherHex);
      } catch {
        setError("Invalid hex string.");
        return;
      }
    }

    if (ciphertextBytes.length === 0 || ciphertextBytes.length % 16 !== 0) {
      setError(`Ciphertext must be a non-zero multiple of 16 bytes (got ${ciphertextBytes.length}).`);
      return;
    }

    try {
      const key = normalizeKey(keyText, bits);
      const rawBytes = decryptBytes(ciphertextBytes, key);
      const blockCount = ciphertextBytes.length / 16;

      const detected = detectFileType(rawBytes);
      setOutputBytes(rawBytes);
      setOutputFileType(detected);

      if (detected.category === "text") {
        const text = new TextDecoder().decode(rawBytes);
        setOutput(text);
        toast({ title: "Decryption complete", description: `Recovered ${text.length} characters.` });
      } else {
        setOutput(null);
        toast({ title: "Decryption complete", description: `Recovered ${detected.ext.toUpperCase()} file (${rawBytes.length} bytes).` });
      }

      const run = decryptBlockWithSteps(ciphertextBytes.slice(0, 16), key);
      setDecRun({ run, blockCount });

      setTimeout(() => {
        document.getElementById("decrypt-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Decryption failed";
      setError(msg);
    }
  };

  const useEncryptionResult = () => {
    setCipherHex(initialCiphertext);
    setKeyText(initialKey);
    setBits(initialBits);
    setDecryptMode("hex");
  };

  const handleCipherFileLoaded = (data: Uint8Array, name: string, _type: string) => {
    setCipherFileBytes(data);
    setCipherFileName(name);
    setCipherFileSize(data.length);
    setCipherFileType(_type);
  };

  const handleCipherFileClear = () => {
    setCipherFileBytes(null);
    setCipherFileName("");
    setCipherFileSize(0);
    setCipherFileType("");
  };

  const canDecrypt = decryptMode === "hex" ? !!cipherHex && !!keyText : !!cipherFileBytes && !!keyText;

  return (
    <div className="space-y-6">
    <Card className="bg-card/60 backdrop-blur border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Unlock className="w-5 h-5 text-accent" />
          Decryption
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground leading-relaxed">
          <div className="flex items-start gap-2 mb-1.5">
            <RotateCcw className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <span className="font-semibold text-foreground">Inverse cipher</span>
          </div>
          Decryption applies the round operations in reverse using their inverses:
          <span className="font-mono text-accent"> InvShiftRows</span>,
          <span className="font-mono text-accent"> InvSubBytes</span>,
          <span className="font-mono text-accent"> InvMixColumns</span>, and
          <span className="font-mono text-accent"> AddRoundKey</span> — with round keys consumed in reverse order. The result is the original 4×4 State, read out as the original plaintext bytes.
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {([128, 192, 256] as KeyBits[]).map((b) => (
            <button
              key={b}
              onClick={() => setBits(b)}
              className={`rounded-lg border p-2.5 text-center transition-cipher ${
                bits === b
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-secondary/40 hover:border-accent/40"
              }`}
            >
              <div className="font-mono text-sm font-bold">{b}-bit</div>
            </button>
          ))}
        </div>

        <Tabs value={decryptMode} onValueChange={(v) => setDecryptMode(v as DecryptInputMode)}>
          <TabsList className="grid grid-cols-2 w-48">
            <TabsTrigger value="hex" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Hex
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              .enc File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hex" className="mt-3 space-y-2">
            <Label htmlFor="cipher" className="font-mono uppercase text-xs tracking-widest">
              Ciphertext (Hex)
            </Label>
            <Textarea
              id="cipher"
              value={cipherHex}
              onChange={(e) => setCipherHex(e.target.value)}
              placeholder="Paste hex bytes (spaces optional)…"
              className="font-mono min-h-[90px] bg-input/60 text-accent"
            />
          </TabsContent>

          <TabsContent value="file" className="mt-3">
            <Label className="font-mono uppercase text-xs tracking-widest mb-2 block">
              Encrypted File (.enc)
            </Label>
            <FileUpload
              onFileLoaded={handleCipherFileLoaded}
              onClear={handleCipherFileClear}
              fileName={cipherFileName || undefined}
              fileSize={cipherFileBytes ? cipherFileSize : undefined}
              fileType={cipherFileType || undefined}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="dkey" className="font-mono uppercase text-xs tracking-widest">
            Secret Key
          </Label>
          <Input
            id="dkey"
            value={keyText}
            onChange={(e) => setKeyText(e.target.value)}
            placeholder="The same key used for encryption"
            className="font-mono bg-input/60"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleDecrypt}
            disabled={!canDecrypt}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Unlock className="w-4 h-4 mr-2" />
            Decrypt
          </Button>
          {initialCiphertext && (
            <Button variant="outline" onClick={useEncryptionResult}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Use encryption result
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {output !== null && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Recovered Plaintext
            </div>
            <div className="font-mono text-sm p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 break-all whitespace-pre-wrap">
              {output || <span className="text-muted-foreground italic">(empty)</span>}
            </div>
          </div>
        )}

        {outputBytes && outputFileType && outputFileType.category !== "text" && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Decrypted File
            </div>
            <FilePreview
              data={outputBytes}
              fileType={outputFileType}
              suggestedName={cipherFileName ? cipherFileName.replace(/\.enc$/, "") : undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>

    {decRun && (
      <div id="decrypt-results" className="space-y-3 scroll-mt-8">
        {decRun.blockCount > 1 && (
          <div className="text-xs font-mono text-muted-foreground bg-secondary/40 border border-border rounded-lg p-3">
            ℹ Showing the step-by-step walkthrough for block #1 of {decRun.blockCount}. All blocks share the same key schedule (ECB mode).
          </div>
        )}
        <StepWalker run={decRun.run} mode="decrypt" />
      </div>
    )}
    </div>
  );
};
