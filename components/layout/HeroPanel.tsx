'use client';

import { motion } from 'motion/react';
import type { Dispatch, SetStateAction } from 'react';
import { Calendar, CreditCard, Minus, Sparkles, TrendingUp } from 'lucide-react';
import type { Derivations } from '@/lib/finance';
import type { FinanceData } from '@/lib/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Money } from '@/components/ui/Money';
import { Pill } from '@/components/ui/Pill';
import { fieldInputClass } from '@/components/ui/Field';
import { popIn, spring, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/cn';

type ModalType = 'compra' | 'estorno' | 'despesa';

interface HeroPanelProps {
  data: FinanceData;
  setData: Dispatch<SetStateAction<FinanceData>>;
  hideValues: boolean;
  derived: Derivations;
  onOpenModal: (type: ModalType) => void;
  onOpenChat: () => void;
}

const actions = [
  { key: 'compra', title: 'Parcelado', text: 'Compra no cartão', icon: CreditCard, tone: 'accent' },
  { key: 'estorno', title: 'Estorno', text: 'Crédito previsto', icon: TrendingUp, tone: 'positive' },
  { key: 'despesa', title: 'Despesa', text: 'Fixa ou pontual', icon: Minus, tone: 'negative' },
  { key: 'analise', title: 'Análise', text: 'Consultar IA', icon: Sparkles, tone: 'cyan' },
] as const;

const actionTone: Record<string, string> = {
  accent: 'border-[oklch(0.7_0.18_286/0.4)] hover:border-[oklch(0.7_0.18_286/0.85)] hover:shadow-[0_0_34px_-8px_oklch(0.64_0.25_286/0.75)] text-[oklch(0.82_0.14_286)]',
  positive: 'border-[oklch(0.82_0.17_160/0.4)] hover:border-[oklch(0.82_0.17_160/0.85)] hover:shadow-[0_0_34px_-8px_oklch(0.82_0.17_160/0.65)] text-[oklch(0.88_0.15_160)]',
  negative: 'border-[oklch(0.68_0.25_14/0.4)] hover:border-[oklch(0.68_0.25_14/0.85)] hover:shadow-[0_0_34px_-8px_oklch(0.68_0.25_14/0.65)] text-[oklch(0.8_0.2_14)]',
  cyan: 'border-[oklch(0.82_0.15_210/0.4)] hover:border-[oklch(0.82_0.15_210/0.85)] hover:shadow-[0_0_34px_-8px_oklch(0.82_0.15_210/0.65)] text-[oklch(0.9_0.12_210)]',
};

export function HeroPanel({ data, setData, hideValues, derived, onOpenModal, onOpenChat }: HeroPanelProps) {
  return (
    <GlassCard as="section" tone="accent" className="h-full overflow-hidden p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-[oklch(0.82_0.14_286)] uppercase">
            Base do mês
          </span>
          <h2 className="font-display mt-1 text-2xl font-bold text-white">Resumo do mês</h2>
          <p className="mt-1 text-sm text-white/50">Saldo, receita, despesas ativas e corte do cartão.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="accent" className="capitalize">{derived.mesAtualLabel}</Pill>
          <Pill tone="positive">{derived.comprasAtivas.length} parcelados</Pill>
          <Pill tone="negative">{derived.estornosPendentes.length} estornos</Pill>
        </div>
      </div>

      <motion.div variants={staggerContainer(0.06, 0.12)} className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.key}
              variants={popIn}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={() => (a.key === 'analise' ? onOpenChat() : onOpenModal(a.key as ModalType))}
              className={cn(
                'group flex items-center justify-between gap-2 rounded-2xl border bg-white/[0.03] p-3.5 text-left transition-[border-color,box-shadow] duration-200',
                actionTone[a.tone],
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{a.title}</span>
                <span className="block truncate text-xs text-white/45">{a.text}</span>
              </span>
              <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div variants={staggerContainer(0.05, 0.2)} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricTile label="Saldo atual" hint="Disponível agora." tone="accent">
          <CurrencyInput
            value={data.saldoAtual}
            hidden={hideValues}
            onChange={(v) => setData((prev) => ({ ...prev, saldoAtual: v }))}
            className="border-0 bg-transparent px-0 py-0 text-2xl font-bold focus:ring-0"
          />
        </MetricTile>

        <MetricTile label="Receita mensal" hint="Base recorrente." tone="positive">
          <CurrencyInput
            value={data.salarioMensal}
            hidden={hideValues}
            onChange={(v) => setData((prev) => ({ ...prev, salarioMensal: v }))}
            className="border-0 bg-transparent px-0 py-0 text-2xl font-bold focus:ring-0"
          />
        </MetricTile>

        <MetricTile label="Despesas fixas ativas" hint="Impacto mensal atual." tone="negative">
          <Money amount={derived.totalDespesasAtivas} hidden={hideValues} className="block text-2xl font-bold text-[oklch(0.8_0.2_14)]" />
        </MetricTile>

        <MetricTile label="Fechamento do cartão" hint="Dia que vira a fatura." tone="neutral">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[oklch(0.82_0.14_286)]" />
            <input
              type="number"
              min={1}
              max={31}
              value={String(data.diaFechamento)}
              onChange={(e) => setData((prev) => ({ ...prev, diaFechamento: e.target.value }))}
              className={cn(fieldInputClass, 'num border-0 bg-transparent px-0 py-0 text-2xl font-bold focus:ring-0')}
            />
          </div>
        </MetricTile>
      </motion.div>
    </GlassCard>
  );
}

const tileBar: Record<string, string> = {
  accent: 'from-[oklch(0.64_0.25_286)]',
  positive: 'from-[oklch(0.82_0.17_160)]',
  negative: 'from-[oklch(0.68_0.25_14)]',
  neutral: 'from-white/30',
};

function MetricTile({
  label,
  hint,
  tone,
  children,
}: {
  label: string;
  hint: string;
  tone: 'accent' | 'positive' | 'negative' | 'neutral';
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={popIn}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--color-edge)] bg-white/[0.02] p-4"
    >
      <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent', tileBar[tone])} />
      <span className="text-[0.65rem] font-semibold tracking-wide text-white/45 uppercase">{label}</span>
      <div className="mt-1.5">{children}</div>
      <span className="mt-1 block text-xs text-white/35">{hint}</span>
    </motion.div>
  );
}
