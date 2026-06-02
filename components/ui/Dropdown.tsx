'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fieldInputClass } from './Field';

export interface DropdownOption {
  value: string | number;
  label: string;
  hint?: string;
}

interface DropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  triggerLabel?: React.ReactNode;
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
  centered?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  triggerLabel,
  placeholder = 'Selecione',
  align = 'left',
  className,
  centered = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(fieldInputClass, 'flex items-center justify-between gap-2')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn('font-medium', centered && 'flex-1 text-center', selected ? 'text-white' : 'text-white/35')}>
          {triggerLabel ?? selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-white/40 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'glass-strong edge-light custom-scrollbar absolute z-[60] mt-2 max-h-64 w-full min-w-max overflow-y-auto rounded-xl p-1.5 shadow-[var(--shadow-glass)]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
            role="listbox"
          >
            {options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-[oklch(0.64_0.25_286/0.18)] font-semibold text-white'
                      : 'text-white/75 hover:bg-white/[0.06]',
                  )}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className={centered ? 'flex-1 text-center' : ''}>{opt.label}</span>
                  {opt.hint && <span className="num text-xs text-white/40">{opt.hint}</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
