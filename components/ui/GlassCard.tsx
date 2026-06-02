'use client';

import { cn } from '@/lib/cn';

type Tone = 'default' | 'accent' | 'positive' | 'negative' | 'warn';

const toneRing: Record<Tone, string> = {
  default: '',
  accent: 'shadow-[0_0_0_1px_oklch(0.64_0.25_286/0.25),0_24px_70px_-30px_oklch(0.64_0.25_286/0.45)]',
  positive: 'shadow-[0_0_0_1px_oklch(0.82_0.17_160/0.25),0_24px_70px_-30px_oklch(0.82_0.17_160/0.4)]',
  negative: 'shadow-[0_0_0_1px_oklch(0.68_0.25_14/0.25),0_24px_70px_-30px_oklch(0.68_0.25_14/0.4)]',
  warn: 'shadow-[0_0_0_1px_oklch(0.85_0.16_82/0.25),0_24px_70px_-30px_oklch(0.85_0.16_82/0.4)]',
};

interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  as?: React.ElementType;
}

export function GlassCard({
  tone = 'default',
  as: Tag = 'div',
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        'glass-strong edge-light relative rounded-[var(--radius-card)] shadow-[var(--shadow-glass)]',
        toneRing[tone],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
