'use client';

import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from '@/components/ui/Modal';
import { FieldLabel } from '@/components/ui/Field';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Calendar } from '@/components/ui/Calendar';
import { Dropdown } from '@/components/ui/Dropdown';
import { GlowButton } from '@/components/ui/GlowButton';
import { formatCurrency } from '@/lib/currency';
import type { Compra } from '@/lib/types';

const PARCELAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24];

const localDate = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (compra: Omit<Compra, 'id' | 'oculta'>) => void;
  editing: Compra | null;
}

export function ModalCompra({ isOpen, onClose, onSubmit, editing }: Props) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState<string>('');
  const [parcelas, setParcelas] = useState(1);
  const [data, setData] = useState(localDate());

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setNome(editing.item || '');
      setValor(String(editing.valorTotal || ''));
      setParcelas(editing.parcelas || 1);
      setData(editing.data || localDate());
    } else {
      setNome('');
      setValor('');
      setParcelas(1);
      setData(localDate());
    }
  }, [isOpen, editing]);

  const valorNum = parseFloat(valor) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    onSubmit({ item: nome, valorTotal: valorNum, parcelas: Number(parcelas), data });
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md">
      <AppModalHeader
        icon={<CreditCard size={22} />}
        tone="accent"
        title={editing ? 'Editar parcelado' : 'Novo parcelado'}
        subtitle="Compra no cartão de crédito."
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <AppModalBody className="space-y-5">
          <div>
            <FieldLabel>O que você comprou?</FieldLabel>
            <input
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: iPhone 15 Pro Max"
              className="w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Valor total (R$)</FieldLabel>
              <CurrencyInput value={valor} onChange={setValor} required />
            </div>
            <div>
              <FieldLabel required>Data da compra</FieldLabel>
              <Calendar value={data} onChange={setData} onClear={() => setData('')} required />
            </div>
          </div>
          <div>
            <FieldLabel>Quantidade de parcelas</FieldLabel>
            <Dropdown
              value={parcelas}
              onChange={(v) => setParcelas(Number(v))}
              triggerLabel={`${parcelas}x ${valorNum ? `de ${formatCurrency(valorNum / parcelas)}` : ''}`}
              options={PARCELAS.map((n) => ({
                value: n,
                label: `${n}x`,
                hint: valorNum ? formatCurrency(valorNum / n) : undefined,
              }))}
            />
          </div>
        </AppModalBody>
        <AppModalFooter>
          <GlowButton type="button" tone="ghost" onClick={onClose}>
            Cancelar
          </GlowButton>
          <GlowButton type="submit" tone="accent">
            {editing ? 'Salvar alterações' : 'Confirmar compra'}
          </GlowButton>
        </AppModalFooter>
      </form>
    </AppModal>
  );
}
