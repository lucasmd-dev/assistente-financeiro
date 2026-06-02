'use client';

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from '@/components/ui/Modal';
import { FieldLabel, FieldNote } from '@/components/ui/Field';
import { GlowButton } from '@/components/ui/GlowButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}

export function ModalApiKey({ isOpen, onClose, apiKey, onSave }: Props) {
  const [value, setValue] = useState(apiKey || '');

  useEffect(() => {
    if (isOpen) setValue(apiKey || '');
  }, [isOpen, apiKey]);

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md" level={80}>
      <AppModalHeader
        icon={<KeyRound size={22} />}
        tone="accent"
        title="Configurar integração"
        subtitle="Análise financeira com IA (Google Gemini)."
        onClose={onClose}
      />
      <AppModalBody className="space-y-3">
        <div>
          <FieldLabel>Chave da API do Google Gemini</FieldLabel>
          <input
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Cole a chave da sua conta aqui…"
            className="w-full rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[oklch(0.7_0.18_286/0.7)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[oklch(0.64_0.25_286/0.22)]"
          />
          <FieldNote>
            A chave fica salva só neste navegador. Gere a sua em{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[oklch(0.82_0.14_286)] underline decoration-dotted underline-offset-2"
            >
              aistudio.google.com/app/apikey
            </a>
            .
          </FieldNote>
        </div>
      </AppModalBody>
      <AppModalFooter>
        <GlowButton tone="ghost" onClick={onClose}>
          Cancelar
        </GlowButton>
        <GlowButton tone="accent" onClick={() => onSave(value.trim())}>
          Salvar configuração
        </GlowButton>
      </AppModalFooter>
    </AppModal>
  );
}
