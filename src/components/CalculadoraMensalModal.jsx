import { useState } from 'react';
import { X, Calculator } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currency';

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function getMesesRestantes() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const meses = [];
  for (let m = hoje.getMonth(); m <= 11; m++) {
    const data = new Date(ano, m, 1);
    const mesAbrev = data.toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toUpperCase();
    const anoAbrev = String(ano).slice(-2);
    meses.push({
      key: `${ano}-${String(m + 1).padStart(2, '0')}`,
      nome: `${mesAbrev} '${anoAbrev}`,
      x: '',
      y: '',
      z: '',
    });
  }
  return meses;
}

export default function CalculadoraMensalModal({ setShowModal }) {
  const [meses, setMeses] = useState(getMesesRestantes);

  const update = (key, field, raw) =>
    setMeses(prev => prev.map(m => m.key === key ? { ...m, [field]: raw } : m));

  return (
    <div
      className="overlay-shell z-[70]"
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
    >
      <div className="modal-card modal-card--wide surface-enter">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-3">
            <div className="modal-icon panel-icon--accent">
              <Calculator size={24} />
            </div>
            Calculadora mensal
          </h2>
          <button onClick={() => setShowModal(false)} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pt-6">
          <div className="list-stack">
            {meses.map((mes) => {
              const soma = (parseFloat(mes.x) || 0) + (parseFloat(mes.y) || 0) + (parseFloat(mes.z) || 0);
              return (
                <div key={mes.key} className="ledger-row" style={{ flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <span
                    style={{
                      minWidth: '64px',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: 'var(--accent)',
                    }}
                  >
                    {mes.nome}
                  </span>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, flexWrap: 'wrap', alignItems: 'flex-end', minWidth: 0 }}>
                    {(['x', 'y', 'z']).map(field => (
                      <div key={field} className="field-group" style={{ flex: 1, minWidth: '80px' }}>
                        <label className="field-label">{field.toUpperCase()}</label>
                        <input
                          className="field-input"
                          inputMode="decimal"
                          value={formatCurrencyInput(mes[field])}
                          onChange={(e) => update(mes.key, field, parseCurrencyInput(e.target.value))}
                          placeholder="R$ 0,00"
                        />
                      </div>
                    ))}

                    <div className="field-group" style={{ flex: 1, minWidth: '80px' }}>
                      <label className="field-label">Total</label>
                      <div
                        className="field-input"
                        style={{
                          background: 'var(--bg-muted)',
                          color: soma > 0 ? 'var(--accent-strong)' : 'var(--text-muted)',
                          fontWeight: 600,
                          cursor: 'default',
                          userSelect: 'text',
                        }}
                      >
                        {brlFormatter.format(soma)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
