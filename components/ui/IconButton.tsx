'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

export type IconTone = 'neutral' | 'accent' | 'positive' | 'negative';

const toneClass: Record<IconTone, string> = {
  neutral: 'text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20',
  accent:
    'text-[oklch(0.8_0.14_286)] hover:bg-[oklch(0.64_0.25_286/0.16)] hover:border-[oklch(0.7_0.18_286/0.5)]',
  positive:
    'text-[oklch(0.88_0.15_160)] hover:bg-[oklch(0.82_0.17_160/0.16)] hover:border-[oklch(0.82_0.17_160/0.5)]',
  negative:
    'text-[oklch(0.8_0.2_14)] hover:bg-[oklch(0.68_0.25_14/0.16)] hover:border-[oklch(0.68_0.25_14/0.5)]',
};

interface IconButtonProps extends HTMLMotionProps<'button'> {
  tone?: IconTone;
  label: string;
}

export function IconButton({
  tone = 'neutral',
  label,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 460, damping: 24 }}
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid size-9 place-items-center rounded-xl border border-[var(--color-edge)] bg-white/[0.03] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.7_0.18_286)]',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
