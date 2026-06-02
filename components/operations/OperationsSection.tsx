'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { Derivations } from '@/lib/finance';
import { calculateParcelaAtual, getVezesRestantesAgora } from '@/lib/finance';
import { formatCurrency, formatDate, mesLabel } from '@/lib/currency';
import type { Compra, Despesa, Estorno, FinanceData } from '@/lib/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Money } from '@/components/ui/Money';
import { Pill } from '@/components/ui/Pill';
import { IconButton } from '@/components/ui/IconButton';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { cn } from '@/lib/cn';

type ModalType = 'compra' | 'estorno' | 'despesa';

interface OperationsSectionProps {
  data: FinanceData;
  derived: Derivations;
  hideValues: boolean;
  onOpenModal: (type: ModalType) => void;
  onEditCompra: (c: Compra) => void;
  onRemoveCompra: (id: number) => void;
  onToggleCompraOculta: (id: number) => void;
  onEditEstorno: (e: Estorno) => void;
  onRemoveEstorno: (id: number) => void;
  onEditDespesa: (d: Despesa) => void;
  onRemoveDespesa: (id: number) => void;
  onPagarDespesa: (d: Despesa) => void;
}

export function OperationsSection({
  data,
  derived,
  hideValues,
  onOpenModal,
  onEditCompra,
  onRemoveCompra,
  onToggleCompraOculta,
  onEditEstorno,
  onRemoveEstorno,
  onEditDespesa,
  onRemoveDespesa,
  onPagarDespesa,
}: OperationsSectionProps) {
  const { comprasAtivas, estornosPendentes, despesasAtivas } = derived;

  return (
    <section>
      <SectionHeader kicker="Listas" title="Operação" description="Lançamentos ativos e ajustes rápidos." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Parcelados */}
        <ListPanel
          icon={<CreditCard size={18} />}
          tone="accent"
          title="Parcelados"
          subtitle={`${comprasAtivas.length} ativos`}
          onAdd={() => onOpenModal('compra')}
          empty={comprasAtivas.length === 0}
          emptyIcon={<CreditCard size={40} strokeWidth={1.2} />}
          emptyText="Nenhuma compra ativa no cartão."
        >
          <AnimatePresence initial={false}>
            {comprasAtivas.map((compra) => {
              const parcelaAtual = calculateParcelaAtual(compra, data.diaFechamento);
              const valorParcela = compra.valorTotal / compra.parcelas;
              const oculta = compra.oculta;
              return (
                <LedgerRow key={compra.id} muted={oculta}>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-semibold', oculta ? 'text-white/40' : 'text-white')}>
                      {compra.item}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Pill tone="neutral">{formatDate(compra.data)}</Pill>
                      <span className="num text-xs text-white/50">
                        {compra.parcelas}x de {hideValues ? '••••' : formatCurrency(valorParcela)}
                      </span>
                      {!oculta && parcelaAtual > 0 && parcelaAtual <= compra.parcelas && (
                        <Pill tone="accent"><span className="num">{parcelaAtual}/{compra.parcelas}</span></Pill>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Money
                      amount={compra.valorTotal}
                      hidden={hideValues}
                      className={cn('text-sm font-semibold', oculta ? 'text-white/40' : 'text-[oklch(0.82_0.14_286)]')}
                    />
                    <RowActions>
                      <IconButton
                        tone="neutral"
                        label={oculta ? 'Mostrar compra' : 'Ocultar compra'}
                        onClick={() => onToggleCompraOculta(compra.id)}
                        className="size-9 sm:size-8"
                      >
                        {oculta ? <EyeOff size={14} /> : <Eye size={14} />}
                      </IconButton>
                      <IconButton tone="accent" label="Editar" onClick={() => onEditCompra(compra)} className="size-9 sm:size-8">
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton tone="negative" label="Remover" onClick={() => onRemoveCompra(compra.id)} className="size-9 sm:size-8">
                        <Trash2 size={14} />
                      </IconButton>
                    </RowActions>
                  </div>
                </LedgerRow>
              );
            })}
          </AnimatePresence>
        </ListPanel>

        {/* Estornos */}
        <ListPanel
          icon={<TrendingUp size={18} />}
          tone="positive"
          title="Estornos"
          subtitle={`${estornosPendentes.length} pendentes`}
          onAdd={() => onOpenModal('estorno')}
          empty={estornosPendentes.length === 0}
          emptyIcon={<TrendingUp size={40} strokeWidth={1.2} />}
          emptyText="Nenhum estorno pendente."
        >
          <AnimatePresence initial={false}>
            {estornosPendentes.map((estorno) => (
              <LedgerRow key={estorno.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{estorno.nome}</p>
                  <div className="mt-1.5">
                    <Pill tone="neutral">{mesLabel(estorno.mes)}</Pill>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Money amount={estorno.valor} hidden={hideValues} prefix="+" className="text-sm font-semibold text-[oklch(0.88_0.15_160)]" />
                  <RowActions>
                    <IconButton tone="accent" label="Editar" onClick={() => onEditEstorno(estorno)} className="size-9 sm:size-8">
                      <Edit3 size={14} />
                    </IconButton>
                    <IconButton tone="negative" label="Remover" onClick={() => onRemoveEstorno(estorno.id)} className="size-9 sm:size-8">
                      <Trash2 size={14} />
                    </IconButton>
                  </RowActions>
                </div>
              </LedgerRow>
            ))}
          </AnimatePresence>
        </ListPanel>

        {/* Despesas */}
        <ListPanel
          icon={<Minus size={18} />}
          tone="negative"
          title="Despesas"
          subtitle={`${despesasAtivas.length} ativas`}
          onAdd={() => onOpenModal('despesa')}
          empty={despesasAtivas.length === 0}
          emptyIcon={<Minus size={40} strokeWidth={1.2} />}
          emptyText="Nenhuma despesa cadastrada."
        >
          <AnimatePresence initial={false}>
            {despesasAtivas.map((despesa) => {
              const temLimite = despesa.vezesRestantes !== undefined && despesa.vezesRestantes !== null;
              const vezesRestantesAgora = getVezesRestantesAgora(despesa);
              return (
                <LedgerRow key={despesa.id}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{despesa.nome}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="num text-xs text-white/50">
                        {hideValues ? '••••' : formatCurrency(despesa.valor)}/mês
                      </span>
                      {temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                        <Pill tone="accent">Falta <span className="num">{vezesRestantesAgora}</span>x</Pill>
                      )}
                      {temLimite && despesa.dataInicio && <Pill tone="neutral">Início {formatDate(despesa.dataInicio)}</Pill>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Money amount={despesa.valor} hidden={hideValues} className="text-sm font-semibold text-[oklch(0.8_0.2_14)]" />
                    <RowActions>
                      {temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                        <IconButton tone="positive" label="Marcar como pago" onClick={() => onPagarDespesa(despesa)} className="size-9 sm:size-8">
                          <CheckCircle2 size={14} />
                        </IconButton>
                      )}
                      <IconButton tone="accent" label="Editar" onClick={() => onEditDespesa(despesa)} className="size-9 sm:size-8">
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton tone="negative" label="Remover" onClick={() => onRemoveDespesa(despesa.id)} className="size-9 sm:size-8">
                        <Trash2 size={14} />
                      </IconButton>
                    </RowActions>
                  </div>
                </LedgerRow>
              );
            })}
          </AnimatePresence>
        </ListPanel>
      </div>
    </section>
  );
}

const panelToneClass: Record<string, string> = {
  accent: 'border-[oklch(0.7_0.18_286/0.4)] bg-[oklch(0.64_0.25_286/0.12)] text-[oklch(0.82_0.14_286)]',
  positive: 'border-[oklch(0.82_0.17_160/0.4)] bg-[oklch(0.82_0.17_160/0.12)] text-[oklch(0.88_0.15_160)]',
  negative: 'border-[oklch(0.68_0.25_14/0.4)] bg-[oklch(0.68_0.25_14/0.12)] text-[oklch(0.8_0.2_14)]',
};

function ListPanel({
  icon,
  tone,
  title,
  subtitle,
  onAdd,
  empty,
  emptyIcon,
  emptyText,
  children,
}: {
  icon: React.ReactNode;
  tone: 'accent' | 'positive' | 'negative';
  title: string;
  subtitle: string;
  onAdd: () => void;
  empty: boolean;
  emptyIcon: React.ReactNode;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('grid size-10 place-items-center rounded-xl border', panelToneClass[tone])}>{icon}</div>
          <div>
            <h3 className="font-display text-base leading-tight font-bold text-white">{title}</h3>
            <p className="text-xs text-white/40">{subtitle}</p>
          </div>
        </div>
        <IconButton tone="accent" label={`Adicionar ${title.toLowerCase()}`} onClick={onAdd}>
          <Plus size={18} />
        </IconButton>
      </div>

      <div className="custom-scrollbar min-h-[8rem] flex-1 overflow-y-auto pr-1 lg:max-h-[26rem]">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-white/35">
            {emptyIcon}
            <p className="text-sm">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </div>
    </GlassCard>
  );
}

function LedgerRow({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-[var(--color-edge)] bg-white/[0.02] p-3',
        muted && 'opacity-60',
      )}
    >
      {children}
    </motion.div>
  );
}

function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}
