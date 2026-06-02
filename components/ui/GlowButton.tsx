'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/cn';

export type ButtonTone = 'accent' | 'positive' | 'negative' | 'ghost' | 'subtle';

const toneClass: Record<ButtonTone, string> = {
  accent:
    'text-white border border-[oklch(0.7_0.18_286/0.6)] bg-[linear-gradient(135deg,oklch(0.64_0.25_286),oklch(0.58_0.24_295))] shadow-[0_10px_30px_-10px_oklch(0.64_0.25_286/0.8)] hover:shadow-[0_14px_40px_-10px_oklch(0.64_0.25_286/0.95)]',
  positive:
    'text-[#03110b] border border-[oklch(0.82_0.17_160/0.6)] bg-[linear-gradient(135deg,oklch(0.84_0.17_160),oklch(0.78_0.16_160))] shadow-[0_10px_30px_-10px_oklch(0.82_0.17_160/0.8)]',
  negative:
    'text-white border border-[oklch(0.68_0.25_14/0.6)] bg-[linear-gradient(135deg,oklch(0.68_0.25_14),oklch(0.62_0.24_14))] shadow-[0_10px_30px_-10px_oklch(0.68_0.25_14/0.8)]',
  ghost:
    'text-white/85 border border-[var(--color-edge-strong)] bg-white/[0.04] hover:bg-white/[0.08] hover:text-white',
  subtle:
    'text-white/70 border border-[var(--color-edge)] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white',
};

const sizeClass = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-3 text-[0.95rem] gap-2.5 rounded-2xl',
} as const;

interface GlowButtonProps extends HTMLMotionProps<'button'> {
  tone?: ButtonTone;
  size?: keyof typeof sizeClass;
  fullWidth?: boolean;
}

export function GlowButton({
  tone = 'accent',
  size = 'md',
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold tracking-tight transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.7_0.18_286)] disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50',
        toneClass[tone],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
