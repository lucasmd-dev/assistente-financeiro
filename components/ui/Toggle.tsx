'use client';

import { Switch } from '@heroui/react';
import { cn } from '@/lib/cn';

interface ToggleProps {
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/** Toggle acessível usando o Switch da HeroUI v3 (React Aria). */
export function Toggle({ isSelected, onChange, children, className }: ToggleProps) {
  return (
    <Switch
      isSelected={isSelected}
      onChange={onChange}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-edge)] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]',
        className,
      )}
    >
      <Switch.Control className="shrink-0">
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Content className="text-sm text-white/80">{children}</Switch.Content>
    </Switch>
  );
}
