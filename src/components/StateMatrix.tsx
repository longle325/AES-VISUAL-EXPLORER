import { cn } from "@/lib/utils";
import type { State } from "@/lib/aes";

interface StateMatrixProps {
  state: State;
  highlight?: Set<number>; // indices 0..15 (column-major)
  changed?: Set<number>;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIndices?: boolean;
}

/** Renders a 4x4 AES state matrix. state[col][row] order. */
export const StateMatrix = ({ state, highlight, changed, label, size = "md", showIndices }: StateMatrixProps) => {
  const sizeClass = {
    sm: "w-9 text-[11px]",
    md: "w-12 text-sm",
    lg: "w-14 text-base",
  }[size];

  return (
    <div className="inline-flex flex-col gap-2">
      {label && (
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center">
          {label}
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-card/60 border border-border shadow-card">
        {Array.from({ length: 16 }).map((_, idx) => {
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          const byte = state[col][row];
          const isHighlight = highlight?.has(idx);
          const isChanged = changed?.has(idx);
          return (
            <div
              key={idx}
              className={cn(
                "state-cell",
                sizeClass,
                isChanged && "state-cell-changed",
                isHighlight && !isChanged && "state-cell-active",
              )}
            >
              {byte.toString(16).padStart(2, "0").toUpperCase()}
              {showIndices && (
                <span className="absolute -top-1 -left-1 text-[8px] font-mono text-muted-foreground/70">
                  {idx}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
