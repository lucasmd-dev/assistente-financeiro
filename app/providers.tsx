'use client';

import { I18nProvider } from '@heroui/react';
import { MotionConfig } from 'motion/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="pt-BR">
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nProvider>
  );
}
