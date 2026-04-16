import { useState, useEffect, useRef } from 'react';
import { X, Settings, CreditCard, TrendingUp, ChevronDown, Minus } from 'lucide-react';
import Calendar from './Calendar';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currency';

const ModalWrapper = ({
  children,
  title,
  icon: Icon,
  iconColorClass,
  zIndexClass = 'z-[70]',
  setShowModal,
  setEditingCompraId = null,
  setEditingEstornoId = null,
  setEditingDespesaId = null,
  setEditingDespesaExtraId = null,
  setEditingEntradaId = null
}) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setEditingCompraId && setEditingCompraId(null);
        setEditingEstornoId && setEditingEstornoId(null);
        setEditingDespesaId && setEditingDespesaId(null);
        setEditingDespesaExtraId && setEditingDespesaExtraId(null);
        setEditingEntradaId && setEditingEntradaId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [setShowModal, setEditingCompraId, setEditingEstornoId, setEditingDespesaId, setEditingDespesaExtraId, setEditingEntradaId]);

  return (
    <div
      className={`overlay-shell ${zIndexClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
          setEditingCompraId && setEditingCompraId(null);
          setEditingEstornoId && setEditingEstornoId(null);
          setEditingDespesaId && setEditingDespesaId(null);
          setEditingDespesaExtraId && setEditingDespesaExtraId(null);
          setEditingEntradaId && setEditingEntradaId(null);
        }
      }}
    >
      <div className="modal-card surface-enter">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-3">
            {Icon && (
              <div className={`modal-icon ${iconColorClass}`}>
                <Icon size={24} />
              </div>
            )}
            {title}
          </h2>
          <button
            onClick={() => {
              setShowModal(false);
              setEditingCompraId && setEditingCompraId(null);
              setEditingEstornoId && setEditingEstornoId(null);
              setEditingDespesaId && setEditingDespesaId(null);
              setEditingDespesaExtraId && setEditingDespesaExtraId(null);
              setEditingEntradaId && setEditingEntradaId(null);
            }}
            className="modal-close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const Modal = ({ showModal, setShowModal, modalType, addCompra, addEstorno, addDespesa, addEntradaExtra, addDespesaExtra, setData, editingCompraId, editingEstornoId, editingDespesaId, editingDespesaExtraId, editingEntradaId, compraParaEditar, estornoParaEditar, despesaParaEditar, despesaExtraParaEditar, entradaParaEditar, setEditingCompraId, setEditingEstornoId, setEditingDespesaId, setEditingDespesaExtraId, setEditingEntradaId, data, mesParaEntrada, modalZIndexClass = 'z-[70]' }) => {
  if (!showModal) return null;

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState(() => {
    if (compraParaEditar) {
      return {
        nome: compraParaEditar.item || '',
        valor: compraParaEditar.valorTotal || '',
        parcelas: compraParaEditar.parcelas || 1,
        data: compraParaEditar.data || getLocalDateString(),
        tipo: 'saida'
      };
    }
    return {
      nome: '', valor: '', parcelas: 1, data: getLocalDateString(), tipo: 'saida'
    };
  });

  const [showParcelasDropdown, setShowParcelasDropdown] = useState(false);
  const parcelasDropdownRef = useRef(null);

  useEffect(() => {
    if (compraParaEditar) {
      setFormData({
        nome: compraParaEditar.item || '',
        valor: compraParaEditar.valorTotal || '',
        parcelas: compraParaEditar.parcelas || 1,
        data: compraParaEditar.data || getLocalDateString(),
        tipo: 'saida'
      });
    } else {
      setFormData({
        nome: '', valor: '', parcelas: 1, data: getLocalDateString(), tipo: 'saida'
      });
    }
  }, [compraParaEditar]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parcelasDropdownRef.current && !parcelasDropdownRef.current.contains(event.target)) {
        setShowParcelasDropdown(false);
      }
    };

    if (showParcelasDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showParcelasDropdown]);

  useEffect(() => {
    if (!showModal) {
      setShowParcelasDropdown(false);
    }
  }, [showModal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'compra') {
      if (!formData.data) return;
      addCompra({
          item: formData.nome,
          valorTotal: formData.valor,
          parcelas: formData.parcelas,
          data: formData.data
      });
    }
  };

  if (modalType === 'apikey') {
    const [apiKeyInput, setApiKeyInput] = useState(data?.apiKey || '');

    useEffect(() => {
      setApiKeyInput(data?.apiKey || '');
    }, [data?.apiKey]);

    const handleSaveApiKey = () => {
      setData(prev => ({
        ...prev,
        apiKey: apiKeyInput.trim()
      }));
      setShowModal(false);
    };

    return (
      <ModalWrapper
        title="Configurar integração"
        icon={Settings}
        iconColorClass="panel-icon--accent"
        zIndexClass={modalZIndexClass}
        setShowModal={setShowModal}
      >
        <div className="modal-form">
          <div className="field-group">
            <label className="field-label">
              Chave da API do Google Gemini
            </label>
            <input
              type="password"
              className="field-input"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Cole a chave da sua conta aqui..."
            />
            <p className="field-note">
              A chave fica salva só neste navegador. Se precisar gerar outra, use <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="field-link">aistudio.google.com/app/apikey</a>.
            </p>
          </div>
          <div className="field-actions">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="button-primary button-primary--accent"
            >
              Salvar Configuração
            </button>
          </div>
        </div>
      </ModalWrapper>
    );
  }


  if (modalType === 'estorno') {
    const [estornoFormData, setEstornoFormData] = useState(() => {
      if (estornoParaEditar) {
        return {
          nome: estornoParaEditar.nome || '',
          valor: estornoParaEditar.valor || '',
          mes: estornoParaEditar.mes || ''
        };
      }
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return {
        nome: '',
        valor: '',
        mes: `${year}-${month}`
      };
    });

    const [showMesDropdown, setShowMesDropdown] = useState(false);
    const [showAnoDropdown, setShowAnoDropdown] = useState(false);
    const mesDropdownRef = useRef(null);
    const anoDropdownRef = useRef(null);

    useEffect(() => {
      if (estornoParaEditar) {
        setEstornoFormData({
          nome: estornoParaEditar.nome || '',
          valor: estornoParaEditar.valor || '',
          mes: estornoParaEditar.mes || ''
        });
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        setEstornoFormData({
          nome: '',
          valor: '',
          mes: `${year}-${month}`
        });
      }
    }, [estornoParaEditar]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (mesDropdownRef.current && !mesDropdownRef.current.contains(event.target)) {
          setShowMesDropdown(false);
        }
        if (anoDropdownRef.current && !anoDropdownRef.current.contains(event.target)) {
          setShowAnoDropdown(false);
        }
      };

      if (showMesDropdown || showAnoDropdown) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showMesDropdown, showAnoDropdown]);

    useEffect(() => {
      if (!showModal) {
        setShowMesDropdown(false);
        setShowAnoDropdown(false);
      }
    }, [showModal]);

    const handleEstornoSubmit = (e) => {
      e.preventDefault();
      if (addEstorno) {
        addEstorno({
          nome: estornoFormData.nome,
          valor: estornoFormData.valor,
          mes: estornoFormData.mes
        });
      }
    };

    return (
      <ModalWrapper
        title={editingEstornoId ? 'Editar Estorno' : 'Adicionar Estorno'}
        icon={TrendingUp}
        iconColorClass="panel-icon--positive"
        setShowModal={setShowModal}
        setEditingEstornoId={setEditingEstornoId}
      >
        <form onSubmit={handleEstornoSubmit} className="modal-form">
          <div className="field-group">
            <label className="field-label">Nome do Estorno</label>
            <input
              required
              className="field-input"
              value={estornoFormData.nome}
              onChange={e => setEstornoFormData({...estornoFormData, nome: e.target.value})}
              placeholder="Ex: Reembolso Amazon"
              autoFocus
            />
          </div>
          <div className="field-grid">
            <div className="field-group">
              <label className="field-label">Valor (R$)</label>
              <input
                required
                type="text"
                inputMode="decimal"
                className="field-input"
                value={formatCurrencyInput(estornoFormData.valor)}
                onChange={e => setEstornoFormData({...estornoFormData, valor: parseCurrencyInput(e.target.value)})}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Mês Referência</label>
              <div className="flex gap-2">
                <div className="relative flex-1" ref={mesDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMesDropdown(!showMesDropdown);
                      setShowAnoDropdown(false);
                    }}
                    className="dropdown-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={showMesDropdown}
                  >
                    <span className="font-medium text-center flex-1">
                      {(() => {
                        const mesNum = estornoFormData.mes.split('-')[1];
                        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                        return meses[parseInt(mesNum) - 1];
                      })()}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[var(--text-soft)] transition-transform duration-200 flex-shrink-0 ${showMesDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showMesDropdown && (
                    <div className="dropdown-menu surface-enter">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {[
                          { value: '01', label: 'Janeiro' },
                          { value: '02', label: 'Fevereiro' },
                          { value: '03', label: 'Março' },
                          { value: '04', label: 'Abril' },
                          { value: '05', label: 'Maio' },
                          { value: '06', label: 'Junho' },
                          { value: '07', label: 'Julho' },
                          { value: '08', label: 'Agosto' },
                          { value: '09', label: 'Setembro' },
                          { value: '10', label: 'Outubro' },
                          { value: '11', label: 'Novembro' },
                          { value: '12', label: 'Dezembro' }
                        ].map(mes => (
                          <button
                            key={mes.value}
                            type="button"
                            onClick={() => {
                              const [ano] = estornoFormData.mes.split('-');
                              setEstornoFormData({...estornoFormData, mes: `${ano}-${mes.value}`});
                              setShowMesDropdown(false);
                            }}
                            className={`dropdown-option justify-center ${estornoFormData.mes.split('-')[1] === mes.value ? 'dropdown-option--selected' : ''}`}
                          >
                            <span className="font-medium">{mes.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative flex-1" ref={anoDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAnoDropdown(!showAnoDropdown);
                      setShowMesDropdown(false);
                    }}
                    className="dropdown-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={showAnoDropdown}
                  >
                    <span className="font-medium text-center flex-1">
                      {estornoFormData.mes.split('-')[0]}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[var(--text-soft)] transition-transform duration-200 flex-shrink-0 ${showAnoDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showAnoDropdown && (
                    <div className="dropdown-menu surface-enter">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i).map(ano => (
                          <button
                            key={ano}
                            type="button"
                            onClick={() => {
                              const [, mes] = estornoFormData.mes.split('-');
                              setEstornoFormData({...estornoFormData, mes: `${ano}-${mes}`});
                              setShowAnoDropdown(false);
                            }}
                            className={`dropdown-option justify-center ${estornoFormData.mes.split('-')[0] === String(ano) ? 'dropdown-option--selected' : ''}`}
                          >
                            <span className="font-medium">{ano}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="field-actions">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingEstornoId && setEditingEstornoId(null);
              }}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary button-primary--positive"
            >
              {editingEstornoId ? 'Atualizar' : 'Salvar Estorno'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    );
  }

  if (modalType === 'entradaExtra') {
    const [entradaFormData, setEntradaFormData] = useState(() => {
      if (entradaParaEditar) {
        return {
          nome: entradaParaEditar.nome || '',
          valor: entradaParaEditar.valor || '',
          data: entradaParaEditar.data || getLocalDateString(),
          mes: entradaParaEditar.mes || mesParaEntrada || '',
          recorrente: entradaParaEditar.recorrente || false
        };
      }
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return {
        nome: '',
        valor: '',
        data: getLocalDateString(),
        mes: mesParaEntrada || `${year}-${month}`,
        recorrente: false
      };
    });

    useEffect(() => {
      if (entradaParaEditar) {
        setEntradaFormData({
          nome: entradaParaEditar.nome || '',
          valor: entradaParaEditar.valor || '',
          data: entradaParaEditar.data || getLocalDateString(),
          mes: entradaParaEditar.mes || mesParaEntrada || '',
          recorrente: entradaParaEditar.recorrente || false
        });
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        setEntradaFormData({
          nome: '',
          valor: '',
          data: getLocalDateString(),
          mes: mesParaEntrada || `${year}-${month}`,
          recorrente: false
        });
      }
    }, [entradaParaEditar, mesParaEntrada]);

    const handleEntradaSubmit = (e) => {
      e.preventDefault();
      if (!entradaFormData.nome || !entradaFormData.valor || !entradaFormData.mes) return;

      if (addEntradaExtra) {
        addEntradaExtra({
          nome: entradaFormData.nome,
          valor: entradaFormData.valor,
          mes: entradaFormData.mes,
          data: entradaFormData.data || getLocalDateString(),
          somarNoSaldo: false,
          recorrente: entradaFormData.recorrente
        });
      }
    };

    return (
      <ModalWrapper
        title={editingEntradaId ? 'Editar Entrada Extra' : 'Nova Entrada Extra'}
        icon={TrendingUp}
        iconColorClass="panel-icon--positive"
        setShowModal={setShowModal}
        setEditingEntradaId={setEditingEntradaId}
      >
        <form onSubmit={handleEntradaSubmit} className="modal-form">
          <div className="field-group">
            <label className="field-label">Nome da Entrada</label>
            <input
              required
              className="field-input"
              value={entradaFormData.nome}
              onChange={e => setEntradaFormData({...entradaFormData, nome: e.target.value})}
              placeholder="Ex: PIX recebido de João"
              autoFocus
            />
          </div>
          <div className="field-grid">
            <div className="field-group">
              <label className="field-label">Valor (R$)</label>
              <input
                required
                type="text"
                inputMode="decimal"
                className="field-input"
                value={formatCurrencyInput(entradaFormData.valor)}
                onChange={e => setEntradaFormData({...entradaFormData, valor: parseCurrencyInput(e.target.value)})}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Data</label>
              <Calendar
                value={entradaFormData.data}
                onChange={(date) => setEntradaFormData({...entradaFormData, data: date})}
                onClear={() => setEntradaFormData({...entradaFormData, data: ''})}
                required={false}
              />
            </div>
          </div>
          <div className="field-group">
            <label className="field-toggle">
              <input
                type="checkbox"
                checked={entradaFormData.recorrente}
                onChange={(e) => setEntradaFormData({...entradaFormData, recorrente: e.target.checked})}
                className="field-check"
              />
              <span className="text-sm">Recorrente (repete nos meses seguintes)</span>
            </label>
          </div>
          <div className="field-actions">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingEntradaId && setEditingEntradaId(null); }}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary button-primary--accent"
            >
              {editingEntradaId ? 'Salvar Alterações' : 'Adicionar Entrada'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    );
  }

  if (modalType === 'despesa') {
    const getLocalDateString = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const [despesaFormData, setDespesaFormData] = useState(() => {
      if (despesaParaEditar) {
        return {
          nome: despesaParaEditar.nome || '',
          valor: despesaParaEditar.valor || '',
          temLimite: despesaParaEditar.vezesRestantes !== undefined && despesaParaEditar.vezesRestantes !== null,
          vezesRestantes: despesaParaEditar.vezesRestantes || '',
          dataInicio: despesaParaEditar.dataInicio || getLocalDateString()
        };
      }
      return {
        nome: '',
        valor: '',
        temLimite: false,
        vezesRestantes: '',
        dataInicio: getLocalDateString()
      };
    });

    useEffect(() => {
      if (despesaParaEditar) {
        setDespesaFormData({
          nome: despesaParaEditar.nome || '',
          valor: despesaParaEditar.valor || '',
          temLimite: despesaParaEditar.vezesRestantes !== undefined && despesaParaEditar.vezesRestantes !== null,
          vezesRestantes: despesaParaEditar.vezesRestantes || '',
          dataInicio: despesaParaEditar.dataInicio || getLocalDateString()
        });
      } else {
        setDespesaFormData({
          nome: '',
          valor: '',
          temLimite: false,
          vezesRestantes: '',
          dataInicio: getLocalDateString()
        });
      }
    }, [despesaParaEditar]);

    const handleDespesaSubmit = (e) => {
      e.preventDefault();
      if (!despesaFormData.nome || !despesaFormData.valor) return;

      if (addDespesa) {
        addDespesa({
          nome: despesaFormData.nome,
          valor: parseFloat(despesaFormData.valor),
          vezesRestantes: despesaFormData.temLimite ? parseInt(despesaFormData.vezesRestantes) || null : null,
          dataInicio: despesaFormData.temLimite ? despesaFormData.dataInicio : null
        });
      }
    };

    return (
      <ModalWrapper
        title={editingDespesaId ? 'Editar Despesa' : 'Nova Despesa'}
        icon={Minus}
        iconColorClass="panel-icon--negative"
        setShowModal={setShowModal}
        setEditingDespesaId={setEditingDespesaId}
      >
        <form onSubmit={handleDespesaSubmit} className="modal-form">
          <div className="field-group">
            <label className="field-label">Nome da Despesa</label>
            <input
              required
              className="field-input"
              value={despesaFormData.nome}
              onChange={e => setDespesaFormData({...despesaFormData, nome: e.target.value})}
              placeholder="Ex: Aluguel, Internet, Academia..."
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label">Valor Mensal (R$)</label>
            <input
              required
              type="text"
              inputMode="decimal"
              className="field-input"
              value={formatCurrencyInput(despesaFormData.valor)}
              onChange={e => setDespesaFormData({...despesaFormData, valor: parseCurrencyInput(e.target.value)})}
              placeholder="R$ 0,00"
            />
          </div>
          <div className="field-group">
            <label className="field-toggle">
              <input
                type="checkbox"
                checked={despesaFormData.temLimite}
                onChange={(e) => setDespesaFormData({...despesaFormData, temLimite: e.target.checked, vezesRestantes: e.target.checked ? despesaFormData.vezesRestantes || '' : ''})}
                className="field-check field-check--negative"
              />
              <span className="text-sm">Despesa com limite de vezes</span>
            </label>
            {despesaFormData.temLimite && (
              <>
                <div className="field-group">
                  <label className="field-label">Data de Início</label>
                  <Calendar
                    value={despesaFormData.dataInicio}
                    onChange={(date) => setDespesaFormData({...despesaFormData, dataInicio: date})}
                    onClear={() => setDespesaFormData({...despesaFormData, dataInicio: getLocalDateString()})}
                    required={true}
                  />
                  <p className="field-note">A partir desta data, a despesa começará a contar na projeção</p>
                </div>
                <div className="field-group">
                  <label className="field-label">Falta quantas vezes?</label>
                  <input
                    required={despesaFormData.temLimite}
                    type="number"
                    min="1"
                    className="field-input"
                    value={despesaFormData.vezesRestantes}
                    onChange={e => setDespesaFormData({...despesaFormData, vezesRestantes: e.target.value})}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                    }}
                    placeholder="Ex: 6"
                  />
                  <p className="field-note">A despesa será removida automaticamente quando chegar a 0</p>
                </div>
              </>
            )}
          </div>
          <div className="field-actions">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingDespesaId && setEditingDespesaId(null);
              }}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary button-primary--negative"
            >
              {editingDespesaId ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    );
  }

  if (modalType === 'despesaExtra') {
    const [despesaExtraFormData, setDespesaExtraFormData] = useState(() => {
      if (despesaExtraParaEditar) {
        return {
          nome: despesaExtraParaEditar.nome || '',
          valor: despesaExtraParaEditar.valor || '',
          data: despesaExtraParaEditar.data || getLocalDateString(),
          mes: despesaExtraParaEditar.mes || mesParaEntrada || ''
        };
      }
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return {
        nome: '',
        valor: '',
        data: getLocalDateString(),
        mes: mesParaEntrada || `${year}-${month}`
      };
    });

    useEffect(() => {
      if (despesaExtraParaEditar) {
        setDespesaExtraFormData({
          nome: despesaExtraParaEditar.nome || '',
          valor: despesaExtraParaEditar.valor || '',
          data: despesaExtraParaEditar.data || getLocalDateString(),
          mes: despesaExtraParaEditar.mes || mesParaEntrada || ''
        });
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        setDespesaExtraFormData({
          nome: '',
          valor: '',
          data: getLocalDateString(),
          mes: mesParaEntrada || `${year}-${month}`
        });
      }
    }, [despesaExtraParaEditar, mesParaEntrada]);

    const handleDespesaExtraSubmit = (e) => {
      e.preventDefault();
      if (!despesaExtraFormData.nome || !despesaExtraFormData.valor || !despesaExtraFormData.mes) return;

      if (addDespesaExtra) {
        addDespesaExtra({
          nome: despesaExtraFormData.nome,
          valor: parseFloat(despesaExtraFormData.valor),
          mes: despesaExtraFormData.mes,
          data: despesaExtraFormData.data || getLocalDateString(),
          ativo: true
        });
      }
    };

    return (
      <ModalWrapper
        title={editingDespesaExtraId ? 'Editar Despesa Extra' : 'Nova Despesa Extra'}
        icon={Minus}
        iconColorClass="panel-icon--negative"
        setShowModal={setShowModal}
        setEditingDespesaExtraId={setEditingDespesaExtraId}
      >
        <form onSubmit={handleDespesaExtraSubmit} className="modal-form">
          <div className="field-group">
            <label className="field-label">Nome da Despesa</label>
            <input
              required
              className="field-input"
              value={despesaExtraFormData.nome}
              onChange={e => setDespesaExtraFormData({...despesaExtraFormData, nome: e.target.value})}
              placeholder="Ex: Compra na distribuidora, Gasolina..."
              autoFocus
            />
          </div>
          <div className="field-grid">
            <div className="field-group">
              <label className="field-label">Valor (R$)</label>
              <input
                required
                type="text"
                inputMode="decimal"
                className="field-input"
                value={formatCurrencyInput(despesaExtraFormData.valor)}
                onChange={e => setDespesaExtraFormData({...despesaExtraFormData, valor: parseCurrencyInput(e.target.value)})}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Data</label>
              <Calendar
                value={despesaExtraFormData.data}
                onChange={(date) => setDespesaExtraFormData({...despesaExtraFormData, data: date})}
                onClear={() => setDespesaExtraFormData({...despesaExtraFormData, data: ''})}
                required={true}
              />
            </div>
          </div>
          <div className="field-actions">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingDespesaExtraId && setEditingDespesaExtraId(null);
              }}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary button-primary--negative"
            >
              {editingDespesaExtraId ? 'Salvar Alterações' : 'Adicionar Despesa'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper
      title={editingCompraId ? 'Editar Parcelado' : 'Novo Parcelado'}
      icon={CreditCard}
      iconColorClass="panel-icon--accent"
      setShowModal={setShowModal}
      setEditingCompraId={setEditingCompraId}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="field-group">
          <label className="field-label">O que você comprou?</label>
          <input
            required
            className="field-input"
            value={formData.nome}
            onChange={e => setFormData({...formData, nome: e.target.value})}
            placeholder="Ex: iPhone 15 Pro Max"
            autoFocus
          />
        </div>
        <div className="field-grid">
            <div className="field-group">
            <label className="field-label">Valor Total (R$)</label>
            <input
              required
              type="text"
              inputMode="decimal"
              className="field-input"
              value={formatCurrencyInput(formData.valor)}
              onChange={e => setFormData({...formData, valor: parseCurrencyInput(e.target.value)})}
              placeholder="R$ 0,00"
            />
            </div>
            <div className="field-group">
            <label className="field-label">Data da Compra <span className="field-label__required">*</span></label>
            <Calendar
                value={formData.data}
                onChange={(date) => setFormData({...formData, data: date})}
                onClear={() => setFormData({...formData, data: ''})}
                required={true}
            />
            </div>
        </div>

        <div className="field-group">
          <label className="field-label">Quantidade de Parcelas</label>
          <div className="relative" ref={parcelasDropdownRef}>
            <button
              type="button"
              onClick={() => setShowParcelasDropdown(!showParcelasDropdown)}
              className="dropdown-trigger"
              aria-haspopup="listbox"
              aria-expanded={showParcelasDropdown}
            >
              <span className="font-medium">
                {formData.parcelas}x {formData.valor ? `de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor / formData.parcelas)}` : ''}
              </span>
              <ChevronDown
                size={18}
                className={`text-[var(--text-soft)] transition-transform duration-200 ${showParcelasDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showParcelasDropdown && (
              <div className="dropdown-menu surface-enter">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {[1,2,3,4,5,6,7,8,9,10,12,18,24].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setFormData({...formData, parcelas: n});
                        setShowParcelasDropdown(false);
                      }}
                      className={`dropdown-option ${formData.parcelas === n ? 'dropdown-option--selected' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{n}x</span>
                        {formData.valor && (
                          <span className="field-inline-note">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor / n)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="field-actions">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingCompraId && setEditingCompraId(null); }}
              className="button-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary button-primary--accent"
            >
              {editingCompraId ? 'Salvar Alterações' : 'Confirmar Compra'}
            </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default Modal;
