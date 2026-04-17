import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { InputPanel } from "@/components/InputPanel";
import { StepWalker } from "@/components/StepWalker";
import { OutputPanel } from "@/components/OutputPanel";
import { DecryptionPanel } from "@/components/DecryptionPanel";
import { encryptMessage, encryptBytes, normalizeKey, toHex } from "@/lib/aes";
import { Github, Lock } from "lucide-react";

type KeyBits = 128 | 192 | 256;
type InputMode = "text" | "file";

interface EncryptionResult {
  ciphertext: Uint8Array;
  finalState: number[][];
  run: ReturnType<typeof encryptMessage>["firstRun"];
  hex: string;
  keyText: string;
  bits: KeyBits;
  isBinary: boolean;
  fileName: string;
  fileType: string;
}

const Index = () => {
  const [plaintext, setPlaintext] = useState("Hello AES World!");
  const [keyText, setKeyText] = useState("MySecretKey12345");
  const [keyBits, setKeyBits] = useState<KeyBits>(128);
  const [result, setResult] = useState<EncryptionResult | null>(null);

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("");

  const handleFileLoaded = (data: Uint8Array, name: string, type: string) => {
    setFileBytes(data);
    setFileName(name);
    setFileSize(data.length);
    setFileType(type);
  };

  const handleFileClear = () => {
    setFileBytes(null);
    setFileName("");
    setFileSize(0);
    setFileType("");
  };

  const handleEncrypt = () => {
    const key = normalizeKey(keyText, keyBits);

    let cipherResult: { ciphertext: Uint8Array; firstRun: ReturnType<typeof encryptMessage>["firstRun"] };

    if (inputMode === "file" && fileBytes) {
      cipherResult = encryptBytes(fileBytes, key);
    } else {
      cipherResult = encryptMessage(plaintext, key);
    }

    const finalStep = cipherResult.firstRun.steps[cipherResult.firstRun.steps.length - 1];
    setResult({
      ciphertext: cipherResult.ciphertext,
      finalState: finalStep.after,
      run: cipherResult.firstRun,
      hex: toHex(cipherResult.ciphertext),
      keyText,
      bits: keyBits,
      isBinary: inputMode === "file",
      fileName,
      fileType,
    });

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
        <section className="grid lg:grid-cols-2 gap-6">
          <InputPanel
            plaintext={plaintext}
            setPlaintext={setPlaintext}
            keyText={keyText}
            setKeyText={setKeyText}
            keyBits={keyBits}
            setKeyBits={setKeyBits}
            onEncrypt={handleEncrypt}
            inputMode={inputMode}
            setInputMode={setInputMode}
            fileBytes={fileBytes}
            fileName={fileName}
            fileSize={fileSize}
            fileType={fileType}
            onFileLoaded={handleFileLoaded}
            onFileClear={handleFileClear}
          />

          {result ? (
            <OutputPanel
              ciphertext={result.ciphertext}
              finalState={result.finalState}
              isBinary={result.isBinary}
              fileName={result.fileName}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-xl bg-secondary/60 flex items-center justify-center mb-4 animate-pulse-glow">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Awaiting input</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Configure your key length, plaintext or file, and secret key, then click <span className="text-primary font-mono">Encrypt</span> to begin the walkthrough.
              </p>
            </div>
          )}
        </section>

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

        <section>
          <DecryptionPanel
            initialCiphertext={result?.hex ?? ""}
            initialKey={result?.keyText ?? ""}
            initialBits={result?.bits ?? 128}
          />
        </section>

        <footer className="pt-10 mt-10 border-t border-border text-center text-xs text-muted-foreground font-mono space-y-2">
          <p>
            FIPS-197 reference implementation • S-box, key expansion, and GF(2⁸) MixColumns implemented from scratch for educational visualization.
          </p>
          <p className="flex items-center justify-center gap-2">
            <Github className="w-3.5 h-3.5" />
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Index;
