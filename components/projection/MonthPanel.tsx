'use client';

import { motion } from 'motion/react';
import { CheckCircle2, Circle, Minus, Plus } from 'lucide-react';
import type { TimelineMonth } from '@/lib/types';
import { Money } from '@/components/ui/Money';
import { popIn, spring } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface MonthPanelProps {
  month: TimelineMonth;
  index: number;
  atencao: boolean;
  hideValues: boolean;
  isFirst: boolean;
  onOpen: () => void;
  onAddEntrada: () => void;
  onAddDespesaExtra: () => void;
  onMarcarSalario: () => void;
}

export function MonthPanel({
  month,
  index,
  atencao,
  hideValues,
  isFirst,
  onOpen,
  onAddEntrada,
  onAddDespesaExtra,
  onMarcarSalario,
}: MonthPanelProps) {
  const [mesNome, anoNome] = month.name.split(' de ');

  return (
    <motion.article
      variants={popIn}
      whileHover={{ y: -4 }}
      transition={spring}
      onClick={onOpen}
      className={cn(
        'glass-strong edge-light group relative cursor-pointer overflow-hidden rounded-2xl p-4 transition-shadow duration-300',
        atencao
          ? 'border border-[oklch(0.85_0.16_82/0.3)] hover:shadow-[0_0_36px_-10px_oklch(0.85_0.16_82/0.55)]'
          : 'hover:shadow-[0_0_36px_-10px_oklch(0.64_0.25_286/0.5)]',
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent', atencao ? 'from-[oklch(0.85_0.16_82)]' : 'from-[oklch(0.64_0.25_286)]')} />

      <div className="flex items-start justify-between">
        <div>
          <span className="num text-[0.7rem] font-semibold text-white/30">{String(index + 1).padStart(2, '0')}</span>
          <h3 className="font-display text-base leading-tight font-bold text-white capitalize">{mesNome}</h3>
          <span className="num text-xs text-white/40">{anoNome}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold',
              atencao
                ? 'bg-[oklch(0.85_0.16_82/0.14)] text-[oklch(0.9_0.14_82)]'
                : 'bg-[oklch(0.82_0.17_160/0.14)] text-[oklch(0.88_0.15_160)]',
            )}
          >
            <span className={cn('size-1.5 rounded-full', atencao ? 'bg-[oklch(0.85_0.16_82)]' : 'bg-[oklch(0.82_0.17_160)]')} />
            {atencao ? 'atenção' : 'ok'}
          </span>
          <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onAddEntrada(); }}
              aria-label="Adicionar entrada extra"
              className="grid size-9 place-items-center rounded-lg border border-[oklch(0.82_0.17_160/0.3)] text-[oklch(0.88_0.15_160)] active:scale-90 hover:bg-[oklch(0.82_0.17_160/0.16)]"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAddDespesaExtra(); }}
              aria-label="Adicionar despesa extra"
              className="grid size-9 place-items-center rounded-lg border border-[oklch(0.68_0.25_14/0.3)] text-[oklch(0.8_0.2_14)] active:scale-90 hover:bg-[oklch(0.68_0.25_14/0.16)]"
            >
              <Minus size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        <Line label="Entradas" tone="positive">
          <Money amount={month.income} hidden={hideValues} prefix="+" />
        </Line>
        <Line label="Fatura do cartão" tone="negative">
          <Money amount={month.cardBill} hidden={hideValues} prefix="-" />
        </Line>
        <Line label="Despesas" tone="negative">
          <Money amount={month.expenses} hidden={hideValues} prefix="-" />
        </Line>

        <div className="my-2 h-px bg-white/[0.06]" />

        <Line label="Sobra" strong>
          <Money
            amount={month.netResult}
            hidden={hideValues}
            className={cn('text-glow', atencao ? 'text-[oklch(0.8_0.2_14)]' : 'text-[oklch(0.88_0.15_160)]')}
          />
        </Line>
        <Line label="Acumulado">
          <Money
            amount={month.finalBalance}
            hidden={hideValues}
            className={month.finalBalance >= 0 ? 'text-[oklch(0.88_0.15_160)]' : 'text-[oklch(0.8_0.2_14)]'}
          />
        </Line>
      </div>

      {isFirst && (
        <button
          onClick={(e) => { e.stopPropagation(); onMarcarSalario(); }}
          disabled={month.salarioJaRecebido}
          className={cn(
            'mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-colors',
            month.salarioJaRecebido
              ? 'cursor-default border-[oklch(0.82_0.17_160/0.3)] bg-[oklch(0.82_0.17_160/0.12)] text-[oklch(0.88_0.15_160)]'
              : 'border-[oklch(0.7_0.18_286/0.4)] text-[oklch(0.82_0.14_286)] hover:bg-[oklch(0.64_0.25_286/0.14)]',
          )}
        >
          {month.salarioJaRecebido ? <CheckCircle2 size={15} /> : <Circle size={15} />}
          {month.salarioJaRecebido ? 'Renda recebida' : 'Marcar renda recebida'}
        </button>
      )}
    </motion.article>
  );
}

function Line({
  label,
  tone,
  strong,
  children,
}: {
  label: string;
  tone?: 'positive' | 'negative';
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(strong ? 'text-white/70' : 'text-white/45')}>{label}</span>
      <span
        className={cn(
          'font-semibold',
          tone === 'positive' && 'text-[oklch(0.88_0.15_160)]',
          tone === 'negative' && 'text-[oklch(0.8_0.2_14)]',
        )}
      >
        {children}
      </span>
    </div>
  );
}
