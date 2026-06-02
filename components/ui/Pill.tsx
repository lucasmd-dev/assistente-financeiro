'use client';

import { cn } from '@/lib/cn';

export type PillTone = 'neutral' | 'accent' | 'positive' | 'negative' | 'warn' | 'cyan';

const toneClass: Record<PillTone, string> = {
  neutral: 'text-white/60 border-white/10 bg-white/[0.04]',
  accent: 'text-[oklch(0.8_0.14_286)] border-[oklch(0.7_0.18_286/0.35)] bg-[oklch(0.64_0.25_286/0.12)]',
  positive: 'text-[oklch(0.88_0.15_160)] border-[oklch(0.82_0.17_160/0.35)] bg-[oklch(0.82_0.17_160/0.12)]',
  negative: 'text-[oklch(0.8_0.2_14)] border-[oklch(0.68_0.25_14/0.4)] bg-[oklch(0.68_0.25_14/0.12)]',
  warn: 'text-[oklch(0.9_0.14_82)] border-[oklch(0.85_0.16_82/0.4)] bg-[oklch(0.85_0.16_82/0.12)]',
  cyan: 'text-[oklch(0.9_0.12_210)] border-[oklch(0.82_0.15_210/0.35)] bg-[oklch(0.82_0.15_210/0.12)]',
};

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

export function Pill({ tone = 'neutral', className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium leading-tight whitespace-nowrap',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
