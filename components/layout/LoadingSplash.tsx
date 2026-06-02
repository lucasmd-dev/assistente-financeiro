'use client';

import { motion } from 'motion/react';
import { LayoutDashboard } from 'lucide-react';

export function LoadingSplash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center px-6">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative grid size-20 place-items-center rounded-3xl border border-[oklch(0.7_0.18_286/0.5)] bg-[linear-gradient(135deg,oklch(0.64_0.25_286/0.3),oklch(0.82_0.15_210/0.2))] text-white shadow-[var(--shadow-glow-violet)]"
        >
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 40px -4px oklch(0.64 0.25 286 / 0.7)' }}
          />
          <LayoutDashboard size={34} />
        </motion.div>
        <div className="text-center">
          <p className="font-display text-lg font-semibold tracking-tight text-white">Assistente Financeiro</p>
          <motion.p
            className="mt-1 text-sm text-white/40"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            Carregando seu fluxo de caixa…
          </motion.p>
        </div>
      </div>
    </div>
  );
}
