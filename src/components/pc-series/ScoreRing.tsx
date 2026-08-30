import React from 'react';

// A small ring showing a PC Series variant's FPS score as a fraction of a
// fixed visual ceiling — purely decorative scaling (not a real benchmark
// max), just enough to make higher scores read as visibly "fuller" than
// lower ones. Shared by the series landing page's cards and the product
// detail page.
const SCORE_RING_MAX = 240;

export const ScoreRing: React.FC<{ score: number; settingsLabel?: string | null }> = ({ score, settingsLabel }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const fill = Math.min(1, score / SCORE_RING_MAX);

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-12 w-12 shrink-0">
        <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fill)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-orbitron text-xs font-bold">{score}</span>
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">In-Game Performance</p>
        {settingsLabel && <p className="text-[10px] text-muted-foreground">{settingsLabel}</p>}
      </div>
    </div>
  );
};
