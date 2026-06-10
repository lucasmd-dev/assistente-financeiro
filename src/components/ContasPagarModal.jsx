import { useState, useEffect } from 'react';
import { X, ListChecks, Plus, Trash2, Edit, Check } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currency';

export default function ContasPagarModal({ showModal, setShowModal, data, setData, formatCurrency }) {
  const [showForm, setShowForm] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formValor, setFormValor] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editValor, setEditValor] = useState('');

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowModal]);

  if (!showModal) return null;

  const contasFixas = data.contasFixas || [];
  const contasPagas = data.contasPagas || [];
  const totalPagas = contasFixas.filter(c => contasPagas.includes(String(c.id))).length;
  const todasPagas = contasFixas.length > 0 && totalPagas === contasFixas.length;

  const togglePaga = (id) => {
    const strId = String(id);
    setData(prev => {
      const pagas = prev.contasPagas || [];
      return {
        ...prev,
        contasPagas: pagas.includes(strId)
          ? pagas.filter(p => p !== strId)
          : [...pagas, strId]
      };
    });
  };

  const addConta = () => {
    if (!formNome.trim()) return;
    setData(prev => ({
      ...prev,
      contasFixas: [
        ...(prev.contasFixas || []),
        { id: Date.now(), nome: formNome.trim(), valor: parseFloat(formValor) || 0 }
      ]
    }));
    setFormNome('');
    setFormValor('');
    setShowForm(false);
  };

  const removeConta = (id) => {
    const strId = String(id);
    setData(prev => ({
      ...prev,
      contasFixas: (prev.contasFixas || []).filter(c => c.id !== id),
      contasPagas: (prev.contasPagas || []).filter(p => p !== strId)
    }));
  };

  const startEdit = (conta) => {
    setEditingId(conta.id);
    setEditNome(conta.nome);
    setEditValor(formatCurrencyInput(conta.valor));
  };

  const saveEdit = () => {
    setData(prev => ({
      ...prev,
      contasFixas: (prev.contasFixas || []).map(c =>
        c.id === editingId
          ? { ...c, nome: editNome.trim(), valor: parseFloat(parseCurrencyInput(editValor)) || 0 }
          : c
      )
    }));
    setEditingId(null);
    setEditNome('');
    setEditValor('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNome('');
    setEditValor('');
  };

  const resetForm = () => {
    setShowForm(false);
    setFormNome('');
    setFormValor('');
  };

  return (
    <div
      className="overlay-shell z-[70]"
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
    >
      <div className="modal-card modal-card--wide surface-enter">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-3">
            <div className="modal-icon panel-icon--accent">
              <ListChecks size={24} />
            </div>
            Contas a Pagar
          </h2>
          <div className="flex items-center gap-3">
            {contasFixas.length > 0 && (
              <span className={`info-chip ${todasPagas ? 'info-chip--positive' : 'info-chip--accent'}`}>
                {totalPagas}/{contasFixas.length} pagas
              </span>
            )}
            <button onClick={() => setShowModal(false)} className="modal-close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pt-6">
          {contasFixas.length === 0 && !showForm && (
            <div className="empty-state" style={{ marginBottom: 'var(--space-4)' }}>
              <ListChecks size={44} strokeWidth={1.3} className="empty-state__icon" />
              <p>Nenhuma conta cadastrada ainda.</p>
            </div>
          )}

          {contasFixas.length > 0 && (
            <div className="list-stack contas-pagar-list">
              {contasFixas.map((conta) => {
                const paga = contasPagas.includes(String(conta.id));

                if (editingId === conta.id) {
                  return (
                    <div key={conta.id} className="ledger-row">
                      <div className="field-grid" style={{ flex: 1 }}>
                        <input
                          autoFocus
                          className="field-input"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          placeholder="Nome da conta"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <input
                          className="field-input"
                          inputMode="decimal"
                          value={editValor}
                          onChange={(e) => setEditValor(formatCurrencyInput(parseCurrencyInput(e.target.value)))}
                          placeholder="R$ 0,00"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={saveEdit} className="row-icon-button row-icon-button--positive" title="Salvar">
                          <Check size={15} />
                        </button>
                        <button onClick={cancelEdit} className="row-icon-button row-icon-button--neutral" title="Cancelar">
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={conta.id} className={`ledger-row ${paga ? 'ledger-row--muted' : ''}`}>
                    <label className="ledger-row__main flex items-center gap-3" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        className="field-check"
                        style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }}
                        checked={paga}
                        onChange={() => togglePaga(conta.id)}
                      />
                      <div>
                        <p className={`ledger-row__title ${paga ? 'ledger-row__title--muted' : ''}`}>
                          {conta.nome}
                        </p>
                        <div className="ledger-row__meta">
                          <span>{formatCurrency(conta.valor)}</span>
                        </div>
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className={`ledger-row__value ${paga ? '' : 'ledger-row__value--negative'}`}>
                        {formatCurrency(conta.valor)}
                      </span>
                      <div className="ledger-row__actions">
                        <button
                          onClick={() => startEdit(conta)}
                          className="row-icon-button row-icon-button--accent"
                          title="Editar"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => removeConta(conta.id)}
                          className="row-icon-button row-icon-button--negative"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showForm ? (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div className="field-grid" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="field-group">
                  <label className="field-label">Nome</label>
                  <input
                    autoFocus
                    className="field-input"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Aluguel, Internet..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addConta();
                      if (e.key === 'Escape') resetForm();
                    }}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Valor</label>
                  <input
                    className="field-input"
                    inputMode="decimal"
                    value={formatCurrencyInput(formValor)}
                    onChange={(e) => setFormValor(parseCurrencyInput(e.target.value))}
                    placeholder="R$ 0,00"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addConta();
                      if (e.key === 'Escape') resetForm();
                    }}
                  />
                </div>
              </div>
              <div className="field-actions">
                <button onClick={resetForm} className="button-secondary">
                  Cancelar
                </button>
                <button
                  onClick={addConta}
                  className="button-primary"
                  disabled={!formNome.trim()}
                >
                  Adicionar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="quick-action quick-action--ghost"
              style={{ marginTop: 'var(--space-4)' }}
            >
              <div className="quick-action__copy">
                <span className="quick-action__title">Adicionar conta</span>
              </div>
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
