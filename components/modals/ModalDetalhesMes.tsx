'use client';

import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, DollarSign, Edit3, Minus, Power, Trash2, TrendingUp } from 'lucide-react';
import { AppModal, AppModalBody, AppModalHeader } from '@/components/ui/Modal';
import { Money } from '@/components/ui/Money';
import { Pill } from '@/components/ui/Pill';
import { IconButton } from '@/components/ui/IconButton';
import { computeMesDetalhe } from '@/lib/mesDetalhe';
import { formatDate } from '@/lib/currency';
import type { Despesa, DespesaExtra, EntradaExtra, FinanceData } from '@/lib/types';
import { cn } from '@/lib/cn';

interface Props {
  monthKey: string | null;
  monthName: string;
  data: FinanceData;
  hideValues: boolean;
  onClose: () => void;
  onEditEntrada: (e: EntradaExtra) => void;
  onRemoveEntrada: (id: number) => void;
  onToggleEntrada: (id: number) => void;
  onEditDespesaExtra: (d: DespesaExtra) => void;
  onRemoveDespesaExtra: (id: number) => void;
  onToggleDespesaExtra: (id: number) => void;
  onEditDespesa: (d: Despesa) => void;
  onRemoveDespesa: (id: number) => void;
}

function vezesRestantesNoMes(despesa: Despesa, mesDate: Date): number | null {
  const temLimite = despesa.vezesRestantes !== undefined && despesa.vezesRestantes !== null;
  if (!temLimite) return null;
  const inicial = parseInt(String(despesa.vezesRestantes)) || 0;
  if (!despesa.dataInicio) return inicial;
  const [iAno, iMes] = despesa.dataInicio.split('-').map(Number);
  const inicioDate = new Date(iAno, iMes - 1, 1);
  if (mesDate < inicioDate) return inicial;
  const mesesPassados =
    (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 + (mesDate.getMonth() - inicioDate.getMonth());
  return inicial - mesesPassados;
}

export function ModalDetalhesMes(props: Props) {
  const { monthKey, monthName, data, hideValues, onClose } = props;
  const detalhe = monthKey ? computeMesDetalhe(data, monthKey) : null;
  const [mesAno, mesNum] = monthKey ? monthKey.split('-').map(Number) : [0, 0];
  const mesDate = monthKey ? new Date(mesAno, mesNum - 1, 1) : new Date();

  return (
    <AppModal isOpen={monthKey !== null} onClose={onClose} size="xl">
      <AppModalHeader
        icon={<CalendarDays size={22} />}
        tone="accent"
        title={`Detalhes — ${monthName}`}
        subtitle="Entradas, despesas e fatura do mês."
        onClose={onClose}
      />
      {detalhe && (
        <AppModalBody className="space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryTile icon={<TrendingUp size={18} />} tone="positive" title="Entradas" subtitle="Salário e extras">
              <SummaryRow label="Receita mensal" hidden={hideValues} amount={detalhe.salarioMensal} tone="positive" />
              {detalhe.totalEntradasExtras > 0 && (
                <SummaryRow label="Extras" hidden={hideValues} amount={detalhe.totalEntradasExtras} tone="accent" />
              )}
              <SummaryTotal label="Total" hidden={hideValues} amount={detalhe.totalEntradas} tone="positive" />
            </SummaryTile>

            <SummaryTile icon={<Minus size={18} />} tone="negative" title="Despesas" subtitle="Fixas e extras">
              {detalhe.totalDespesasExtras > 0 && (
                <SummaryRow label="Extras" hidden={hideValues} amount={detalhe.totalDespesasExtras} tone="negative" />
              )}
              <SummaryTotal label="Total" hidden={hideValues} amount={detalhe.totalDespesasFixas} tone="negative" />
            </SummaryTile>

            <SummaryTile icon={<TrendingUp size={18} />} tone="accent" title="Fatura do cartão" subtitle="Parcelas e abatimentos">
              <SummaryRow label="Parcelas" hidden={hideValues} amount={detalhe.faturaBruta} tone="accent" />
              {detalhe.totalEstornos > 0 && (
                <SummaryRow label="Estornos" hidden={hideValues} amount={detalhe.totalEstornos} prefix="-" tone="positive" />
              )}
              <SummaryTotal label="Total" hidden={hideValues} amount={Math.max(0, detalhe.faturaCartao)} tone="accent" />
            </SummaryTile>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Entradas do mês */}
            <section>
              <div className="mb-3">
                <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/40 uppercase">Entradas extras</span>
                <h3 className="font-display text-base font-bold text-white">Entradas do mês</h3>
              </div>
              {detalhe.entradasDoMes.length === 0 ? (
                <Empty icon={<DollarSign size={36} strokeWidth={1.2} />} text="Nenhuma entrada extra neste mês." />
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {detalhe.entradasDoMes.map((entrada) => {
                      const isMesOriginal = entrada.mes === monthKey;
                      const [eAno, eMes] = entrada.mes.split('-').map(Number);
                      const nomeOrigem = new Date(eAno, eMes - 1, 1).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      });
                      const editavel = !entrada.recorrente || isMesOriginal;
                      return (
                        <DetailItem key={`${entrada.id}-${monthKey}`} muted={entrada.ativo === false}>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={cn('text-sm font-semibold', entrada.ativo === false ? 'text-white/40' : 'text-white')}>
                                {entrada.nome}
                              </h4>
                              {entrada.recorrente && <Pill tone="accent">Recorrente</Pill>}
                              {entrada.recorrente && !isMesOriginal && <Pill tone="neutral">Desde {nomeOrigem}</Pill>}
                              {entrada.ativo === false && <Pill tone="negative">Desativada</Pill>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <Money amount={entrada.valor} hidden={hideValues} className="text-sm font-semibold text-[oklch(0.88_0.15_160)]" />
                              {entrada.data && <Pill tone="neutral">{formatDate(entrada.data)}</Pill>}
                            </div>
                          </div>
                          {editavel ? (
                            <div className="flex items-center gap-1">
                              <IconButton tone={entrada.ativo === false ? 'positive' : 'neutral'} label={entrada.ativo === false ? 'Ativar' : 'Desativar'} onClick={() => props.onToggleEntrada(entrada.id)} className="size-9 sm:size-8">
                                <Power size={14} />
                              </IconButton>
                              <IconButton tone="accent" label="Editar" onClick={() => props.onEditEntrada(entrada)} className="size-9 sm:size-8">
                                <Edit3 size={14} />
                              </IconButton>
                              <IconButton tone="negative" label="Remover" onClick={() => props.onRemoveEntrada(entrada.id)} className="size-9 sm:size-8">
                                <Trash2 size={14} />
                              </IconButton>
                            </div>
                          ) : (
                            <Pill tone="neutral">Edite no mês original</Pill>
                          )}
                        </DetailItem>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Despesas do mês */}
            <section>
              <div className="mb-3">
                <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/40 uppercase">Saídas do mês</span>
                <h3 className="font-display text-base font-bold text-white">Despesas do mês</h3>
              </div>
              {(() => {
                const todas = [
                  ...detalhe.despesasFixasDoMes.map((d) => ({ ...d, _tipo: 'fixa' as const })),
                  ...detalhe.despesasExtrasDoMes.map((d) => ({ ...d, _tipo: 'extra' as const })),
                ];
                if (todas.length === 0) {
                  return <Empty icon={<Minus size={36} strokeWidth={1.2} />} text="Nenhuma despesa neste mês." />;
                }
                return (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {todas.map((d) => {
                        const isExtra = d._tipo === 'extra';
                        const temLimite = !isExtra && d.vezesRestantes !== undefined && d.vezesRestantes !== null;
                        const restantes = !isExtra ? vezesRestantesNoMes(d as Despesa, mesDate) : null;
                        const ativo = (d as DespesaExtra).ativo;
                        return (
                          <DetailItem key={`${d._tipo}-${d.id}`} muted={isExtra && ativo === false}>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className={cn('text-sm font-semibold', isExtra && ativo === false ? 'text-white/40' : 'text-white')}>
                                  {d.nome}
                                </h4>
                                {temLimite && restantes !== null && restantes > 0 && (
                                  <Pill tone="accent">Falta <span className="num">{restantes}</span>x</Pill>
                                )}
                                {isExtra && ativo === false && <Pill tone="negative">Desativada</Pill>}
                                {!isExtra && <Pill tone="neutral">Fixa</Pill>}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <Money amount={d.valor} hidden={hideValues} className="text-sm font-semibold text-[oklch(0.8_0.2_14)]" />
                                {isExtra && (d as DespesaExtra).data && <Pill tone="neutral">{formatDate((d as DespesaExtra).data)}</Pill>}
                                {!isExtra && temLimite && (d as Despesa).dataInicio && (
                                  <Pill tone="neutral">Início {formatDate((d as Despesa).dataInicio as string)}</Pill>
                                )}
                                {!isExtra && <span className="text-xs text-white/40">/mês</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isExtra ? (
                                <>
                                  <IconButton tone={ativo === false ? 'positive' : 'neutral'} label={ativo === false ? 'Ativar' : 'Desativar'} onClick={() => props.onToggleDespesaExtra(d.id)} className="size-9 sm:size-8">
                                    <Power size={14} />
                                  </IconButton>
                                  <IconButton tone="accent" label="Editar" onClick={() => props.onEditDespesaExtra(d as DespesaExtra)} className="size-9 sm:size-8">
                                    <Edit3 size={14} />
                                  </IconButton>
                                  <IconButton tone="negative" label="Remover" onClick={() => props.onRemoveDespesaExtra(d.id)} className="size-9 sm:size-8">
                                    <Trash2 size={14} />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <IconButton tone="accent" label="Editar" onClick={() => props.onEditDespesa(d as Despesa)} className="size-9 sm:size-8">
                                    <Edit3 size={14} />
                                  </IconButton>
                                  <IconButton tone="negative" label="Remover" onClick={() => props.onRemoveDespesa(d.id)} className="size-9 sm:size-8">
                                    <Trash2 size={14} />
                                  </IconButton>
                                </>
                              )}
                            </div>
                          </DetailItem>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </section>
          </div>
        </AppModalBody>
      )}
    </AppModal>
  );
}

const tileTone: Record<string, string> = {
  positive: 'border-[oklch(0.82_0.17_160/0.3)] bg-[oklch(0.82_0.17_160/0.07)]',
  negative: 'border-[oklch(0.68_0.25_14/0.3)] bg-[oklch(0.68_0.25_14/0.07)]',
  accent: 'border-[oklch(0.7_0.18_286/0.3)] bg-[oklch(0.64_0.25_286/0.07)]',
};
const tileIconTone: Record<string, string> = {
  positive: 'text-[oklch(0.88_0.15_160)]',
  negative: 'text-[oklch(0.8_0.2_14)]',
  accent: 'text-[oklch(0.82_0.14_286)]',
};

function SummaryTile({
  icon,
  tone,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  tone: 'positive' | 'negative' | 'accent';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border p-4', tileTone[tone])}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={cn('grid size-9 place-items-center rounded-xl bg-white/[0.05]', tileIconTone[tone])}>{icon}</div>
        <div>
          <h3 className="font-display text-sm font-bold text-white">{title}</h3>
          <p className="text-[0.7rem] text-white/40">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

const moneyTone: Record<string, string> = {
  positive: 'text-[oklch(0.88_0.15_160)]',
  negative: 'text-[oklch(0.8_0.2_14)]',
  accent: 'text-[oklch(0.82_0.14_286)]',
};

function SummaryRow({ label, amount, hidden, tone, prefix }: { label: string; amount: number; hidden: boolean; tone: string; prefix?: '' | '-' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <Money amount={amount} hidden={hidden} prefix={prefix} className={cn('font-semibold', moneyTone[tone])} />
    </div>
  );
}

function SummaryTotal({ label, amount, hidden, tone }: { label: string; amount: number; hidden: boolean; tone: string }) {
  return (
    <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-2 text-sm">
      <span className="font-semibold text-white/70">{label}</span>
      <Money amount={amount} hidden={hidden} className={cn('text-base font-bold', moneyTone[tone])} />
    </div>
  );
}

function DetailItem({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-[var(--color-edge)] bg-white/[0.02] p-3 sm:flex-row sm:items-start sm:justify-between',
        muted && 'opacity-60',
      )}
    >
      {children}
    </motion.div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 py-10 text-center text-white/35">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
}
