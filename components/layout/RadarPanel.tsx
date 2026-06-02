'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Edit3, Radar } from 'lucide-react';
import type { Derivations } from '@/lib/finance';
import type { FinanceData } from '@/lib/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Money } from '@/components/ui/Money';
import { cn } from '@/lib/cn';

interface RadarPanelProps {
  data: FinanceData;
  setData: Dispatch<SetStateAction<FinanceData>>;
  hideValues: boolean;
  derived: Derivations;
  editandoLimite: boolean;
  setEditandoLimite: (v: boolean) => void;
}

export function RadarPanel({
  data,
  setData,
  hideValues,
  derived,
  editandoLimite,
  setEditandoLimite,
}: RadarPanelProps) {
  const { primeiroMesCritico, mediaSobra, mesesSobControle, timeline, despesasAtivas, limiteAlertaMensal } = derived;

  return (
    <GlassCard as="aside" className="flex h-full flex-col gap-5 p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl border border-[oklch(0.82_0.15_210/0.4)] bg-[oklch(0.82_0.15_210/0.12)] text-[oklch(0.9_0.12_210)]">
            <Radar size={18} />
          </div>
          <div>
            <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/40 uppercase">Radar</span>
            <h3 className="font-display text-lg leading-tight font-bold text-white">Resumo</h3>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Row label="Primeiro mês crítico">
            <span className={cn('text-sm font-semibold capitalize', primeiroMesCritico ? 'text-[oklch(0.9_0.14_82)]' : 'text-[oklch(0.88_0.15_160)]')}>
              {primeiroMesCritico ? primeiroMesCritico.name : 'Nenhum em alerta'}
            </span>
          </Row>
          <Row label="Média de sobra">
            <Money amount={mediaSobra} hidden={hideValues} className="text-sm font-semibold text-white" />
          </Row>
          <Row label="Meses sob controle">
            <span className="num text-sm font-semibold text-white">
              {mesesSobControle}/{timeline.length}
            </span>
          </Row>
          <Row label="Alerta de sobra">
            <div className="flex items-center gap-2">
              {editandoLimite ? (
                <CurrencyInput
                  value={data.limiteAlertaMensal}
                  onChange={(v) => setData((prev) => ({ ...prev, limiteAlertaMensal: (v === '' ? 0 : parseFloat(v)) }))}
                  autoFocus
                  className="w-28 px-2 py-1 text-right text-sm"
                />
              ) : (
                <Money amount={limiteAlertaMensal} hidden={hideValues} className="text-sm font-semibold text-white" />
              )}
              <button
                type="button"
                onClick={() => setEditandoLimite(!editandoLimite)}
                aria-label="Alterar limite de alerta"
                className="grid size-7 place-items-center rounded-lg text-[oklch(0.82_0.14_286)] transition-colors hover:bg-white/10"
              >
                <Edit3 size={13} />
              </button>
            </div>
          </Row>
          <Row label="Despesas ativas">
            <span className="num text-sm font-semibold text-white">{despesasAtivas.length}</span>
          </Row>
        </div>

        <p className="rounded-xl border border-[var(--color-edge)] bg-white/[0.02] px-3 py-2.5 text-xs leading-relaxed text-white/45">
          Meses com sobra abaixo de <Money amount={limiteAlertaMensal} hidden={hideValues} className="text-white/70" /> entram em atenção.
        </p>
      </div>
    </GlassCard>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
      <span className="text-sm text-white/45">{label}</span>
      {children}
    </div>
  );
}
