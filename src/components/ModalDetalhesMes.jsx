import { useEffect } from 'react';
import { X, Edit, Trash2, TrendingUp, Calendar as CalendarIcon, DollarSign, Power, Minus } from 'lucide-react';

const ModalDetalhesMes = ({ 
  showModal, 
  setShowModal, 
  monthKey, 
  monthName, 
  data, 
  removeEntradaExtra,
  toggleEntradaAtiva,
  editDespesaExtra,
  removeDespesaExtra,
  toggleDespesaExtraAtiva,
  editDespesa,
  removeDespesa,
  formatCurrency,
  formatDate,
  setEditingEntradaId,
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

      const mesesPassados =
        (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 +
        (mesDate.getMonth() - inicioDate.getMonth());
      const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;

      if (vezesRestantesAgora > 0) {
        return sum + parseFloat(d.valor || 0);
      }
    } else if (vezesRestantesInicial > 0) {
      return sum + parseFloat(d.valor || 0);
    }

    return sum;
  }, 0) || parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0);
  const totalDespesasExtras = despesasExtrasDoMes.filter((despesa) => despesa.ativo !== false).reduce((sum, despesa) => sum + parseFloat(despesa.valor || 0), 0);

  let faturaBruta = 0;
  data.compras.forEach((compra) => {
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

  const handleEdit = (entrada) => {
    setShowModal(false);
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
      className="overlay-shell"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
        }
      }}
    >
      <div className="modal-card modal-card--wide surface-enter">
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-3">
            <div className="modal-icon panel-icon--accent">
              <CalendarIcon size={24} />
            </div>
            Detalhes - {monthName}
          </h2>
          <button onClick={() => setShowModal(false)} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pt-6">
          <div className="summary-grid">
            <div className="summary-tile summary-tile--positive">
              <div className="panel-title-wrap mb-4">
                <div className="panel-icon panel-icon--positive">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Entradas</h3>
                  <p className="panel-subtitle">Salário e extras</p>
                </div>
              </div>
              <div className="month-panel__rows">
                <div className="month-row">
                  <span>Receita mensal</span>
                  <span className="month-row__value month-row__value--positive">{formatCurrency(salarioMensal)}</span>
                </div>
                {totalEntradasExtras > 0 && (
                  <div className="month-row">
                    <span>Extras</span>
                    <span className="month-row__value month-row__value--accent">{formatCurrency(totalEntradasExtras)}</span>
                  </div>
                )}
                <div className="month-divider" />
                <div className="month-row month-row--summary">
                  <span>Total</span>
                  <span className="month-row__value month-row__value--positive">{formatCurrency(totalEntradas)}</span>
                </div>
              </div>
            </div>

            <div className="summary-tile summary-tile--negative">
              <div className="panel-title-wrap mb-4">
                <div className="panel-icon panel-icon--negative">
                  <Minus size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Despesas</h3>
                  <p className="panel-subtitle">Fixas e extras</p>
                </div>
              </div>
              <div className="month-panel__rows">
                {totalDespesasExtras > 0 && (
                  <div className="month-row">
                    <span>Extras</span>
                    <span className="month-row__value month-row__value--negative">{formatCurrency(totalDespesasExtras)}</span>
                  </div>
                )}
                <div className="month-divider" />
                <div className="month-row month-row--summary">
                  <span>Total</span>
                  <span className="month-row__value month-row__value--negative">{formatCurrency(totalDespesasFixas)}</span>
                </div>
              </div>
            </div>

            <div className="summary-tile summary-tile--accent">
              <div className="panel-title-wrap mb-4">
                <div className="panel-icon panel-icon--accent">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="panel-title">Fatura do cartão</h3>
                  <p className="panel-subtitle">Parcelas e abatimentos</p>
                </div>
              </div>
              <div className="month-panel__rows">
                <div className="month-row">
                  <span>Parcelas</span>
                  <span className="month-row__value month-row__value--accent">{formatCurrency(faturaBruta)}</span>
                </div>
                {totalEstornos > 0 && (
                  <div className="month-row">
                    <span>Estornos</span>
                    <span className="month-row__value month-row__value--positive">-{formatCurrency(totalEstornos)}</span>
                  </div>
                )}
                <div className="month-divider" />
                <div className="month-row month-row--summary">
                  <span>Total</span>
                  <span className="month-row__value month-row__value--accent">{formatCurrency(Math.max(0, faturaCartao))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-columns">
            <section className="detail-section">
              <div className="section-header">
                <div>
                  <span className="panel-kicker">Entradas extras</span>
                  <h3 className="panel-title">Entradas do mês</h3>
                </div>
              </div>

              {entradasDoMes.length === 0 ? (
                <div className="detail-empty">
                  <DollarSign size={42} className="empty-state__icon" />
                  <p>Nenhuma entrada extra neste mês.</p>
                </div>
              ) : (
                <div className="detail-list custom-scrollbar">
                  <div className="list-stack">
                    {entradasDoMes.map((entrada) => {
                    const isMesOriginal = entrada.mes === monthKey;
                    const [entradaAno, entradaMesNum] = entrada.mes.split('-').map(Number);
                    const entradaMesNome = new Date(entradaAno, entradaMesNum - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    
                    return (
                      <div key={`${entrada.id}-${monthKey}`} className={`detail-item ${entrada.ativo === false ? 'detail-item--muted' : ''}`}>
                        <div className="detail-item__main">
                          <div className="flex flex-wrap items-start gap-2 mb-3">
                            <h4 className={`detail-item__title ${entrada.ativo === false ? 'ledger-row__title--muted' : ''}`}>
                              {entrada.nome}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {entrada.recorrente && (
                                <span className="pill pill--accent">Recorrente</span>
                              )}
                              {entrada.recorrente && !isMesOriginal && (
                                <span className="pill pill--muted">Desde {entradaMesNome}</span>
                              )}
                              {entrada.ativo === false && (
                                <span className="pill pill--negative">Desativada</span>
                              )}
                            </div>
                          </div>
                          <div className="ledger-row__meta flex flex-wrap items-center gap-3">
                              <span className="detail-item__value month-row__value--positive">{formatCurrency(entrada.valor)}</span>
                              {entrada.data && (
                                <span className="pill pill--muted">{formatDate(entrada.data)}</span>
                              )}
                              {entrada.recorrente && !isMesOriginal && <span>Mês original: {entradaMesNome}</span>}
                          </div>
                        </div>
                        <div className="detail-actions">
                          {(!entrada.recorrente || isMesOriginal) ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEntradaAtiva(entrada.id);
                                }}
                                className={`row-icon-button ${entrada.ativo === false ? 'row-icon-button--positive' : 'row-icon-button--neutral'}`}
                                title={entrada.ativo === false ? "Ativar entrada" : "Desativar entrada"}
                              >
                                <Power size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(entrada);
                                }}
                                className="row-icon-button row-icon-button--accent"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeEntradaExtra(entrada.id);
                                }}
                                className="row-icon-button row-icon-button--negative"
                                title="Remover"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <span className="pill pill--muted">
                              Edite no mês original
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="detail-section">
              <div className="section-header">
                <div>
                  <span className="panel-kicker">Saídas do mês</span>
                  <h3 className="panel-title">Despesas do mês</h3>
                </div>
              </div>

              {(() => {
                const todasDespesas = [
                  ...despesasFixasDoMes.map(d => ({ ...d, tipo: 'fixa' })),
                  ...despesasExtrasDoMes.map(d => ({ ...d, tipo: 'extra' }))
                ];
                
                if (todasDespesas.length === 0) {
                  return (
                    <div className="detail-empty">
                      <Minus size={42} className="empty-state__icon" />
                      <p>Nenhuma despesa neste mês.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="detail-list custom-scrollbar">
                    <div className="list-stack">
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
                        <div key={`${despesa.tipo}-${despesa.id}`} className={`detail-item ${(isExtra && despesa.ativo === false) ? 'detail-item--muted' : ''}`}>
                          <div className="detail-item__main">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h4 className={`detail-item__title ${(isExtra && despesa.ativo === false) ? 'ledger-row__title--muted' : ''}`}>
                                {despesa.nome}
                              </h4>
                              {!isExtra && temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                                <span className="pill pill--accent">Falta {vezesRestantesAgora}x</span>
                              )}
                              {isExtra && despesa.ativo === false && (
                                <span className="pill pill--negative">Desativada</span>
                              )}
                              {!isExtra && (
                                <span className="pill pill--muted">Fixa</span>
                              )}
                            </div>
                            <div className="ledger-row__meta flex flex-wrap items-center gap-3">
                              <span className="detail-item__value month-row__value--negative">{formatCurrency(despesa.valor)}</span>
                              {isExtra && despesa.data && (
                                <span className="pill pill--muted">{formatDate(despesa.data)}</span>
                              )}
                              {!isExtra && temLimite && despesa.dataInicio && (
                                <span className="pill pill--muted">Início {formatDate(despesa.dataInicio)}</span>
                              )}
                              {!isExtra && (
                                <span>/mês</span>
                              )}
                            </div>
                          </div>
                          <div className="detail-actions">
                            {isExtra ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDespesaExtraAtiva(despesa.id);
                                  }}
                                  className={`row-icon-button ${despesa.ativo === false ? 'row-icon-button--positive' : 'row-icon-button--neutral'}`}
                                  title={despesa.ativo === false ? "Ativar despesa" : "Desativar despesa"}
                                >
                                  <Power size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowModal(false);
                                    editDespesaExtra(despesa);
                                  }}
                                  className="row-icon-button row-icon-button--accent"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDespesaExtra(despesa.id);
                                  }}
                                  className="row-icon-button row-icon-button--negative"
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
                                    setShowModal(false);
                                    editDespesa(despesa);
                                  }}
                                  className="row-icon-button row-icon-button--accent"
                                  title="Editar"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeDespesa(despesa.id);
                                  }}
                                  className="row-icon-button row-icon-button--negative"
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
                  </div>
                );
              })()}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalhesMes;
