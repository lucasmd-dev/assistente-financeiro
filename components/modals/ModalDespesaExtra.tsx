'use client';

import { useEffect, useState } from 'react';
import { Minus } from 'lucide-react';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from '@/components/ui/Modal';
import { FieldLabel } from '@/components/ui/Field';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Calendar } from '@/components/ui/Calendar';
import { GlowButton } from '@/components/ui/GlowButton';
import type { DespesaExtra } from '@/lib/types';

const localDate = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const currentMes = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (despesaExtra: Omit<DespesaExtra, 'id' | 'ativo'>) => void;
  mesPadrao: string | null;
  editing: DespesaExtra | null;
}

export function ModalDespesaExtra({ isOpen, onClose, onSubmit, mesPadrao, editing }: Props) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(localDate());
  const [mes, setMes] = useState(currentMes());

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setNome(editing.nome || '');
      setValor(String(editing.valor || ''));
      setData(editing.data || localDate());
      setMes(editing.mes || mesPadrao || currentMes());
    } else {
      setNome('');
      setValor('');
      setData(localDate());
      setMes(mesPadrao || currentMes());
    }
  }, [isOpen, editing, mesPadrao]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor || !mes) return;
    onSubmit({ nome, valor: parseFloat(valor) || 0, mes, data: data || localDate() });
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md">
      <AppModalHeader
        icon={<Minus size={22} />}
        tone="negative"
        title={editing ? 'Editar despesa extra' : 'Nova despesa extra'}
        subtitle="Informativo (não entra na projeção)."
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <AppModalBody className="space-y-5">
          <div>
            <FieldLabel>Nome da despesa</FieldLabel>
            <input
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Compra na distribuidora, Gasolina…"
              className="w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Valor (R$)</FieldLabel>
              <CurrencyInput value={valor} onChange={setValor} required />
            </div>
            <div>
              <FieldLabel required>Data</FieldLabel>
              <Calendar value={data} onChange={setData} onClear={() => setData('')} required />
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <GlowButton type="button" tone="ghost" onClick={onClose}>
            Cancelar
          </GlowButton>
          <GlowButton type="submit" tone="negative">
            {editing ? 'Salvar alterações' : 'Adicionar despesa'}
          </GlowButton>
        </AppModalFooter>
      </form>
    </AppModal>
  );
}
