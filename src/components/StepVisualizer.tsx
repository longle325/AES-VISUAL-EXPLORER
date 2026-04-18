import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { StateMatrix } from "./StateMatrix";
import type { Step } from "@/lib/aes";

interface StepVisualizerProps {
  step: Step;
}

function diffIndices(a: Step["before"], b: Step["after"]): Set<number> {
  const out = new Set<number>();
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    if (a[c][r] !== b[c][r]) out.add(r * 4 + c);
  }
  return out;
}

const KIND_COLORS: Record<Step["kind"], string> = {
  // Encryption
  init:        "from-cyan-400/80 to-cyan-600/80",
  addRoundKey: "from-fuchsia-400/80 to-fuchsia-600/80",
  subBytes:    "from-amber-400/80 to-orange-500/80",
  shiftRows:   "from-lime-400/80 to-green-500/80",
  mixColumns:  "from-sky-400/80 to-indigo-500/80",
  output:      "from-primary to-accent",
  // Decryption (inverse ops — warm counterparts)
  invSubBytes:   "from-rose-400/80 to-red-500/80",
  invShiftRows:  "from-teal-400/80 to-emerald-500/80",
  invMixColumns: "from-violet-400/80 to-purple-500/80",
};

export const StepVisualizer = ({ step }: StepVisualizerProps) => {
  const changed = useMemo(() => diffIndices(step.before, step.after), [step]);
  const showRoundKey = step.kind === "addRoundKey" && step.roundKey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${KIND_COLORS[step.kind]}`} />
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Round {step.round} / {step.totalRounds}
              {step.isFinalRound && <span className="ml-2 text-accent">• FINAL</span>}
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground">{step.title}</h3>
          </div>
        </div>
      </div>

      <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
        {step.description}
      </p>

      {/* Matrices */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 py-4">
        <StateMatrix state={step.before} label="Before" />

        {showRoundKey && (
          <>
            <div className="font-mono text-2xl text-accent">⊕</div>
            <StateMatrix state={step.roundKey!} label={`Round Key ${step.round}`} />
          </>
        )}

        <ArrowRight className="h-6 w-6 text-primary shrink-0" />

        <StateMatrix
          state={step.after}
          changed={changed}
          label={
            step.kind === "init"
              ? "Initial State"
              : step.kind === "output"
              ? "Final State"
              : "After"
          }
        />
      </div>
    </div>
  );
};
