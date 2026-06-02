// Relatório financeiro .txt — portado verbatim de App.jsx (generateReport).

import { formatCurrency, formatDate } from './currency';
import { calculateTimeline, calculateParcelaAtual } from './finance';
import type { FinanceData } from './types';

export function generateReport(data: FinanceData): void {
  const timeline = calculateTimeline(data);

  let report = '='.repeat(70) + '\n';
  report += 'RELATÓRIO FINANCEIRO COMPLETO - ASSISTENTE FINANCEIRO\n';
  report += '='.repeat(70) + '\n\n';

  report += 'INFORMAÇÕES BÁSICAS\n';
  report += '-'.repeat(70) + '\n';
  report += `Saldo Atual: ${formatCurrency(parseFloat(String(data.saldoAtual)) || 0)}\n`;
  report += `Receita Mensal: ${formatCurrency(parseFloat(String(data.salarioMensal)) || 0)}\n`;

  const hoje = new Date();
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const totalDespesasFixasAtivas = (data.despesas || []).reduce((sum, d) => {
    if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
      return sum + (parseFloat(String(d.valor || 0)) || 0);
    }
    const vezesRestantesInicial = parseInt(String(d.vezesRestantes)) || 0;
    if (d.dataInicio) {
      const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
      const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
      if (mesAtual < inicioDate) return sum;
      const mesesPassados =
        (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
        (mesAtual.getMonth() - inicioDate.getMonth());
      if (vezesRestantesInicial - mesesPassados > 0) {
        return sum + (parseFloat(String(d.valor || 0)) || 0);
      }
    } else if (vezesRestantesInicial > 0) {
      return sum + (parseFloat(String(d.valor || 0)) || 0);
    }
    return sum;
  }, 0);

  report += `Despesas Fixas Ativas: ${formatCurrency(totalDespesasFixasAtivas)}\n`;
  if (
    totalDespesasFixasAtivas === 0 &&
    parseFloat(String(data.despesasFixas || 0)) + parseFloat(String(data.despesasVariaveis || 0)) > 0
  ) {
    report += `(Valor legado: ${formatCurrency(parseFloat(String(data.despesasFixas || 0)) + parseFloat(String(data.despesasVariaveis || 0)))})\n`;
  }
  report += `Dia de Fechamento do Cartão: ${data.diaFechamento}\n`;

  if (data.salariosRecebidos && data.salariosRecebidos.length > 0) {
    report += `\nMeses com Receita Já Lançada (${data.salariosRecebidos.length}):\n`;
    data.salariosRecebidos.sort().forEach((mes) => {
      const [ano, mesNum] = mes.split('-').map(Number);
      const dataMes = new Date(ano, mesNum - 1, 1);
      const nomeMes = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      report += `  • ${nomeMes}\n`;
    });
  }

  report += '\n' + '='.repeat(70) + '\n';

  report += 'PROJEÇÃO FINANCEIRA (12 MESES)\n';
  report += '-'.repeat(70) + '\n';
  if (timeline.length === 0) {
    report += 'Nenhuma projeção disponível.\n';
  } else {
    timeline.forEach((month) => {
      report += `\n${month.name}:\n`;
      report += `  Entradas: ${formatCurrency(month.income)}\n`;
      report += `  Fatura do Cartão: ${formatCurrency(month.cardBill)}\n`;
      report += `  Despesas Fixas: ${formatCurrency(month.expenses)}\n`;
      report += `  Sobra Mensal: ${formatCurrency(month.netResult)}\n`;
      report += `  Saldo Acumulado: ${formatCurrency(month.finalBalance)}\n`;
      if (month.salarioJaRecebido) {
        report += `  [Receita já lançada - mês excluído da projeção]\n`;
      }
    });
  }

  report += '\n' + '='.repeat(70) + '\n';

  report += 'COMPRAS PARCELADAS\n';
  report += '-'.repeat(70) + '\n';
  const todasCompras = data.compras || [];
  const comprasVisiveis = todasCompras.filter((c) => !c.oculta);
  const comprasOcultas = todasCompras.filter((c) => c.oculta);

  if (comprasVisiveis.length === 0 && comprasOcultas.length === 0) {
    report += 'Nenhuma compra registrada.\n';
  } else {
    if (comprasVisiveis.length > 0) {
      comprasVisiveis.forEach((compra, idx) => {
        const parcelaAtual = calculateParcelaAtual(compra, data.diaFechamento);
        const valorParcela = parseFloat(String(compra.valorTotal)) / parseFloat(String(compra.parcelas));
        const parcelasRestantes = parseFloat(String(compra.parcelas)) - parcelaAtual + 1;

        report += `\n${idx + 1}. ${compra.item}\n`;
        report += `   Data da Compra: ${formatDate(compra.data)}\n`;
        report += `   Valor Total: ${formatCurrency(compra.valorTotal)}\n`;
        report += `   Parcelas: ${compra.parcelas}x de ${formatCurrency(valorParcela)}\n`;
        report += `   Parcela Atual: ${parcelaAtual}/${compra.parcelas}\n`;
        report += `   Parcelas Restantes: ${parcelasRestantes > 0 ? parcelasRestantes : 0}\n`;

        const [year, month, day] = compra.data.split('-').map(Number);
        let faturaMonth = month - 1;
        let faturaYear = year;
        if (day >= parseInt(String(data.diaFechamento))) {
          faturaMonth++;
          if (faturaMonth > 11) {
            faturaMonth = 0;
            faturaYear++;
          }
        }
        const dataFatura = new Date(faturaYear, faturaMonth, 1);
        const nomeFatura = dataFatura.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        report += `   Primeira Fatura: ${nomeFatura}\n`;
      });
    }

    if (comprasOcultas.length > 0) {
      report += `\n\nCompras Ocultas (${comprasOcultas.length}):\n`;
      comprasOcultas.forEach((compra, idx) => {
        report += `  ${idx + 1}. ${compra.item} - ${formatCurrency(compra.valorTotal)} (${compra.parcelas}x)\n`;
      });
    }
  }

  report += '\n' + '='.repeat(70) + '\n';

  report += 'ESTORNADOS\n';
  report += '-'.repeat(70) + '\n';
  if (!data.estornos || data.estornos.length === 0) {
    report += 'Nenhum estorno registrado.\n';
  } else {
    const estornosVisiveis = data.estornos.filter((e) => !data.salariosRecebidos?.includes(e.mes));
    const estornosAplicados = data.estornos.filter((e) => data.salariosRecebidos?.includes(e.mes));

    if (estornosVisiveis.length > 0) {
      report += '\nEstornos Pendentes:\n';
      estornosVisiveis.forEach((estorno, idx) => {
        const [ano, mesNum] = estorno.mes.split('-').map(Number);
        const dataMes = new Date(ano, mesNum - 1, 1);
        const nomeMes = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        report += `  ${idx + 1}. ${estorno.nome}\n`;
        report += `     Mês: ${nomeMes} (${estorno.mes})\n`;
        report += `     Valor: ${formatCurrency(estorno.valor)}\n`;
      });
    }

    if (estornosAplicados.length > 0) {
      report += '\nEstornos Já Aplicados:\n';
      estornosAplicados.forEach((estorno, idx) => {
        const [ano, mesNum] = estorno.mes.split('-').map(Number);
        const dataMes = new Date(ano, mesNum - 1, 1);
        const nomeMes = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        report += `  ${idx + 1}. ${estorno.nome} - ${nomeMes} - ${formatCurrency(estorno.valor)} [Aplicado]\n`;
      });
    }
  }

  report += '\n' + '='.repeat(70) + '\n';

  report += 'DESPESAS FIXAS CADASTRADAS\n';
  report += '-'.repeat(70) + '\n';
  if (!data.despesas || data.despesas.length === 0) {
    report += 'Nenhuma despesa cadastrada.\n';
  } else {
    data.despesas.forEach((despesa, idx) => {
      report += `\n${idx + 1}. ${despesa.nome}\n`;
      report += `   Valor Mensal: ${formatCurrency(despesa.valor)}\n`;

      if (despesa.vezesRestantes !== null && despesa.vezesRestantes !== undefined) {
        const vezesRestantesInicial = parseInt(String(despesa.vezesRestantes)) || 0;

        if (despesa.dataInicio) {
          const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
          const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
          const nomeInicio = inicioDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          report += `   Data de Início: ${nomeInicio} (${despesa.dataInicio})\n`;

          if (mesAtual >= inicioDate) {
            const mesesPassados =
              (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
              (mesAtual.getMonth() - inicioDate.getMonth());
            const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
            report += `   Vezes Restantes Inicial: ${vezesRestantesInicial}\n`;
            report += `   Vezes Restantes Atual: ${vezesRestantesAgora > 0 ? vezesRestantesAgora : 0}\n`;
            report += `   Status: ${vezesRestantesAgora > 0 ? 'ATIVA' : 'CONCLUÍDA'}\n`;
          } else {
            report += `   Vezes Restantes: ${vezesRestantesInicial}\n`;
            report += `   Status: AGUARDANDO INÍCIO\n`;
          }
        } else {
          report += `   Vezes Restantes: ${vezesRestantesInicial}\n`;
          report += `   Status: ${vezesRestantesInicial > 0 ? 'ATIVA' : 'CONCLUÍDA'}\n`;
        }
      } else {
        report += `   Tipo: DESPESA PERMANENTE\n`;
      }
    });
  }

  report += '\n' + '='.repeat(70) + '\n';

  report += 'DESPESAS EXTRAS (INFORMATIVO)\n';
  report += '-'.repeat(70) + '\n';
  const despesasExtrasAtivas = (data.despesasExtras || []).filter((d) => d.ativo !== false);
  const despesasExtrasInativas = (data.despesasExtras || []).filter((d) => d.ativo === false);

  if (despesasExtrasAtivas.length === 0 && despesasExtrasInativas.length === 0) {
    report += 'Nenhuma despesa extra registrada.\n';
  } else {
    const despesasPorMes: Record<string, { ativas: typeof despesasExtrasAtivas; inativas: typeof despesasExtrasInativas }> = {};
    (data.despesasExtras || []).forEach((despesa) => {
      if (!despesasPorMes[despesa.mes]) {
        despesasPorMes[despesa.mes] = { ativas: [], inativas: [] };
      }
      if (despesa.ativo === false) {
        despesasPorMes[despesa.mes].inativas.push(despesa);
      } else {
        despesasPorMes[despesa.mes].ativas.push(despesa);
      }
    });

    Object.keys(despesasPorMes)
      .sort()
      .forEach((mes) => {
        const [ano, mesNum] = mes.split('-').map(Number);
        const dataMes = new Date(ano, mesNum - 1, 1);
        const nomeMes = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        report += `\n${nomeMes}:\n`;

        if (despesasPorMes[mes].ativas.length > 0) {
          despesasPorMes[mes].ativas.forEach((despesa, idx) => {
            report += `  ${idx + 1}. ${despesa.nome}\n`;
            report += `     Valor: ${formatCurrency(despesa.valor)}\n`;
            if (despesa.data) report += `     Data: ${formatDate(despesa.data)}\n`;
          });
        }

        if (despesasPorMes[mes].inativas.length > 0) {
          despesasPorMes[mes].inativas.forEach((despesa, idx) => {
            report += `  ${idx + 1}. ${despesa.nome} [DESATIVADA]\n`;
            report += `     Valor: ${formatCurrency(despesa.valor)}\n`;
            if (despesa.data) report += `     Data: ${formatDate(despesa.data)}\n`;
          });
        }
      });

    report += '\nNOTA: Despesas extras são apenas informativas e não entram nos cálculos da projeção.\n';
  }

  report += '\n' + '='.repeat(70) + '\n';

  report += 'ENTRADAS EXTRAS (INFORMATIVO)\n';
  report += '-'.repeat(70) + '\n';
  const entradasAtivas = (data.entradasExtras || []).filter((e) => e.ativo !== false);
  const entradasInativas = (data.entradasExtras || []).filter((e) => e.ativo === false);

  if (entradasAtivas.length === 0 && entradasInativas.length === 0) {
    report += 'Nenhuma entrada extra registrada.\n';
  } else {
    const entradasPorMes: Record<string, { ativas: typeof entradasAtivas; inativas: typeof entradasInativas }> = {};
    (data.entradasExtras || []).forEach((entrada) => {
      if (!entradasPorMes[entrada.mes]) {
        entradasPorMes[entrada.mes] = { ativas: [], inativas: [] };
      }
      if (entrada.ativo === false) {
        entradasPorMes[entrada.mes].inativas.push(entrada);
      } else {
        entradasPorMes[entrada.mes].ativas.push(entrada);
      }
    });

    Object.keys(entradasPorMes)
      .sort()
      .forEach((mes) => {
        const [ano, mesNum] = mes.split('-').map(Number);
        const dataMes = new Date(ano, mesNum - 1, 1);
        const nomeMes = dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        report += `\n${nomeMes}:\n`;

        if (entradasPorMes[mes].ativas.length > 0) {
          entradasPorMes[mes].ativas.forEach((entrada, idx) => {
            report += `  ${idx + 1}. ${entrada.nome}\n`;
            report += `     Valor: ${formatCurrency(entrada.valor)}\n`;
            if (entrada.data) report += `     Data: ${formatDate(entrada.data)}\n`;
            if (entrada.recorrente) report += `     [Recorrente]\n`;
          });
        }

        if (entradasPorMes[mes].inativas.length > 0) {
          entradasPorMes[mes].inativas.forEach((entrada, idx) => {
            report += `  ${idx + 1}. ${entrada.nome} [DESATIVADA]\n`;
            report += `     Valor: ${formatCurrency(entrada.valor)}\n`;
            if (entrada.data) report += `     Data: ${formatDate(entrada.data)}\n`;
            if (entrada.recorrente) report += `     [Recorrente]\n`;
          });
        }
      });

    report += '\nNOTA: Entradas extras são apenas informativas e não entram nos cálculos da projeção.\n';
  }

  report += '\n' + '='.repeat(70) + '\n';
  report += `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
  report += '='.repeat(70) + '\n';

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
