'use client';

import { cn } from '@/lib/cn';

export const fieldInputClass =
  'w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]';

export function FieldLabel({
  children,
  required,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn('mb-2 block text-xs font-semibold tracking-wide text-white/55 uppercase', className)}>
      {children}
      {required && <span className="ml-1 text-[oklch(0.8_0.2_14)]">*</span>}
    </label>
  );
}

export function FieldNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mt-2 text-xs leading-relaxed text-white/40', className)}>{children}</p>;
}

export function FieldInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldInputClass, className)} {...props} />;
}

export function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-0', className)}>{children}</div>;
}
