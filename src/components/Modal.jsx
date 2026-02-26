import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, CreditCard, TrendingUp, Calendar as CalendarIcon, ChevronDown, Minus } from 'lucide-react';
import Calendar from './Calendar';

const ModalWrapper = ({ children, title, icon: Icon, iconColorClass, setShowModal, setEditingCompraId, setEditingEstornoId, setEditingDespesaId, setEditingDespesaExtraId, setEditingEntradaId }) => {
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200"
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
        <div className="bg-zinc-900/95 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl ring-1 ring-white/5 relative">
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] -mr-10 -mt-10 opacity-20 pointer-events-none ${iconColorClass?.includes('purple') ? 'bg-purple-500' : iconColorClass?.includes('emerald') ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-xl ${iconColorClass} bg-opacity-20 ring-1 ring-white/10`}>
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
            className="p-2 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

const Modal = ({ showModal, setShowModal, modalType, addCompra, addEstorno, addDespesa, addEntradaExtra, addDespesaExtra, setData, editingCompraId, editingEstornoId, editingDespesaId, editingDespesaExtraId, editingEntradaId, compraParaEditar, estornoParaEditar, despesaParaEditar, despesaExtraParaEditar, entradaParaEditar, setEditingCompraId, setEditingEstornoId, setEditingDespesaId, setEditingDespesaExtraId, setEditingEntradaId, data, mesParaEntrada }) => {
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
        title="Configurar API Key" 
        icon={Settings} 
        iconColorClass="bg-zinc-700 text-zinc-300"
        setShowModal={setShowModal}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">
              API Key do Google Gemini
            </label>
            <input 
              type="password"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors duration-200" 
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Cole sua API Key aqui..."
            />
            <p className="text-xs text-zinc-500 mt-3 ml-1">
              Obtenha sua API Key em: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">aistudio.google.com/app/apikey</a>
            </p>
          </div>
          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="flex-1 p-3.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-medium border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleSaveApiKey} 
              className="flex-1 p-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-semibold transition shadow-lg shadow-blue-900/20 hover:shadow-blue-500/20 hover:-translate-y-0.5"
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

    const estornoInputRef = React.useRef(null);

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
        iconColorClass="bg-emerald-500/20 text-emerald-400"
        setShowModal={setShowModal}
        setEditingEstornoId={setEditingEstornoId}
      >
        <form onSubmit={handleEstornoSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Nome do Estorno</label>
            <input 
              required 
              className="glass-input w-full" 
              value={estornoFormData.nome} 
              onChange={e => setEstornoFormData({...estornoFormData, nome: e.target.value})} 
              placeholder="Ex: Reembolso Amazon"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Valor (R$)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                className="glass-input w-full font-mono" 
                value={estornoFormData.valor} 
                onChange={e => setEstornoFormData({...estornoFormData, valor: e.target.value})}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                }}
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Mês Referência</label>
              <div className="flex gap-2">
                <div className="relative flex-1" ref={mesDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMesDropdown(!showMesDropdown);
                      setShowAnoDropdown(false);
                    }}
                    className="glass-input w-full flex items-center justify-between cursor-pointer text-white bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors duration-200 hover:border-emerald-500/50"
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
                      className={`text-zinc-400 transition-transform duration-200 flex-shrink-0 ${showMesDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {showMesDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                            className={`w-full px-4 py-3 text-center transition-colors duration-150 ${
                              estornoFormData.mes.split('-')[1] === mes.value
                                ? 'bg-emerald-600/20 text-emerald-300 border-l-2 border-emerald-500'
                                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                            }`}
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
                    className="glass-input w-full flex items-center justify-between cursor-pointer text-white bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors duration-200 hover:border-emerald-500/50"
                  >
                    <span className="font-medium text-center flex-1">
                      {estornoFormData.mes.split('-')[0]}
                    </span>
                    <ChevronDown 
                      size={16} 
                      className={`text-zinc-400 transition-transform duration-200 flex-shrink-0 ${showAnoDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {showAnoDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                            className={`w-full px-4 py-3 text-center transition-colors duration-150 ${
                              estornoFormData.mes.split('-')[0] === String(ano)
                                ? 'bg-emerald-600/20 text-emerald-300 border-l-2 border-emerald-500'
                                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                            }`}
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
          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={() => { 
                setShowModal(false); 
                setEditingEstornoId && setEditingEstornoId(null); 
              }} 
              className="flex-1 p-3.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-medium border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold transition shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20"
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
        iconColorClass="bg-blue-500/20 text-blue-400"
        setShowModal={setShowModal}
        setEditingEntradaId={setEditingEntradaId}
      >
        <form onSubmit={handleEntradaSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Nome da Entrada</label>
            <input 
              required 
              className="glass-input w-full" 
              value={entradaFormData.nome} 
              onChange={e => setEntradaFormData({...entradaFormData, nome: e.target.value})} 
              placeholder="Ex: PIX recebido de João"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Valor (R$)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                className="glass-input w-full font-mono" 
                value={entradaFormData.valor} 
                onChange={e => setEntradaFormData({...entradaFormData, valor: e.target.value})}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                }}
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Data</label>
              <Calendar 
                value={entradaFormData.data} 
                onChange={(date) => setEntradaFormData({...entradaFormData, data: date})}
                onClear={() => setEntradaFormData({...entradaFormData, data: ''})}
                required={false}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={entradaFormData.recorrente}
                onChange={(e) => setEntradaFormData({...entradaFormData, recorrente: e.target.checked})}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 checked:border-indigo-500 checked:bg-indigo-500 transition-all cursor-pointer"
              />
              <span className="text-sm">Recorrente (repete nos meses seguintes)</span>
            </label>
          </div>
          <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={() => { setShowModal(false); setEditingEntradaId && setEditingEntradaId(null); }} 
              className="flex-1 p-3.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-medium border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-semibold transition shadow-lg shadow-blue-900/20 hover:shadow-blue-500/20 hover:-translate-y-0.5"
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
        iconColorClass="bg-rose-500/20 text-rose-400"
        setShowModal={setShowModal}
        setEditingDespesaId={setEditingDespesaId}
      >
        <form onSubmit={handleDespesaSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Nome da Despesa</label>
            <input 
              required 
              className="glass-input w-full" 
              value={despesaFormData.nome} 
              onChange={e => setDespesaFormData({...despesaFormData, nome: e.target.value})} 
              placeholder="Ex: Aluguel, Internet, Academia..."
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Valor Mensal (R$)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              className="glass-input w-full font-mono" 
              value={despesaFormData.valor} 
              onChange={e => setDespesaFormData({...despesaFormData, valor: e.target.value})}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
              }}
              placeholder="0.00" 
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={despesaFormData.temLimite}
                onChange={(e) => setDespesaFormData({...despesaFormData, temLimite: e.target.checked, vezesRestantes: e.target.checked ? despesaFormData.vezesRestantes || '' : ''})}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 checked:border-rose-500 checked:bg-rose-500 transition-all cursor-pointer"
              />
              <span className="text-sm">Despesa com limite de vezes</span>
            </label>
            {despesaFormData.temLimite && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Data de Início</label>
                  <Calendar 
                    value={despesaFormData.dataInicio} 
                    onChange={(date) => setDespesaFormData({...despesaFormData, dataInicio: date})}
                    onClear={() => setDespesaFormData({...despesaFormData, dataInicio: getLocalDateString()})}
                    required={true}
                  />
                  <p className="text-xs text-zinc-500 mt-2 ml-1">A partir desta data, a despesa começará a contar na projeção</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Falta quantas vezes?</label>
                  <input 
                    required={despesaFormData.temLimite}
                    type="number" 
                    min="1"
                    className="glass-input w-full font-mono" 
                    value={despesaFormData.vezesRestantes} 
                    onChange={e => setDespesaFormData({...despesaFormData, vezesRestantes: e.target.value})}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                    }}
                    placeholder="Ex: 6" 
                  />
                  <p className="text-xs text-zinc-500 mt-2 ml-1">A despesa será removida automaticamente quando chegar a 0</p>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setShowModal(false);
                setEditingDespesaId && setEditingDespesaId(null);
              }}
              className="flex-1 p-3.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-medium border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 font-semibold transition shadow-lg shadow-rose-900/20 hover:shadow-rose-500/20"
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
        iconColorClass="bg-rose-500/20 text-rose-400"
        setShowModal={setShowModal}
        setEditingDespesaExtraId={setEditingDespesaExtraId}
      >
        <form onSubmit={handleDespesaExtraSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Nome da Despesa</label>
            <input 
              required 
              className="glass-input w-full" 
              value={despesaExtraFormData.nome} 
              onChange={e => setDespesaExtraFormData({...despesaExtraFormData, nome: e.target.value})} 
              placeholder="Ex: Compra na distribuidora, Gasolina..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Valor (R$)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                className="glass-input w-full font-mono" 
                value={despesaExtraFormData.valor} 
                onChange={e => setDespesaExtraFormData({...despesaExtraFormData, valor: e.target.value})}
                onKeyDown={(e) => {
                  if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                }}
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Data</label>
              <Calendar 
                value={despesaExtraFormData.data} 
                onChange={(date) => setDespesaExtraFormData({...despesaExtraFormData, data: date})}
                onClear={() => setDespesaExtraFormData({...despesaExtraFormData, data: ''})}
                required={true}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setShowModal(false);
                setEditingDespesaExtraId && setEditingDespesaExtraId(null);
              }}
              className="flex-1 p-3.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-medium border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 font-semibold transition shadow-lg shadow-rose-900/20 hover:shadow-rose-500/20"
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
      iconColorClass="bg-purple-500/20 text-purple-400"
      setShowModal={setShowModal}
      setEditingCompraId={setEditingCompraId}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">O que você comprou?</label>
          <input 
            required 
            className="glass-input w-full" 
            value={formData.nome} 
            onChange={e => setFormData({...formData, nome: e.target.value})} 
            placeholder="Ex: iPhone 15 Pro Max" 
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Valor Total (R$)</label>
            <input 
              required 
              type="number" 
              step="0.01" 
              className="glass-input w-full font-mono" 
              value={formData.valor} 
              onChange={e => setFormData({...formData, valor: e.target.value})}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
              }}
              placeholder="0.00" 
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Data da Compra <span className="text-rose-400">*</span></label>
            <Calendar 
                value={formData.data} 
                onChange={(date) => setFormData({...formData, data: date})}
                onClear={() => setFormData({...formData, data: ''})}
                required={true}
            />
            </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Quantidade de Parcelas</label>
          <div className="relative" ref={parcelasDropdownRef}>
            <button
              type="button"
              onClick={() => setShowParcelasDropdown(!showParcelasDropdown)}
              className="glass-input w-full flex items-center justify-between cursor-pointer text-white bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-200 hover:border-purple-500/50"
            >
              <span className="font-medium">
                {formData.parcelas}x {formData.valor ? `de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor / formData.parcelas)}` : ''}
              </span>
              <ChevronDown 
                size={18} 
                className={`text-zinc-400 transition-transform duration-200 ${showParcelasDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            
            {showParcelasDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {[1,2,3,4,5,6,7,8,9,10,12,18,24].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setFormData({...formData, parcelas: n});
                        setShowParcelasDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors duration-150 ${
                        formData.parcelas === n
                          ? 'bg-purple-600/20 text-purple-300 border-l-2 border-purple-500'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{n}x</span>
                        {formData.valor && (
                          <span className="text-sm text-zinc-400">
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

        <div className="flex gap-3 mt-8">
            <button 
              type="button" 
              onClick={() => { setShowModal(false); setEditingCompraId && setEditingCompraId(null); }} 
              className="flex-1 p-3.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-medium border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 font-semibold transition shadow-lg shadow-purple-900/20 hover:shadow-purple-500/20"
            >
              {editingCompraId ? 'Salvar Alterações' : 'Confirmar Compra'}
            </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default Modal;
