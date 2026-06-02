'use client';

import { cn } from '@/lib/cn';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';
import { fieldInputClass } from './Field';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  hidden?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

export function CurrencyInput({
  value,
  onChange,
  hidden = false,
  placeholder = 'R$ 0,00',
  className,
  autoFocus,
  required,
  id,
  name,
}: CurrencyInputProps) {
  return (
    <input
      id={id}
      name={name}
      type={hidden ? 'password' : 'text'}
      inputMode="decimal"
      autoComplete="off"
      autoFocus={autoFocus}
      required={required}
      className={cn(fieldInputClass, 'num', className)}
      value={hidden ? String(value ?? '') : formatCurrencyInput(value)}
      onChange={(e) => onChange(parseCurrencyInput(e.target.value))}
      placeholder={placeholder}
    />
  );
}
