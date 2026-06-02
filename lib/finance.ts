// Núcleo de cálculo financeiro — portado verbatim de App.jsx / ModalDetalhesMes.jsx.
// A lógica de competência da fatura era duplicada; foi extraída para grossCardBill/estornosForMonth
// mantendo resultados idênticos aos originais. NÃO alterar os algoritmos (afeta dados reais).

import type {
  Compra,
  Despesa,
  Estorno,
  FinanceData,
  Numeric,
  TimelineMonth,
} from './types';

const num = (v: unknown): number => parseFloat(String(v ?? 0)) || 0;

/**
 * Soma das parcelas de compras (não ocultas) cuja competência cai no mês (year, monthIndex 0-11).
 * Competência da 1ª fatura: compraDay >= diaFechamento empurra +1 mês.
 */
export function grossCardBill(
  compras: Compra[],
  diaFechamento: number,
  year: number,
  monthIndex: number,
): number {
  let total = 0;

  compras.forEach((compra) => {
    if (compra.oculta) return;

    const [compraYear, month, day] = compra.data.split('-').map(Number);
    const compraMonth = month - 1;

    let faturaCompetenciaMonth = compraMonth;
    let faturaCompetenciaYear = compraYear;

    if (day >= diaFechamento) {
      faturaCompetenciaMonth += 1;
      if (faturaCompetenciaMonth > 11) {
        faturaCompetenciaMonth = 0;
        faturaCompetenciaYear += 1;
      }
    }

    const monthsDiff =
      (year - faturaCompetenciaYear) * 12 + (monthIndex - faturaCompetenciaMonth);

    if (monthsDiff >= 0 && monthsDiff < compra.parcelas) {
      total += parseFloat(String(compra.valorTotal)) / parseFloat(String(compra.parcelas));
    }
  });

  return total;
}

/** Soma de estornos cuja competência (mes 'YYYY-MM') é exatamente (year, monthIndex). */
export function estornosForMonth(
  estornos: Estorno[],
  year: number,
  monthIndex: number,
): number {
  let total = 0;

  estornos.forEach((estorno) => {
    const [estornoYear, estornoMonth] = estorno.mes.split('-').map(Number);
    if (estornoYear === year && estornoMonth - 1 === monthIndex) {
      total += parseFloat(String(estorno.valor));
    }
  });

  return total;
}

/** Projeção de caixa de 12 meses (pula meses com renda já recebida). */
export function calculateTimeline(data: FinanceData): TimelineMonth[] {
  const months: TimelineMonth[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const diaFechamento = Number(data.diaFechamento);
  let accumulatedBalance = 0;
  let monthsAdded = 0;
  let i = 0;

  while (monthsAdded < 12) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const salarioJaRecebido = data.salariosRecebidos?.includes(monthKey) || false;

    if (salarioJaRecebido) {
      i++;
      continue;
    }

    let income = parseFloat(String(data.salarioMensal));

    if (monthsAdded === 0) {
      const saldoInicial = parseFloat(String(data.saldoAtual));
      income += saldoInicial;
    }

    const totalDespesasCadastradas = (data.despesas || []).reduce((sum, d) => {
      if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
        return sum + num(d.valor);
      }

      const vezesRestantesInicial = parseInt(String(d.vezesRestantes)) || 0;

      if (d.dataInicio) {
        const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
        const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
        const mesAtualDate = new Date(date.getFullYear(), date.getMonth(), 1);

        if (mesAtualDate < inicioDate) {
          return sum;
        }

        const mesesPassados =
          (mesAtualDate.getFullYear() - inicioDate.getFullYear()) * 12 +
          (mesAtualDate.getMonth() - inicioDate.getMonth());
        const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;

        if (vezesRestantesAgora > 0) {
          return sum + num(d.valor);
        }
      } else {
        const vezesRestantesAgora = vezesRestantesInicial - monthsAdded;
        if (vezesRestantesAgora > 0) {
          return sum + num(d.valor);
        }
      }

      return sum;
    }, 0);

    const expenses =
      totalDespesasCadastradas > 0
        ? totalDespesasCadastradas
        : num(data.despesasFixas) + num(data.despesasVariaveis);

    const cardBill =
      grossCardBill(data.compras, diaFechamento, date.getFullYear(), date.getMonth()) -
      estornosForMonth(data.estornos, date.getFullYear(), date.getMonth());

    const monthBalance = income - expenses - cardBill;
    accumulatedBalance += monthBalance;

    months.push({
      name: monthName,
      monthKey,
      salarioJaRecebido,
      income,
      expenses,
      cardBill,
      netResult: monthBalance,
      finalBalance: accumulatedBalance,
    });

    monthsAdded++;
    i++;
  }

  return months;
}

/** Em qual número de parcela a compra está hoje. */
export function calculateParcelaAtual(compra: Compra, diaFechamento: Numeric): number {
  const today = new Date();
  const [year, month, day] = compra.data.split('-').map(Number);

  let faturaMonth = month - 1;
  let faturaYear = year;

  if (day >= parseInt(String(diaFechamento))) {
    faturaMonth++;
    if (faturaMonth > 11) {
      faturaMonth = 0;
      faturaYear++;
    }
  }

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const diffMonths = (currentYear - faturaYear) * 12 + (currentMonth - faturaMonth);
  return diffMonths + 1;
}

/** Se a compra deve aparecer na lista de ativas. */
export function shouldShowCompra(
  compra: Compra,
  diaFechamento: Numeric,
  salariosRecebidos: string[] | undefined,
): boolean {
  const parcelaAtual = calculateParcelaAtual(compra, diaFechamento);

  if (parcelaAtual > compra.parcelas) return false;

  if (parcelaAtual === compra.parcelas) {
    const [year, month, day] = compra.data.split('-').map(Number);
    let faturaMonth = month - 1;
    let faturaYear = year;

    if (day >= parseInt(String(diaFechamento))) {
      faturaMonth++;
      if (faturaMonth > 11) {
        faturaMonth = 0;
        faturaYear++;
      }
    }

    faturaMonth += parcelaAtual - 1;
    while (faturaMonth > 11) {
      faturaMonth -= 12;
      faturaYear++;
    }

    const faturaKey = `${faturaYear}-${String(faturaMonth + 1).padStart(2, '0')}`;

    if (salariosRecebidos?.includes(faturaKey)) {
      return false;
    }
  }

  return true;
}

export function getLimiteAlerta(data: FinanceData): number {
  return data.limiteAlertaMensal !== undefined && data.limiteAlertaMensal !== null
    ? parseFloat(String(data.limiteAlertaMensal)) || 0
    : 500;
}

export function isMesAtencao(month: TimelineMonth, limiteAlertaMensal: number): boolean {
  return (
    month.netResult < 0 ||
    month.finalBalance < 0 ||
    month.netResult < limiteAlertaMensal
  );
}

/** Despesas vigentes no mês atual (respeita dataInicio + vezesRestantes). */
export function getDespesasAtivas(data: FinanceData): Despesa[] {
  const mesAtual = new Date();
  const inicioMesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);

  return (data.despesas || []).filter((despesa) => {
    if (despesa.vezesRestantes === null || despesa.vezesRestantes === undefined) {
      return true;
    }

    const vezesRestantesInicial = parseInt(String(despesa.vezesRestantes)) || 0;

    if (despesa.dataInicio) {
      const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
      const inicioDate = new Date(inicioAno, inicioMes - 1, 1);

      if (inicioMesAtual < inicioDate) {
        return true;
      }

      const mesesPassados =
        (inicioMesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
        (inicioMesAtual.getMonth() - inicioDate.getMonth());

      return vezesRestantesInicial - mesesPassados > 0;
    }

    return vezesRestantesInicial > 0;
  });
}

/** Quantas vezes restam para uma despesa limitada no mês atual (ou null se permanente). */
export function getVezesRestantesAgora(despesa: Despesa): number | null {
  const temLimite = despesa.vezesRestantes !== undefined && despesa.vezesRestantes !== null;
  if (!temLimite) return null;

  const vezesRestantesInicial = parseInt(String(despesa.vezesRestantes)) || 0;
  if (!despesa.dataInicio) return vezesRestantesInicial;

  const mesAtual = new Date();
  const inicioMesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
  const inicioDate = new Date(inicioAno, inicioMes - 1, 1);

  if (inicioMesAtual < inicioDate) return vezesRestantesInicial;

  const mesesPassados =
    (inicioMesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
    (inicioMesAtual.getMonth() - inicioDate.getMonth());

  return vezesRestantesInicial - mesesPassados;
}

export interface Derivations {
  timeline: TimelineMonth[];
  limiteAlertaMensal: number;
  comprasAtivas: Compra[];
  estornosPendentes: Estorno[];
  despesasAtivas: Despesa[];
  totalDespesasAtivas: number;
  mediaSobra: number;
  primeiroMesCritico: TimelineMonth | undefined;
  mesesSobControle: number;
  mesAtualLabel: string;
}

/** Computa todas as derivações usadas no dashboard. */
export function deriveDashboard(data: FinanceData): Derivations {
  const timeline = calculateTimeline(data);
  const limiteAlertaMensal = getLimiteAlerta(data);

  const comprasAtivas = data.compras.filter((compra) =>
    shouldShowCompra(compra, data.diaFechamento, data.salariosRecebidos),
  );
  const estornosPendentes = data.estornos.filter(
    (estorno) => !data.salariosRecebidos?.includes(estorno.mes),
  );
  const despesasAtivas = getDespesasAtivas(data);

  const totalDespesasAtivas =
    despesasAtivas.reduce((sum, despesa) => sum + num(despesa.valor), 0) ||
    num(data.despesasFixas) + num(data.despesasVariaveis);

  const mediaSobra =
    timeline.length > 0
      ? timeline.reduce((sum, month) => sum + month.netResult, 0) / timeline.length
      : 0;
  const primeiroMesCritico = timeline.find((month) => isMesAtencao(month, limiteAlertaMensal));
  const mesesSobControle = timeline.filter(
    (month) => !isMesAtencao(month, limiteAlertaMensal),
  ).length;

  const mesAtual = new Date();
  const mesAtualLabel = mesAtual.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return {
    timeline,
    limiteAlertaMensal,
    comprasAtivas,
    estornosPendentes,
    despesasAtivas,
    totalDespesasAtivas,
    mediaSobra,
    primeiroMesCritico,
    mesesSobControle,
    mesAtualLabel,
  };
}
