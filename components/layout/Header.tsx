'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Download, Eye, EyeOff, LayoutDashboard, Save, Trash2, Upload } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface HeaderProps {
  hideValues: boolean;
  onToggleHide: () => void;
  onExport: () => void;
  onImport: (file: File, resetInput: () => void) => void;
  onReport: () => void;
  onClear: () => void;
  mesAtualLabel: string;
  emAtencao: boolean;
}

export function Header({
  hideValues,
  onToggleHide,
  onExport,
  onImport,
  onReport,
  onClear,
  mesAtualLabel,
  emAtencao,
}: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    if (y > prev && y > 80) setCompact(true);
    else if (y < prev || y < 20) setCompact(false);
  });

  return (
    <header className="sticky top-0 z-40 -mx-4 px-4 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'glass edge-light relative overflow-hidden rounded-2xl transition-shadow duration-300',
          compact ? 'shadow-[0_12px_40px_-18px_rgba(0,0,0,0.9)]' : '',
        )}
      >
        {/* brilho superior animado */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.18_286/0.8)] to-transparent" />

        <motion.div
          animate={{ paddingTop: compact ? 9 : 15, paddingBottom: compact ? 9 : 15 }}
          transition={spring}
          className="flex items-center justify-between gap-3 px-4 sm:px-5"
        >
          {/* Marca */}
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              animate={{ scale: compact ? 0.85 : 1 }}
              transition={spring}
              className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[oklch(0.7_0.18_286/0.5)] bg-[linear-gradient(135deg,oklch(0.64_0.25_286/0.4),oklch(0.82_0.15_210/0.2))] text-white shadow-[0_8px_24px_-10px_oklch(0.64_0.25_286/0.95)]"
            >
              <LayoutDashboard size={20} />
            </motion.div>
            <div className="min-w-0">
              <AnimatePresence initial={false}>
                {!compact && (
                  <motion.p
                    key="overline"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden text-[0.6rem] font-semibold tracking-[0.22em] text-white/40 uppercase"
                  >
                    Assistente financeiro
                  </motion.p>
                )}
              </AnimatePresence>
              <h1 className="font-display truncate bg-[linear-gradient(120deg,#fff,oklch(0.85_0.1_286))] bg-clip-text text-lg leading-tight font-bold text-transparent">
                Fluxo mensal
              </h1>
            </div>
          </div>

          {/* Contexto (some quando compacto) */}
          <AnimatePresence initial={false}>
            {!compact && (
              <motion.div
                key="ctx"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                className="hidden flex-col items-end overflow-hidden whitespace-nowrap md:flex"
              >
                <span className="text-[0.6rem] tracking-wide text-white/40 uppercase">Agora</span>
                <span className="text-sm font-medium text-white/85 capitalize">{mesAtualLabel}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ações */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'mr-1 hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold sm:inline-flex',
                emAtencao
                  ? 'border-[oklch(0.85_0.16_82/0.4)] bg-[oklch(0.85_0.16_82/0.12)] text-[oklch(0.9_0.14_82)]'
                  : 'border-[oklch(0.82_0.17_160/0.4)] bg-[oklch(0.82_0.17_160/0.12)] text-[oklch(0.88_0.15_160)]',
              )}
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={cn('size-1.5 rounded-full', emAtencao ? 'bg-[oklch(0.85_0.16_82)]' : 'bg-[oklch(0.82_0.17_160)]')}
              />
              {emAtencao ? 'atenção' : 'em dia'}
            </span>

            <IconButton tone={hideValues ? 'accent' : 'neutral'} label={hideValues ? 'Mostrar valores' : 'Ocultar valores'} onClick={onToggleHide} className="size-9 sm:size-10">
              {hideValues ? <EyeOff size={17} /> : <Eye size={17} />}
            </IconButton>
            <IconButton tone="neutral" label="Exportar backup" onClick={onExport} className="size-9 sm:size-10">
              <Save size={16} />
            </IconButton>
            <IconButton tone="neutral" label="Importar backup" onClick={() => fileRef.current?.click()} className="size-9 sm:size-10">
              <Upload size={16} />
            </IconButton>
            <IconButton tone="neutral" label="Exportar relatório" onClick={onReport} className="size-9 sm:size-10">
              <Download size={16} />
            </IconButton>
            <IconButton tone="negative" label="Limpar tudo" onClick={onClear} className="size-9 sm:size-10">
              <Trash2 size={16} />
            </IconButton>
          </div>
        </motion.div>
      </motion.div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file, () => { if (fileRef.current) fileRef.current.value = ''; });
        }}
      />
    </header>
  );
}
