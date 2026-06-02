'use client';

import { useEffect, useState } from 'react';
import { Minus } from 'lucide-react';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from '@/components/ui/Modal';
import { FieldLabel, FieldNote } from '@/components/ui/Field';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Calendar } from '@/components/ui/Calendar';
import { Toggle } from '@/components/ui/Toggle';
import { GlowButton } from '@/components/ui/GlowButton';
import type { Despesa } from '@/lib/types';

const localDate = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (despesa: Omit<Despesa, 'id'>) => void;
  editing: Despesa | null;
}

export function ModalDespesa({ isOpen, onClose, onSubmit, editing }: Props) {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [temLimite, setTemLimite] = useState(false);
  const [vezesRestantes, setVezesRestantes] = useState('');
  const [dataInicio, setDataInicio] = useState(localDate());

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      const limite = editing.vezesRestantes !== undefined && editing.vezesRestantes !== null;
      setNome(editing.nome || '');
      setValor(String(editing.valor || ''));
      setTemLimite(limite);
      setVezesRestantes(limite ? String(editing.vezesRestantes) : '');
      setDataInicio(editing.dataInicio || localDate());
    } else {
      setNome('');
      setValor('');
      setTemLimite(false);
      setVezesRestantes('');
      setDataInicio(localDate());
    }
  }, [isOpen, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor) return;
    onSubmit({
      nome,
      valor: parseFloat(valor) || 0,
      vezesRestantes: temLimite ? parseInt(vezesRestantes) || null : null,
      dataInicio: temLimite ? dataInicio : null,
    });
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md">
      <AppModalHeader
        icon={<Minus size={22} />}
        tone="negative"
        title={editing ? 'Editar despesa' : 'Nova despesa'}
        subtitle="Despesa recorrente do mês."
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
              placeholder="Ex: Aluguel, Internet, Academia…"
              className="w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]"
            />
          </div>
          <div>
            <FieldLabel>Valor mensal (R$)</FieldLabel>
            <CurrencyInput value={valor} onChange={setValor} required />
          </div>

          <Toggle isSelected={temLimite} onChange={setTemLimite}>
            Despesa com limite de vezes
          </Toggle>

          {temLimite && (
            <div className="space-y-4 rounded-xl border border-[var(--color-edge)] bg-white/[0.02] p-4">
              <div>
                <FieldLabel required>Data de início</FieldLabel>
                <Calendar value={dataInicio} onChange={setDataInicio} onClear={() => setDataInicio(localDate())} required />
                <FieldNote>A partir desta data, a despesa começa a contar na projeção.</FieldNote>
              </div>
              <div>
                <FieldLabel>Falta quantas vezes?</FieldLabel>
                <input
                  required={temLimite}
                  type="number"
                  min={1}
                  value={vezesRestantes}
                  onChange={(e) => setVezesRestantes(e.target.value)}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                  }}
                  placeholder="Ex: 6"
                  className="num w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]"
                />
                <FieldNote>A despesa é removida automaticamente quando chega a 0.</FieldNote>
              </div>
            </div>
          )}
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
