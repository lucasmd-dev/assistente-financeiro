'use client';

import { motion } from 'motion/react';
import { staggerContainer } from '@/lib/motion';
import { isMesAtencao } from '@/lib/finance';
import type { TimelineMonth } from '@/lib/types';
import { Money } from '@/components/ui/Money';
import { Pill } from '@/components/ui/Pill';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { MonthPanel } from './MonthPanel';

interface ProjectionGridProps {
  timeline: TimelineMonth[];
  limiteAlertaMensal: number;
  mediaSobra: number;
  emAtencao: boolean;
  hideValues: boolean;
  onOpenMes: (monthKey: string) => void;
  onAddEntrada: (monthKey: string) => void;
  onAddDespesaExtra: (monthKey: string) => void;
  onMarcarSalario: (monthKey: string) => void;
}

export function ProjectionGrid({
  timeline,
  limiteAlertaMensal,
  mediaSobra,
  emAtencao,
  hideValues,
  onOpenMes,
  onAddEntrada,
  onAddDespesaExtra,
  onMarcarSalario,
}: ProjectionGridProps) {
  return (
    <section>
      <SectionHeader
        kicker="Projeção"
        title="12 meses"
        description="Abra um mês para ver os itens e lançar extras no lugar certo."
      >
        <Pill tone="neutral">12 meses</Pill>
        <Pill tone="accent">
          média&nbsp;<Money amount={mediaSobra} hidden={hideValues} />
        </Pill>
        <Pill tone={emAtencao ? 'negative' : 'positive'}>{emAtencao ? 'atenção' : 'ok'}</Pill>
      </SectionHeader>

      <motion.div
        variants={staggerContainer(0.05)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {timeline.map((month, idx) => (
          <MonthPanel
            key={month.monthKey}
            month={month}
            index={idx}
            isFirst={idx === 0}
            atencao={isMesAtencao(month, limiteAlertaMensal)}
            hideValues={hideValues}
            onOpen={() => onOpenMes(month.monthKey)}
            onAddEntrada={() => onAddEntrada(month.monthKey)}
            onAddDespesaExtra={() => onAddDespesaExtra(month.monthKey)}
            onMarcarSalario={() => onMarcarSalario(month.monthKey)}
          />
        ))}
      </motion.div>
    </section>
  );
}
