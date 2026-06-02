'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[min(96vw,82rem)]',
};

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  level?: number;
  dismissable?: boolean;
  className?: string;
}

export function AppModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  level = 70,
  dismissable = true,
  className,
}: AppModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 grid place-items-center p-4 sm:p-6"
          style={{ zIndex: level }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (dismissable && e.target === e.currentTarget) onClose();
          }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-md" aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              'glass-strong edge-light relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-[1.6rem] shadow-[var(--shadow-glass)]',
              sizeClass[size],
              className,
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type HeaderTone = 'accent' | 'positive' | 'negative' | 'warn';

const headerToneClass: Record<HeaderTone, string> = {
  accent: 'text-[oklch(0.82_0.14_286)] bg-[oklch(0.64_0.25_286/0.16)] border-[oklch(0.7_0.18_286/0.4)]',
  positive: 'text-[oklch(0.88_0.15_160)] bg-[oklch(0.82_0.17_160/0.16)] border-[oklch(0.82_0.17_160/0.4)]',
  negative: 'text-[oklch(0.8_0.2_14)] bg-[oklch(0.68_0.25_14/0.16)] border-[oklch(0.68_0.25_14/0.4)]',
  warn: 'text-[oklch(0.9_0.14_82)] bg-[oklch(0.85_0.16_82/0.16)] border-[oklch(0.85_0.16_82/0.4)]',
};

export function AppModalHeader({
  icon,
  tone = 'accent',
  title,
  subtitle,
  onClose,
}: {
  icon?: React.ReactNode;
  tone?: HeaderTone;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--color-edge)] px-4 py-4 sm:px-6 sm:py-5">
      {icon && (
        <div className={cn('grid size-11 shrink-0 place-items-center rounded-2xl border', headerToneClass[tone])}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg leading-tight font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/50">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="grid size-9 shrink-0 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function AppModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5', className)}>{children}</div>;
}

export function AppModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 border-t border-[var(--color-edge)] px-4 py-3 sm:px-6 sm:py-4', className)}>
      {children}
    </div>
  );
}
