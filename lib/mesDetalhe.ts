// Cálculos do detalhamento de um mês — portado verbatim de ModalDetalhesMes.jsx.

import { estornosForMonth, grossCardBill } from './finance';
import type { Despesa, DespesaExtra, EntradaExtra, FinanceData } from './types';

const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export interface MesDetalhe {
  entradasDoMes: EntradaExtra[];
  despesasExtrasDoMes: DespesaExtra[];
  despesasFixasDoMes: Despesa[];
  salarioMensal: number;
  totalEntradas: number;
  totalEntradasExtras: number;
  totalDespesasFixas: number;
  totalDespesasExtras: number;
  faturaBruta: number;
  faturaCartao: number;
  totalEstornos: number;
}

export function computeMesDetalhe(data: FinanceData, monthKey: string): MesDetalhe {
  const [mesAno, mesNum] = monthKey.split('-').map(Number);
  const mesDate = new Date(mesAno, mesNum - 1, 1);
  const diaFechamento = Number(data.diaFechamento);

  const entradaDeveAparecerNoMes = (entrada: EntradaExtra) => {
    if (!entrada.recorrente) {
      return entrada.mes === monthKey;
    }
    const [eAno, eMes] = entrada.mes.split('-').map(Number);
    const entradaDate = new Date(eAno, eMes - 1, 1);
    return mesDate >= entradaDate;
  };

  const entradasDoMes = (data.entradasExtras || []).filter(entradaDeveAparecerNoMes);
  const despesasExtrasDoMes = (data.despesasExtras || []).filter((d) => d.mes === monthKey);
  const estornosDoMes = (data.estornos || []).filter((e) => e.mes === monthKey);

  const despesasFixasDoMes = (data.despesas || []).filter((d) => {
    if (d.vezesRestantes === null || d.vezesRestantes === undefined) return true;
    const vezesRestantesInicial = parseInt(String(d.vezesRestantes)) || 0;
    if (d.dataInicio) {
      const [iAno, iMes] = d.dataInicio.split('-').map(Number);
      const inicioDate = new Date(iAno, iMes - 1, 1);
      if (mesDate < inicioDate) return false;
      const mesesPassados =
        (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 + (mesDate.getMonth() - inicioDate.getMonth());
      return vezesRestantesInicial - mesesPassados > 0;
    }
    return vezesRestantesInicial > 0;
  });

  const totalEntradasExtras = entradasDoMes
    .filter((e) => e.ativo !== false)
    .reduce((sum, e) => sum + num(e.valor), 0);

  const totalEstornos = estornosDoMes
    .filter((e) => !data.salariosRecebidos?.includes(e.mes))
    .reduce((sum, e) => sum + num(e.valor), 0);

  const faturaBruta = grossCardBill(data.compras, diaFechamento, mesAno, mesNum - 1);
  const faturaCartao = faturaBruta - estornosForMonth(data.estornos, mesAno, mesNum - 1);

  const salarioMensal = num(data.salarioMensal);
  const totalEntradas = salarioMensal;

  const totalDespesasFixas =
    (data.despesas || []).reduce((sum, d) => {
      if (d.vezesRestantes === null || d.vezesRestantes === undefined) return sum + num(d.valor);
      const vezesRestantesInicial = parseInt(String(d.vezesRestantes)) || 0;
      if (d.dataInicio) {
        const [iAno, iMes] = d.dataInicio.split('-').map(Number);
        const inicioDate = new Date(iAno, iMes - 1, 1);
        if (mesDate < inicioDate) return sum;
        const mesesPassados =
          (mesDate.getFullYear() - inicioDate.getFullYear()) * 12 + (mesDate.getMonth() - inicioDate.getMonth());
        if (vezesRestantesInicial - mesesPassados > 0) return sum + num(d.valor);
      } else if (vezesRestantesInicial > 0) {
        return sum + num(d.valor);
      }
      return sum;
    }, 0) || num(data.despesasFixas) + num(data.despesasVariaveis);

  const totalDespesasExtras = despesasExtrasDoMes
    .filter((d) => d.ativo !== false)
    .reduce((sum, d) => sum + num(d.valor), 0);

  return {
    entradasDoMes,
    despesasExtrasDoMes,
    despesasFixasDoMes,
    salarioMensal,
    totalEntradas,
    totalEntradasExtras,
    totalDespesasFixas,
    totalDespesasExtras,
    faturaBruta,
    faturaCartao,
    totalEstornos,
  };
}
