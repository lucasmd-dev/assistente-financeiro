'use client';

import { AlertTriangle } from 'lucide-react';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from './Modal';
import { GlowButton } from './GlowButton';

export interface ConfirmState {
  show: boolean;
  message: string;
  onConfirm: (() => void) | null;
  type: 'confirm' | 'alert';
}

export const initialConfirmState: ConfirmState = {
  show: false,
  message: '',
  onConfirm: null,
  type: 'confirm',
};

interface ConfirmDialogProps {
  state: ConfirmState;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ state, onCancel, onConfirm }: ConfirmDialogProps) {
  const isAlert = state.type === 'alert';
  return (
    <AppModal isOpen={state.show} onClose={onCancel} size="sm" level={90} dismissable={isAlert}>
      <AppModalHeader
        icon={<AlertTriangle size={22} />}
        tone={isAlert ? 'warn' : 'negative'}
        title={isAlert ? 'Atenção' : 'Confirmar ação'}
        onClose={onCancel}
      />
      <AppModalBody>
        <p className="text-sm leading-relaxed whitespace-pre-line text-white/70">{state.message}</p>
      </AppModalBody>
      <AppModalFooter>
        {!isAlert && (
          <GlowButton tone="ghost" onClick={onCancel}>
            Cancelar
          </GlowButton>
        )}
        <GlowButton tone={isAlert ? 'accent' : 'negative'} onClick={onConfirm}>
          {isAlert ? 'OK' : 'Confirmar'}
        </GlowButton>
      </AppModalFooter>
    </AppModal>
  );
}
