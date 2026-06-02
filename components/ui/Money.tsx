'use client';

import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/currency';

interface MoneyProps {
  amount: number;
  hidden?: boolean;
  prefix?: '' | '+' | '-';
  className?: string;
}

/** Valor monetário em fonte mono tabular; mascara como •••••• quando hidden. */
export function Money({ amount, hidden = false, prefix = '', className }: MoneyProps) {
  return (
    <span className={cn('num', className)}>
      {hidden ? '••••••' : `${prefix}${formatCurrency(amount)}`}
    </span>
  );
}
