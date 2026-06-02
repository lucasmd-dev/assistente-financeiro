'use client';

import { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from '@/components/ui/Modal';
import { FieldLabel } from '@/components/ui/Field';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { GlowButton } from '@/components/ui/GlowButton';
import type { Estorno } from '@/lib/types';

const MESES = [
  ['01', 'Janeiro'], ['02', 'Fevereiro'], ['03', 'Março'], ['04', 'Abril'],
  ['05', 'Maio'], ['06', 'Junho'], ['07', 'Julho'], ['08', 'Agosto'],
  ['09', 'Setembro'], ['10', 'Outubro'], ['11', 'Novembro'], ['12', 'Dezembro'],
] as const;

const currentMes = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (estorno: Omit<Estorno, 'id'>) => void;
  editing: Estorno | null;
}

export function ModalEstorno({ isOpen, onClose, onSubmit, editing }: Props) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [mes, setMes] = useState(currentMes());

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setNome(editing.nome || '');
      setValor(String(editing.valor || ''));
      setMes(editing.mes || currentMes());
    } else {
      setNome('');
      setValor('');
      setMes(currentMes());
    }
  }, [isOpen, editing]);

  const [ano, mesNum] = mes.split('-');
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - 1 + i);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nome, valor: parseFloat(valor) || 0, mes });
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md">
      <AppModalHeader
        icon={<Undo2 size={22} />}
        tone="positive"
        title={editing ? 'Editar estorno' : 'Adicionar estorno'}
        subtitle="Crédito previsto na fatura."
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <AppModalBody className="space-y-5">
          <div>
            <FieldLabel>Nome do estorno</FieldLabel>
            <input
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reembolso Amazon"
              className="w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Valor (R$)</FieldLabel>
              <CurrencyInput value={valor} onChange={setValor} required />
            </div>
            <div>
              <FieldLabel>Mês referência</FieldLabel>
              <div className="flex gap-2">
                <Dropdown
                  className="flex-1"
                  centered
                  value={mesNum}
                  onChange={(v) => setMes(`${ano}-${v}`)}
                  options={MESES.map(([value, label]) => ({ value, label }))}
                />
                <Dropdown
                  className="flex-1"
                  centered
                  value={ano}
                  onChange={(v) => setMes(`${v}-${mesNum}`)}
                  options={anos.map((a) => ({ value: String(a), label: String(a) }))}
                />
              </div>
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <GlowButton type="button" tone="ghost" onClick={onClose}>
            Cancelar
          </GlowButton>
          <GlowButton type="submit" tone="positive">
            {editing ? 'Atualizar' : 'Salvar estorno'}
          </GlowButton>
        </AppModalFooter>
      </form>
    </AppModal>
  );
}
