'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useHideValues } from '@/hooks/useHideValues';
import { deriveDashboard, getVezesRestantesAgora } from '@/lib/finance';
import { exportBackup, importBackup } from '@/lib/backup';
import { generateReport } from '@/lib/report';
import { createClearedData } from '@/lib/state';
import type {
  Compra,
  Despesa,
  DespesaExtra,
  EntradaExtra,
  Estorno,
  FinanceData,
} from '@/lib/types';
import { ConfirmDialog, initialConfirmState, type ConfirmState } from '@/components/ui/ConfirmDialog';
import { LoadingSplash } from '@/components/layout/LoadingSplash';
import { Header } from '@/components/layout/Header';
import { HeroPanel } from '@/components/layout/HeroPanel';
import { RadarPanel } from '@/components/layout/RadarPanel';
import { ProjectionGrid } from '@/components/projection/ProjectionGrid';
import { OperationsSection } from '@/components/operations/OperationsSection';
import { ModalCompra } from '@/components/modals/ModalCompra';
import { ModalEstorno } from '@/components/modals/ModalEstorno';
import { ModalDespesa } from '@/components/modals/ModalDespesa';
import { ModalEntradaExtra } from '@/components/modals/ModalEntradaExtra';
import { ModalDespesaExtra } from '@/components/modals/ModalDespesaExtra';
import { ModalApiKey } from '@/components/modals/ModalApiKey';
import { ModalDetalhesMes } from '@/components/modals/ModalDetalhesMes';
import { ChatInterface } from '@/components/chat/ChatInterface';

type ModalType = 'compra' | 'estorno' | 'despesa' | 'entradaExtra' | 'despesaExtra' | null;

export function AppShell() {
  const { data, setData, hydrated } = useFinanceData();
  const [hideValues, setHideValues] = useHideValues();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingCompraId, setEditingCompraId] = useState<number | null>(null);
  const [editingEstornoId, setEditingEstornoId] = useState<number | null>(null);
  const [editingDespesaId, setEditingDespesaId] = useState<number | null>(null);
  const [editingDespesaExtraId, setEditingDespesaExtraId] = useState<number | null>(null);
  const [editingEntradaId, setEditingEntradaId] = useState<number | null>(null);
  const [mesDetalhado, setMesDetalhado] = useState<string | null>(null);
  const [mesFormulario, setMesFormulario] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editandoLimiteAlerta, setEditandoLimiteAlerta] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmState>(initialConfirmState);

  const derived = deriveDashboard(data);

  // ---- diálogos ----
  const closeConfirm = () => setConfirmModal(initialConfirmState);
  const showConfirm = (message: string, onConfirm: () => void) =>
    setConfirmModal({ show: true, message, onConfirm, type: 'confirm' });
  const showAlert = (message: string) =>
    setConfirmModal({ show: true, message, onConfirm: null, type: 'alert' });

  // ---- abertura/fechamento de modais ----
  const closeFormModal = () => {
    setModalType(null);
    setEditingCompraId(null);
    setEditingEstornoId(null);
    setEditingDespesaId(null);
    setEditingDespesaExtraId(null);
    setEditingEntradaId(null);
    setMesFormulario(null);
  };
  const openModal = (type: Exclude<ModalType, null>) => {
    setModalType(type);
  };

  // ---- compras ----
  const addCompra = (compra: Omit<Compra, 'id' | 'oculta'>) => {
    if (editingCompraId) {
      setData((prev) => ({
        ...prev,
        compras: prev.compras.map((c) =>
          c.id === editingCompraId ? { ...compra, id: editingCompraId, oculta: c.oculta || false } : c,
        ),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        compras: [...prev.compras, { ...compra, id: Date.now(), oculta: false }],
      }));
    }
    closeFormModal();
  };
  const editCompra = (compra: Compra) => {
    setEditingCompraId(compra.id);
    setModalType('compra');
  };
  const removeItem = (id: number) =>
    setData((prev) => ({ ...prev, compras: prev.compras.filter((c) => c.id !== id) }));
  const toggleCompraOculta = (id: number) =>
    setData((prev) => ({
      ...prev,
      compras: prev.compras.map((c) => (c.id === id ? { ...c, oculta: !c.oculta } : c)),
    }));

  // ---- estornos ----
  const addEstorno = (estorno: Omit<Estorno, 'id'>) => {
    if (editingEstornoId) {
      setData((prev) => ({
        ...prev,
        estornos: prev.estornos.map((e) =>
          e.id === editingEstornoId ? { ...estorno, id: editingEstornoId } : e,
        ),
      }));
    } else {
      setData((prev) => ({ ...prev, estornos: [...prev.estornos, { ...estorno, id: Date.now() }] }));
    }
    closeFormModal();
  };
  const editEstorno = (estorno: Estorno) => {
    setEditingEstornoId(estorno.id);
    setModalType('estorno');
  };
  const removeEstorno = (id: number) =>
    setData((prev) => ({ ...prev, estornos: prev.estornos.filter((e) => e.id !== id) }));

  // ---- despesas ----
  const addDespesa = (despesa: Omit<Despesa, 'id'>) => {
    if (editingDespesaId) {
      setData((prev) => ({
        ...prev,
        despesas: prev.despesas.map((d) =>
          d.id === editingDespesaId ? { ...despesa, id: editingDespesaId } : d,
        ),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        despesas: [...(prev.despesas || []), { ...despesa, id: Date.now() }],
      }));
    }
    closeFormModal();
  };
  const editDespesa = (despesa: Despesa) => {
    setEditingDespesaId(despesa.id);
    setModalType('despesa');
  };
  const removeDespesa = (id: number) =>
    setData((prev) => ({ ...prev, despesas: (prev.despesas || []).filter((d) => d.id !== id) }));

  const pagarDespesa = (despesa: Despesa) => {
    const vezesRestantesAgora = getVezesRestantesAgora(despesa);
    if (vezesRestantesAgora === null || vezesRestantesAgora <= 0) return;
    const novasVezes = vezesRestantesAgora - 1;
    if (novasVezes === 0) {
      removeDespesa(despesa.id);
      return;
    }
    let vezesRestantesParaSalvar = novasVezes;
    if (despesa.dataInicio) {
      const mesAtual = new Date();
      const inicioMesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
      const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
      const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
      const mesesPassados =
        (inicioMesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
        (inicioMesAtual.getMonth() - inicioDate.getMonth());
      vezesRestantesParaSalvar = novasVezes + mesesPassados;
    }
    setData((prev) => ({
      ...prev,
      despesas: prev.despesas.map((item) =>
        item.id === despesa.id ? { ...item, vezesRestantes: vezesRestantesParaSalvar } : item,
      ),
    }));
  };

  // ---- entradas extras ----
  const addEntradaExtra = (entrada: Omit<EntradaExtra, 'id' | 'ativo'>) => {
    if (editingEntradaId) {
      setData((prev) => ({
        ...prev,
        entradasExtras: prev.entradasExtras.map((e) =>
          e.id === editingEntradaId ? { ...e, ...entrada, id: editingEntradaId } : e,
        ),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        entradasExtras: [...(prev.entradasExtras || []), { ...entrada, id: Date.now(), ativo: true }],
      }));
    }
    closeFormModal();
  };
  const removeEntradaExtra = (id: number) =>
    setData((prev) => ({ ...prev, entradasExtras: prev.entradasExtras.filter((e) => e.id !== id) }));
  const toggleEntradaAtiva = (id: number) =>
    setData((prev) => ({
      ...prev,
      entradasExtras: prev.entradasExtras.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e)),
    }));

  // ---- despesas extras ----
  const addDespesaExtra = (despesaExtra: Omit<DespesaExtra, 'id' | 'ativo'>) => {
    if (editingDespesaExtraId) {
      setData((prev) => ({
        ...prev,
        despesasExtras: (prev.despesasExtras || []).map((d) =>
          d.id === editingDespesaExtraId ? { ...d, ...despesaExtra, id: editingDespesaExtraId } : d,
        ),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        despesasExtras: [...(prev.despesasExtras || []), { ...despesaExtra, id: Date.now(), ativo: true }],
      }));
    }
    closeFormModal();
  };
  const editDespesaExtra = (despesaExtra: DespesaExtra) => {
    setEditingDespesaExtraId(despesaExtra.id);
    setModalType('despesaExtra');
  };
  const removeDespesaExtra = (id: number) =>
    setData((prev) => ({
      ...prev,
      despesasExtras: (prev.despesasExtras || []).filter((d) => d.id !== id),
    }));
  const toggleDespesaExtraAtiva = (id: number) =>
    setData((prev) => ({
      ...prev,
      despesasExtras: (prev.despesasExtras || []).map((d) => (d.id === id ? { ...d, ativo: !d.ativo } : d)),
    }));

  // ---- ações de mês ----
  const marcarSalarioRecebido = (monthKey: string) => {
    setData((prev) => ({
      ...prev,
      salariosRecebidos: [...(prev.salariosRecebidos || []), monthKey],
      saldoAtual: parseFloat(String(prev.saldoAtual)) + parseFloat(String(prev.salarioMensal)),
    }));
  };
  const abrirEntradaNoMes = (monthKey: string) => {
    setEditingEntradaId(null);
    setMesFormulario(monthKey);
    setModalType('entradaExtra');
  };
  const abrirDespesaExtraNoMes = (monthKey: string) => {
    setEditingDespesaExtraId(null);
    setMesFormulario(monthKey);
    setModalType('despesaExtra');
  };

  // ---- backup / relatório / limpar ----
  const handleExport = () => exportBackup(data, showAlert);
  const handleImport = (file: File, resetInput: () => void) =>
    importBackup(file, { showAlert, showConfirm, applyData: (d) => setData(d), resetInput });
  const handleReport = () => generateReport(data);
  const clearAll = () =>
    showConfirm('Tem certeza que deseja apagar todos os dados?', () => {
      setData(createClearedData(data.apiKey || ''));
      closeFormModal();
      setShowApiKeyModal(false);
      setMesDetalhado(null);
      closeConfirm();
    });

  const setApiKey = (apiKey: string) => setData((prev) => ({ ...prev, apiKey }));

  if (!hydrated) {
    return <LoadingSplash />;
  }

  return (
    <div className="relative mx-auto w-full max-w-[80rem] px-4 pb-24 sm:px-6 lg:px-8">
      <Header
        hideValues={hideValues}
        onToggleHide={() => setHideValues((v) => !v)}
        onExport={handleExport}
        onImport={handleImport}
        onReport={handleReport}
        onClear={clearAll}
        mesAtualLabel={derived.mesAtualLabel}
        emAtencao={Boolean(derived.primeiroMesCritico)}
      />

      <motion.main
        variants={staggerContainer(0.13, 0.08)}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.section
          variants={staggerContainer(0.1)}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <motion.div variants={fadeUp}>
            <HeroPanel
              data={data}
              setData={setData}
              hideValues={hideValues}
              derived={derived}
              onOpenModal={openModal}
              onOpenChat={() => setShowChat(true)}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <RadarPanel
              data={data}
              setData={setData}
              hideValues={hideValues}
              derived={derived}
              editandoLimite={editandoLimiteAlerta}
              setEditandoLimite={setEditandoLimiteAlerta}
            />
          </motion.div>
        </motion.section>

        <motion.div variants={fadeUp}>
          <ProjectionGrid
            timeline={derived.timeline}
            limiteAlertaMensal={derived.limiteAlertaMensal}
            mediaSobra={derived.mediaSobra}
            emAtencao={Boolean(derived.primeiroMesCritico)}
            hideValues={hideValues}
            onOpenMes={setMesDetalhado}
            onAddEntrada={abrirEntradaNoMes}
            onAddDespesaExtra={abrirDespesaExtraNoMes}
            onMarcarSalario={marcarSalarioRecebido}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <OperationsSection
            data={data}
            derived={derived}
            hideValues={hideValues}
            onOpenModal={openModal}
            onEditCompra={editCompra}
            onRemoveCompra={removeItem}
            onToggleCompraOculta={toggleCompraOculta}
            onEditEstorno={editEstorno}
            onRemoveEstorno={removeEstorno}
            onEditDespesa={editDespesa}
            onRemoveDespesa={removeDespesa}
            onPagarDespesa={pagarDespesa}
          />
        </motion.div>
      </motion.main>

      {/* ---- Modais ---- */}
      <ModalCompra
        isOpen={modalType === 'compra'}
        onClose={closeFormModal}
        onSubmit={addCompra}
        editing={editingCompraId ? data.compras.find((c) => c.id === editingCompraId) ?? null : null}
      />
      <ModalEstorno
        isOpen={modalType === 'estorno'}
        onClose={closeFormModal}
        onSubmit={addEstorno}
        editing={editingEstornoId ? data.estornos.find((e) => e.id === editingEstornoId) ?? null : null}
      />
      <ModalDespesa
        isOpen={modalType === 'despesa'}
        onClose={closeFormModal}
        onSubmit={addDespesa}
        editing={editingDespesaId ? (data.despesas || []).find((d) => d.id === editingDespesaId) ?? null : null}
      />
      <ModalEntradaExtra
        isOpen={modalType === 'entradaExtra'}
        onClose={closeFormModal}
        onSubmit={addEntradaExtra}
        mesPadrao={mesFormulario}
        editing={editingEntradaId ? data.entradasExtras.find((e) => e.id === editingEntradaId) ?? null : null}
      />
      <ModalDespesaExtra
        isOpen={modalType === 'despesaExtra'}
        onClose={closeFormModal}
        onSubmit={addDespesaExtra}
        mesPadrao={mesFormulario}
        editing={
          editingDespesaExtraId
            ? (data.despesasExtras || []).find((d) => d.id === editingDespesaExtraId) ?? null
            : null
        }
      />
      <ModalApiKey
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        apiKey={data.apiKey}
        onSave={(key) => {
          setApiKey(key);
          setShowApiKeyModal(false);
        }}
      />

      <ModalDetalhesMes
        monthKey={mesDetalhado}
        monthName={mesDetalhado ? derived.timeline.find((m) => m.monthKey === mesDetalhado)?.name ?? '' : ''}
        data={data}
        hideValues={hideValues}
        onClose={() => setMesDetalhado(null)}
        onEditEntrada={(entrada) => {
          setMesDetalhado(null);
          setEditingEntradaId(entrada.id);
          setModalType('entradaExtra');
        }}
        onRemoveEntrada={removeEntradaExtra}
        onToggleEntrada={toggleEntradaAtiva}
        onEditDespesaExtra={(d) => {
          setMesDetalhado(null);
          editDespesaExtra(d);
        }}
        onRemoveDespesaExtra={removeDespesaExtra}
        onToggleDespesaExtra={toggleDespesaExtraAtiva}
        onEditDespesa={(d) => {
          setMesDetalhado(null);
          editDespesa(d);
        }}
        onRemoveDespesa={removeDespesa}
      />

      <ChatInterface
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        data={data}
        setData={setData}
        derived={derived}
        onOpenApiKey={() => setShowApiKeyModal(true)}
        apiKeyModalOpen={showApiKeyModal}
      />

      <ConfirmDialog
        state={confirmModal}
        onCancel={closeConfirm}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          else closeConfirm();
        }}
      />
    </div>
  );
}
