import React, { useEffect } from 'react';
import { X, Edit, Trash2, TrendingUp, Calendar as CalendarIcon, DollarSign, Power, Minus } from 'lucide-react';

const ModalDetalhesMes = ({ 
  showModal, 
  setShowModal, 
  monthKey, 
  monthName, 
  data, 
  addEntradaExtra, 
  editEntradaExtra, 
  removeEntradaExtra,
  toggleEntradaAtiva,
  addDespesaExtra,
  editDespesaExtra,
  removeDespesaExtra,
  toggleDespesaExtraAtiva,
  editDespesa,
  removeDespesa,
  formatCurrency,
  formatDate,
  setEditingEntradaId,
  setEditingDespesaExtraId,
  setEditingDespesaId,
  setModalType,
  setShowMainModal
}) => {
  if (!showModal || !monthKey) return null;

  const entradaDeveAparecerNoMes = (entrada) => {
    if (!entrada.recorrente) {
      return entrada.mes === monthKey;
    }
    
    const [entradaAno, entradaMesNum] = entrada.mes.split('-').map(Number);
    const entradaDate = new Date(entradaAno, entradaMesNum - 1, 1);
    
    const [mesAtualAno, mesAtualMesNum] = monthKey.split('-').map(Number);
    const mesAtualDate = new Date(mesAtualAno, mesAtualMesNum - 1, 1);
    
    return mesAtualDate >= entradaDate;
  };

  const entradasDoMes = (data.entradasExtras || []).filter(e => entradaDeveAparecerNoMes(e));
  const despesasExtrasDoMes = (data.despesasExtras || []).filter(d => d.mes === monthKey);
  const estornosDoMes = (data.estornos || []).filter(e => e.mes === monthKey);
  
  const [mesAno, mesNum] = monthKey.split('-').map(Number);
  const mesDate = new Date(mesAno, mesNum - 1, 1);
  
  const despesasFixasDoMes = (data.despesas || []).filter(d => {
    if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
      return true;
    }
    
    const vezesRestantesInicial = parseInt(d.vezesRestantes) || 0;
    
    if (d.dataInicio) {
      const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
      const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
      
      if (mesDate < inicioDate) {
        return false;
      }
      
      const mesesPassados = (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 + 
                            (mesDate.getMonth() - inicioDate.getMonth());
      const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
      
      return vezesRestantesAgora > 0;
    } else {
      return vezesRestantesInicial > 0;
    }
  });

  const totalEntradasExtras = entradasDoMes
    .filter(e => e.ativo !== false)
    .reduce((sum, e) => sum + parseFloat(e.valor || 0), 0);

  const totalEstornos = estornosDoMes
    .filter(e => !data.salariosRecebidos?.includes(e.mes))
    .reduce((sum, e) => sum + parseFloat(e.valor || 0), 0);

  let faturaCartao = 0;
  data.compras.forEach(compra => {
    if (compra.oculta) return;
    
    const [year, month, day] = compra.data.split('-').map(Number);
    const compraDay = day;
    const compraMonth = month - 1;
    const compraYear = year;
    
    let faturaCompetenciaMonth = compraMonth;
    let faturaCompetenciaYear = compraYear;
    
    if (compraDay >= data.diaFechamento) {
      faturaCompetenciaMonth += 1;
      if (faturaCompetenciaMonth > 11) {
        faturaCompetenciaMonth = 0;
        faturaCompetenciaYear += 1;
      }
    }
    
    const monthIndex = mesDate.getMonth();
    const yearIndex = mesDate.getFullYear();
    const monthsDiff = (yearIndex - faturaCompetenciaYear) * 12 + (monthIndex - faturaCompetenciaMonth);
    
    if (monthsDiff >= 0 && monthsDiff < compra.parcelas) {
      faturaCartao += parseFloat(compra.valorTotal) / parseFloat(compra.parcelas);
    }
  });

  estornosDoMes.forEach(estorno => {
    const [estornoYear, estornoMonth] = estorno.mes.split('-').map(Number);
    const estornoMonthIndex = estornoMonth - 1;
    const monthIndex = mesDate.getMonth();
    const yearIndex = mesDate.getFullYear();
    
    if (estornoYear === yearIndex && estornoMonthIndex === monthIndex) {
      faturaCartao -= parseFloat(estorno.valor);
    }
  });

  const salarioMensal = parseFloat(data.salarioMensal || 0);
  const totalEntradas = salarioMensal;

  const handleEdit = (entrada) => {
    setEditingEntradaId(entrada.id);
    setModalType('entradaExtra');
    setShowMainModal(true);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowModal]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
        }
      }}
    >
      <div className="bg-zinc-900/95 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl ring-1 ring-white/5 relative flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-white/5 flex-shrink-0 bg-zinc-900/95">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-white/10">
              <CalendarIcon size={24} />
            </div>
            Detalhes - {monthName}
          </h2>
          <button 
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar flex-1 px-8 pb-8 pt-6">
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Entradas</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-zinc-300">Renda Passiva</span>
                  <span className="text-lg font-bold text-emerald-400">{formatCurrency(salarioMensal)}</span>
                </div>
                {totalEntradasExtras > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-zinc-500 italic">Extras (informativo)</span>
                    <span className="text-sm font-semibold text-blue-400">{formatCurrency(totalEntradasExtras)}</span>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-base font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-emerald-400">{formatCurrency(totalEntradas)}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-rose-500/10 bg-gradient-to-br from-rose-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <Minus size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Despesas</h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  const totalDespesasFixas = (data.despesas || []).reduce((sum, d) => {
                    if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
                      return sum + parseFloat(d.valor || 0);
                    }
                    
                    const vezesRestantesInicial = parseInt(d.vezesRestantes) || 0;
                    
                    if (d.dataInicio) {
                      const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
                      const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                      
                      if (mesDate < inicioDate) {
                        return sum;
                      }
                      
                      const mesesPassados = (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                            (mesDate.getMonth() - inicioDate.getMonth());
                      const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
                      
                      if (vezesRestantesAgora > 0) {
                        return sum + parseFloat(d.valor || 0);
                      }
                    } else {
                      if (vezesRestantesInicial > 0) {
                        return sum + parseFloat(d.valor || 0);
                      }
                    }
                    
                    return sum;
                  }, 0) || parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0);
                  
                  const totalDespesasExtras = despesasExtrasDoMes.filter(d => d.ativo !== false).reduce((sum, d) => sum + parseFloat(d.valor || 0), 0);
                  
                  return (
                    <>
                      {totalDespesasExtras > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs text-zinc-500 italic">Extras (informativo)</span>
                          <span className="text-sm font-semibold text-rose-400/70">
                            {formatCurrency(totalDespesasExtras)}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-base font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-rose-400">
                          {formatCurrency(totalDespesasFixas)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-base font-bold text-white">Fatura Cartão</h3>
              </div>
              <div className="space-y-2.5">
                {(() => {
                  let faturaBruta = 0;
                  data.compras.forEach(compra => {
                    if (compra.oculta) return;
                    const [year, month, day] = compra.data.split('-').map(Number);
                    const compraDay = day;
                    const compraMonth = month - 1;
                    const compraYear = year;
                    let faturaCompetenciaMonth = compraMonth;
                    let faturaCompetenciaYear = compraYear;
                    if (compraDay >= data.diaFechamento) {
                      faturaCompetenciaMonth += 1;
                      if (faturaCompetenciaMonth > 11) {
                        faturaCompetenciaMonth = 0;
                        faturaCompetenciaYear += 1;
                      }
                    }
                    const monthIndex = mesDate.getMonth();
                    const yearIndex = mesDate.getFullYear();
                    const monthsDiff = (yearIndex - faturaCompetenciaYear) * 12 + (monthIndex - faturaCompetenciaMonth);
                    if (monthsDiff >= 0 && monthsDiff < compra.parcelas) {
                      faturaBruta += parseFloat(compra.valorTotal) / parseFloat(compra.parcelas);
                    }
                  });
                  
                  return (
                    <>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-medium text-zinc-300">Parcelas</span>
                        <span className="text-lg font-bold text-purple-400">
                          {formatCurrency(faturaBruta)}
                        </span>
                      </div>
                      {totalEstornos > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm font-medium text-zinc-300">Estornos</span>
                          <span className="text-base font-bold text-emerald-400">-{formatCurrency(totalEstornos)}</span>
                        </div>
                      )}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-base font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-purple-400">
                          {formatCurrency(Math.max(0, faturaCartao))}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-400" />
                  Entradas Extras
                </h3>
              </div>
              
              {entradasDoMes.length === 0 ? (
                <div className="glass-panel text-center py-12 text-zinc-500 rounded-xl">
                  <DollarSign size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhuma entrada extra registrada para este mês.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entradasDoMes.map(entrada => {
                    const isMesOriginal = entrada.mes === monthKey;
                    const [entradaAno, entradaMesNum] = entrada.mes.split('-').map(Number);
                    const entradaMesNome = new Date(entradaAno, entradaMesNum - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    
                    return (
                      <div 
                        key={`${entrada.id}-${monthKey}`} 
                        className={`glass-panel p-5 rounded-xl flex items-start justify-between group border transition-all ${
                          entrada.ativo === false ? 'opacity-50 border-zinc-700' : 'border-white/10 hover:border-emerald-500/30 bg-white/5'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-start gap-2.5 mb-3 flex-wrap">
                            <h4 className={`text-base font-semibold leading-tight ${entrada.ativo === false ? 'text-zinc-500 line-through' : 'text-white'}`}>
                              {entrada.nome}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              {entrada.recorrente && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
                                  RECORRENTE
                                </span>
                              )}
                              {entrada.recorrente && !isMesOriginal && (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
                                  Desde {entradaMesNome}
                                </span>
                              )}
                              {entrada.ativo === false && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/40">
                                  DESATIVADA
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-emerald-400">{formatCurrency(entrada.valor)}</span>
                              {entrada.data && (
                                <span className="text-sm text-zinc-400 font-medium">• {formatDate(entrada.data)}</span>
                              )}
                            </div>
                            {entrada.recorrente && !isMesOriginal && (
                              <span className="text-xs text-zinc-500 font-medium">Mês original: {entradaMesNome}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {(!entrada.recorrente || isMesOriginal) ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEntradaAtiva(entrada.id);
                                }}
                                className={`p-2.5 rounded-lg transition-all ${
                                  entrada.ativo === false 
                                    ? 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/30' 
                                    : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/80 border border-transparent hover:border-white/10'
                                }`}
                                title={entrada.ativo === false ? "Ativar entrada" : "Desativar entrada"}
                              >
                                <Power size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(entrada);
                                }}
                                className="p-2.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/20 transition-all border border-transparent hover:border-blue-500/30" 
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeEntradaExtra(entrada.id);
                                }}
                                className="p-2.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all border border-transparent hover:border-rose-500/30" 
                                title="Remover"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-500 italic px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                              Edite no mês original
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Minus size={20} className="text-rose-400" />
                  Despesas
                </h3>
              </div>
              
              {(() => {
                const todasDespesas = [
                  ...despesasFixasDoMes.map(d => ({ ...d, tipo: 'fixa' })),
                  ...despesasExtrasDoMes.map(d => ({ ...d, tipo: 'extra' }))
                ];
                
                if (todasDespesas.length === 0) {
                  return (
                    <div className="glass-panel text-center py-12 text-zinc-500 rounded-xl">
                      <Minus size={48} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Nenhuma despesa registrada para este mês.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {todasDespesas.map(despesa => {
                      const isExtra = despesa.tipo === 'extra';
                      const temLimite = despesa.vezesRestantes !== undefined && despesa.vezesRestantes !== null;
                      
                      let vezesRestantesAgora = null;
                      if (isExtra === false && temLimite) {
                        const vezesRestantesInicial = parseInt(despesa.vezesRestantes) || 0;
                        if (despesa.dataInicio) {
                          const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
                          const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                          
                          if (mesDate >= inicioDate) {
                            const mesesPassados = (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                                  (mesDate.getMonth() - inicioDate.getMonth());
                            vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
                          } else {
                            vezesRestantesAgora = vezesRestantesInicial;
                          }
                        } else {
                          vezesRestantesAgora = vezesRestantesInicial;
                        }
                      }
                      
                      return (
                        <div 
                          key={`${despesa.tipo}-${despesa.id}`} 
                          className={`glass-panel p-5 rounded-xl flex items-start justify-between group border transition-all ${
                            (isExtra && despesa.ativo === false) ? 'opacity-50 border-zinc-700' : 'border-white/10 hover:border-rose-500/30 bg-white/5'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <h4 className={`text-base font-semibold leading-tight ${(isExtra && despesa.ativo === false) ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                {despesa.nome}
                              </h4>
                              {!isExtra && temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap">
                                  Falta {vezesRestantesAgora}x
                                </span>
                              )}
                              {isExtra && despesa.ativo === false && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/40">
                                  DESATIVADA
                                </span>
                              )}
                              {!isExtra && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                  FIXA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-lg font-bold text-rose-400">{formatCurrency(despesa.valor)}</span>
                              {isExtra && despesa.data && (
                                <span className="text-sm text-zinc-400 font-medium">• {formatDate(despesa.data)}</span>
                              )}
                              {!isExtra && temLimite && despesa.dataInicio && (
                                <span className="text-sm text-zinc-400 font-medium">• Início: {formatDate(despesa.dataInicio)}</span>
                              )}
                              {!isExtra && (
                                <span className="text-sm text-zinc-400 font-medium">• /mês</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {isExtra ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDespesaExtraAtiva(despesa.id);
                                  }}
                                  className={`p-2.5 rounded-lg transition-all ${
                                    despesa.ativo === false 
                                      ? 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/30' 
                                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/80 border border-transparent hover:border-white/10'
                                  }`}
                                  title={despesa.ativo === false ? "Ativar despesa" : "Desativar despesa"}
                                >
                                  <Power size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editDespesaExtra(despesa);
                                  }}
                                  className="p-2.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/20 transition-all border border-transparent hover:border-blue-500/30" 
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDespesaExtra(despesa.id);
                                  }}
                                  className="p-2.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all border border-transparent hover:border-rose-500/30" 
                                  title="Remover"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editDespesa(despesa);
                                  }}
                                  className="p-2.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/20 transition-all border border-transparent hover:border-blue-500/30" 
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDespesa(despesa.id);
                                  }}
                                  className="p-2.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all border border-transparent hover:border-rose-500/30" 
                                  title="Remover"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalhesMes;

