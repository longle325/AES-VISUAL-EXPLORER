import { Lock } from "lucide-react";

export const Header = () => (
  <header className="relative overflow-hidden border-b border-border">
    {/* Subtle dot-grid + top-edge blue glow line */}
    <div className="absolute inset-0 grid-bg opacity-60" />
    <div className="absolute inset-0 bg-gradient-hero opacity-90" />
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent 0%, hsl(217 100% 58% / 0.8) 50%, transparent 100%)" }}
    />

    <div className="relative container py-12 md:py-20">
      {/* Badge row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-primary/40 shadow-glow animate-pulse-glow">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Rijndael / FIPS-197
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            SE362 · Lab 2
          </span>
        </div>
      </div>

      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        <span className="text-shimmer">AES</span>
        <span className="text-foreground"> Visual Explorer</span>
      </h1>

      {/* Blue accent rule matching slide style */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-0.5 w-12 rounded-full bg-primary" />
        <div className="h-0.5 w-4 rounded-full bg-accent/60" />
      </div>

      <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
        An interactive walkthrough of the Advanced Encryption Standard — watch every byte of the
        State matrix transform across <span className="text-primary font-mono">SubBytes</span>,{" "}
        <span className="text-primary font-mono">ShiftRows</span>,{" "}
        <span className="text-primary font-mono">MixColumns</span>, and{" "}
        <span className="text-primary font-mono">AddRoundKey</span>.
      </p>
    </div>
  </header>
);
