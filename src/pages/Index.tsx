import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { StepWalker } from "@/components/StepWalker";
import { OutputPanel } from "@/components/OutputPanel";
import { DecryptionPanel } from "@/components/DecryptionPanel";
import { encryptMessage, normalizeKey, toHex } from "@/lib/aes";
import { Github, Lock } from "lucide-react";

type KeyBits = 128 | 192 | 256;

interface EncryptionResult {
  ciphertext: Uint8Array;
  finalState: number[][];
  run: ReturnType<typeof encryptMessage>["firstRun"];
  hex: string;
  keyText: string;
  bits: KeyBits;
}

const Index = () => {
  const [plaintext, setPlaintext] = useState("Hello AES World!");
  const [keyText, setKeyText] = useState("MySecretKey12345");
  const [keyBits, setKeyBits] = useState<KeyBits>(128);
  const [result, setResult] = useState<EncryptionResult | null>(null);

  const handleEncrypt = () => {
    const key = normalizeKey(keyText, keyBits);
    const { ciphertext, firstRun } = encryptMessage(plaintext, key);
    const finalStep = firstRun.steps[firstRun.steps.length - 1];
    setResult({
      ciphertext,
      finalState: finalStep.after,
      run: firstRun,
      hex: toHex(ciphertext),
      keyText,
      bits: keyBits,
    });
    // Scroll to results
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const blockNote = useMemo(() => {
    if (!result) return null;
    const blockCount = result.ciphertext.length / 16;
    if (blockCount === 1) return null;
    return `Showing the step-by-step walkthrough for block #1 of ${blockCount}. All blocks are encrypted with the same algorithm (ECB mode).`;
  }, [result]);

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container py-10 md:py-16 space-y-10">
        {/* Top: input + (output or placeholder) */}
        <section className="grid lg:grid-cols-2 gap-6">
          <InputPanel
            plaintext={plaintext}
            setPlaintext={setPlaintext}
            keyText={keyText}
            setKeyText={setKeyText}
            keyBits={keyBits}
            setKeyBits={setKeyBits}
            onEncrypt={handleEncrypt}
          />

          {result ? (
            <OutputPanel ciphertext={result.ciphertext} finalState={result.finalState} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-xl bg-secondary/60 flex items-center justify-center mb-4 animate-pulse-glow">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Awaiting input</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Configure your key length, plaintext and secret key, then click <span className="text-primary font-mono">Encrypt</span> to begin the walkthrough.
              </p>
            </div>
          )}
        </section>

        {/* Step walker */}
        {result && (
          <section id="results" className="space-y-6 scroll-mt-8">
            {blockNote && (
              <div className="text-xs font-mono text-muted-foreground bg-secondary/40 border border-border rounded-lg p-3">
                ℹ {blockNote}
              </div>
            )}
            <StepWalker run={result.run} />
          </section>
        )}

        {/* Decryption */}
        <section>
          <DecryptionPanel
            initialCiphertext={result?.hex ?? ""}
            initialKey={result?.keyText ?? ""}
            initialBits={result?.bits ?? 128}
          />
        </section>

        {/* Footer */}
        <footer className="pt-10 mt-10 border-t border-border text-center text-xs text-muted-foreground font-mono space-y-2">
          <p>
            FIPS-197 reference implementation • S-box, key expansion, and GF(2⁸) MixColumns implemented from scratch for educational visualization.
          </p>
          <p className="flex items-center justify-center gap-2">
            <Github className="w-3.5 h-3.5" />
            Do not use this code for real encryption — use WebCrypto / OpenSSL.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Index;
