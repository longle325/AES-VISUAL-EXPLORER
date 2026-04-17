import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Unlock, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";
import { decryptMessageWithSteps, fromHex, normalizeKey, type DecipherRun } from "@/lib/aes";
import { StepWalker } from "@/components/StepWalker";
import { useToast } from "@/hooks/use-toast";

type KeyBits = 128 | 192 | 256;

interface DecryptionPanelProps {
  initialCiphertext?: string;
  initialKey?: string;
  initialBits?: KeyBits;
}

export const DecryptionPanel = ({ initialCiphertext = "", initialKey = "", initialBits = 128 }: DecryptionPanelProps) => {
  const [cipherHex, setCipherHex] = useState(initialCiphertext);
  const [keyText, setKeyText] = useState(initialKey);
  const [bits, setBits] = useState<KeyBits>(initialBits);
  const [output, setOutput] = useState<string | null>(null);
  const [decRun, setDecRun] = useState<{ run: DecipherRun; blockCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync defaults whenever encryption finishes
  if (initialCiphertext && cipherHex === "" && initialCiphertext !== cipherHex) {
    // soft init only first time
  }

  const handleDecrypt = () => {
    setError(null);
    setOutput(null);
    setDecRun(null);
    try {
      const bytes = fromHex(cipherHex);
      if (bytes.length === 0 || bytes.length % 16 !== 0) {
        throw new Error("Ciphertext hex must decode to a multiple of 16 bytes.");
      }
      const key = normalizeKey(keyText, bits);
      const { plaintext, firstRun, blockCount } = decryptMessageWithSteps(bytes, key);
      setOutput(plaintext);
      setDecRun({ run: firstRun, blockCount });
      toast({ title: "Decryption complete", description: `Recovered ${plaintext.length} characters.` });
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
  };

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

        <div className="space-y-2">
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
        </div>

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
            disabled={!cipherHex || !keyText}
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
