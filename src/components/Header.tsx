import { Lock, ShieldCheck } from "lucide-react";

export const Header = () => (
  <header className="relative overflow-hidden border-b border-border">
    <div className="absolute inset-0 grid-bg opacity-50" />
    <div className="absolute inset-0 bg-gradient-hero opacity-80" />
    <div className="relative container py-12 md:py-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-primary/40 shadow-glow">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          Rijndael / FIPS-197
        </span>
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        <span className="text-shimmer">AES</span>
        <span className="text-foreground"> Visualizer</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
        An interactive walkthrough of the Advanced Encryption Standard. Watch every byte of the
        State matrix transform across SubBytes, ShiftRows, MixColumns, and AddRoundKey.
      </p>
    </div>
  </header>
);
