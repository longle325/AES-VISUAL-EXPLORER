import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FastForward, Rewind, Layers, Unlock } from "lucide-react";
import { StepVisualizer } from "./StepVisualizer";
import type { Step } from "@/lib/aes";

interface AesRun {
  steps: Step[];
  Nr: number;
}

interface StepWalkerProps {
  run: AesRun;
  mode?: "encrypt" | "decrypt";
}

export const StepWalker = ({ run, mode = "encrypt" }: StepWalkerProps) => {
  const [idx, setIdx] = useState(0);
  const step = run.steps[idx];
  const total = run.steps.length;

  // Group step indices by round for the timeline
  const timeline = run.steps.map((s, i) => ({ round: s.round, kind: s.kind, i }));

  return (
    <Card className="bg-card/60 backdrop-blur border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xl">
            {mode === "decrypt"
              ? <Unlock className="w-5 h-5 text-accent" />
              : <Layers className="w-5 h-5 text-primary" />}
            {mode === "decrypt" ? "Step-by-Step Decryption" : "Step-by-Step Encryption"}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Step {idx + 1} / {total}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StepVisualizer step={step} />

        {/* Timeline */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Timeline ({run.Nr} rounds)
          </div>
          <div className="flex flex-wrap gap-1">
            {timeline.map((t) => (
              <button
                key={t.i}
                onClick={() => setIdx(t.i)}
                title={`Step ${t.i + 1}: ${run.steps[t.i].title}`}
                className={`h-2.5 rounded-full transition-cipher ${
                  t.i === idx
                    ? `w-8 ${mode === "decrypt" ? "bg-accent shadow-glow" : "bg-primary shadow-glow"}`
                    : t.i < idx
                    ? `w-3 ${mode === "decrypt" ? "bg-accent/50 hover:bg-accent/70" : "bg-primary/50 hover:bg-primary/70"}`
                    : "w-3 bg-border hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIdx(0)} disabled={idx === 0}>
              <Rewind className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setIdx(Math.min(total - 1, idx + 1))}
              disabled={idx === total - 1}
              className={mode === "decrypt"
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIdx(total - 1)} disabled={idx === total - 1}>
              <FastForward className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
