import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Plus, 
  Minus,
  Trash2, 
  TrendingUp, 
  LayoutDashboard,
  Sparkles,
  Edit,
  Download,
  Upload,
  Save,
  Settings,
  X,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff
} from 'lucide-react';
import Modal from './components/Modal';
import ChatInterface from './components/ChatInterface';
import ModalDetalhesMes from './components/ModalDetalhesMes';

export default function FinancialPlanner() {
  const getInitialState = () => {
    try {
      let saved = localStorage.getItem('assistenteFinanceiroData');
      
      if (!saved) {
        const oldData = localStorage.getItem('pcBuildData');
        if (oldData) {
          localStorage.setItem('assistenteFinanceiroData', oldData);
          saved = oldData;
        }
      }
      
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.estornos) parsed.estornos = [];
        if (!parsed.salariosRecebidos) parsed.salariosRecebidos = [];
        if (!parsed.entradasExtras) parsed.entradasExtras = [];
        if (!parsed.despesas) parsed.despesas = [];
        if (!parsed.despesasExtras) parsed.despesasExtras = [];
        if (parsed.despesas && Array.isArray(parsed.despesas)) {
          parsed.despesas = parsed.despesas.map(d => ({
            ...d,
            vezesRestantes: d.vezesRestantes !== undefined ? d.vezesRestantes : null,
            dataInicio: d.dataInicio || null
          }));
        }
        if (parsed.compras && Array.isArray(parsed.compras)) {
          parsed.compras = parsed.compras.map(c => ({
            ...c,
            oculta: c.oculta || false
          }));
        }
        if (parsed.entradasExtras && Array.isArray(parsed.entradasExtras)) {
          parsed.entradasExtras = parsed.entradasExtras.map(e => ({
            ...e,
            somarNoSaldo: e.somarNoSaldo !== undefined ? e.somarNoSaldo : false,
            recorrente: e.recorrente !== undefined ? e.recorrente : false,
            ativo: e.ativo !== undefined ? e.ativo : true
          }));
        }
        
        if (parsed.historicoIA && parsed.historicoIA.length > 0 && (!parsed.chats || parsed.chats.length === 0)) {
          const chatInicial = {
            id: `chat-${Date.now()}`,
            titulo: 'Conversa Inicial',
            criadoEm: new Date().toISOString(),
            mensagens: parsed.historicoIA.map(conv => [
              { id: `${conv.id}-user`, tipo: 'user', conteudo: conv.pergunta, data: conv.data },
              { id: `${conv.id}-assistant`, tipo: 'assistant', conteudo: conv.resposta, data: conv.data }
            ]).flat(),
            loading: false
          };
          parsed.chats = [chatInicial];
          parsed.chatAtivoId = chatInicial.id;
        } else if (!parsed.chats || parsed.chats.length === 0) {
          parsed.chats = [];
        }
        
        if (!parsed.chats || parsed.chats.length === 0) {
          const novoChat = {
            id: `chat-${Date.now()}`,
            titulo: 'Nova Conversa',
            criadoEm: new Date().toISOString(),
            mensagens: [],
            loading: false
          };
          parsed.chats = [novoChat];
          parsed.chatAtivoId = novoChat.id;
        } else if (!parsed.chatAtivoId) {
          parsed.chatAtivoId = parsed.chats[0].id;
        }
        
        return parsed;
      }
    } catch (error) {}
    
    const chatInicial = {
      id: `chat-${Date.now()}`,
      titulo: 'Nova Conversa',
      criadoEm: new Date().toISOString(),
      mensagens: [],
      loading: false
    };
    
    return {
      saldoAtual: 0,
      diaFechamento: 1,
      salarioMensal: 0,
      despesasFixas: 0,
      despesasVariaveis: 0,
      compras: [],
      estornos: [],
      entradasExtras: [],
      despesas: [],
      despesasExtras: [],
      apiKey: '',
      chats: [chatInicial],
      chatAtivoId: chatInicial.id,
      salariosRecebidos: [],
    };
  };

  const [data, setData] = useState(getInitialState);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingCompraId, setEditingCompraId] = useState(null);
  const [editingEstornoId, setEditingEstornoId] = useState(null);
  const [editingDespesaId, setEditingDespesaId] = useState(null);
  const [editingDespesaExtraId, setEditingDespesaExtraId] = useState(null);
  const [mesDetalhado, setMesDetalhado] = useState(null);
  const [editingEntradaId, setEditingEntradaId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null, type: 'confirm' });
  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem('assistenteFinanceiroHideValues') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('assistenteFinanceiroHideValues', hideValues);
  }, [hideValues]);

  useEffect(() => {
    try {
      localStorage.setItem('assistenteFinanceiroData', JSON.stringify(data));
    } catch (error) {}
  }, [data]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDisplay = (val) => {
    if (hideValues) return '••••••';
    return formatCurrency(val);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({
      show: true,
      message: message,
      onConfirm: onConfirm,
      type: 'confirm'
    });
  };

  const showAlert = (message) => {
    setConfirmModal({
      show: true,
      message: message,
      onConfirm: () => setConfirmModal({ show: false, message: '', onConfirm: null, type: 'alert' }),
      type: 'alert'
    });
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  const exportBackup = () => {
    try {
      const dataToExport = {
        saldoAtual: parseFloat(data.saldoAtual) || 0,
        diaFechamento: parseInt(data.diaFechamento) || 1,
        salarioMensal: parseFloat(data.salarioMensal) || 0,
        despesasFixas: parseFloat(data.despesasFixas) || 0,
        despesasVariaveis: parseFloat(data.despesasVariaveis) || 0,
        compras: Array.isArray(data.compras) ? data.compras : [],
        estornos: Array.isArray(data.estornos) ? data.estornos : [],
        entradasExtras: Array.isArray(data.entradasExtras) ? data.entradasExtras : [],
        despesas: Array.isArray(data.despesas) ? data.despesas : [],
        despesasExtras: Array.isArray(data.despesasExtras) ? data.despesasExtras : [],
        salariosRecebidos: Array.isArray(data.salariosRecebidos) ? data.salariosRecebidos : [],
        apiKey: '',
        chats: Array.isArray(data.chats) ? data.chats : [],
        chatAtivoId: data.chatAtivoId || null
      };
      
      const backup = {
        version: '1.1',
        data: dataToExport,
        timestamp: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString('pt-BR'),
        exportDate: new Date().toISOString().split('T')[0]
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      showAlert(`Erro ao exportar backup: ${error.message}`);
    }
  };

  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showAlert('Arquivo inválido. Por favor, selecione um arquivo JSON de backup.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        if (!backup || typeof backup !== 'object') {
          showAlert('Arquivo de backup inválido: formato incorreto.');
          event.target.value = '';
          return;
        }
        
        if (!backup.data) {
          showAlert('Arquivo de backup inválido: estrutura de dados não encontrada.');
          event.target.value = '';
          return;
        }

        const restoredData = backup.data;
        
        restoredData.saldoAtual = parseFloat(restoredData.saldoAtual) || 0;
        restoredData.salarioMensal = parseFloat(restoredData.salarioMensal) || 0;
        restoredData.diaFechamento = parseInt(restoredData.diaFechamento) || 1;
        restoredData.despesasFixas = parseFloat(restoredData.despesasFixas) || 0;
        restoredData.despesasVariaveis = parseFloat(restoredData.despesasVariaveis) || 0;
        
        if (!Array.isArray(restoredData.compras)) restoredData.compras = [];
        if (!Array.isArray(restoredData.estornos)) restoredData.estornos = [];
        if (!Array.isArray(restoredData.entradasExtras)) restoredData.entradasExtras = [];
        if (!Array.isArray(restoredData.despesas)) restoredData.despesas = [];
        if (!Array.isArray(restoredData.despesasExtras)) restoredData.despesasExtras = [];
        if (!Array.isArray(restoredData.salariosRecebidos)) restoredData.salariosRecebidos = [];
        
        let idCounter = Date.now();
        const generateUniqueId = () => {
          idCounter++;
          return idCounter;
        };
        
        restoredData.compras = restoredData.compras.map((c, idx) => ({
          id: c.id || generateUniqueId(),
          item: c.item || 'Item sem nome',
          data: c.data || new Date().toISOString().split('T')[0],
          valorTotal: parseFloat(c.valorTotal) || 0,
          parcelas: parseInt(c.parcelas) || 1,
          oculta: c.oculta === true
        }));
        
        restoredData.estornos = restoredData.estornos.map((e, idx) => ({
          id: e.id || generateUniqueId(),
          nome: e.nome || 'Estorno sem nome',
          mes: e.mes || new Date().toISOString().slice(0, 7),
          valor: parseFloat(e.valor) || 0
        }));
        
        restoredData.despesas = restoredData.despesas.map((d, idx) => ({
          id: d.id || generateUniqueId(),
          nome: d.nome || 'Despesa sem nome',
          valor: parseFloat(d.valor) || 0,
          vezesRestantes: d.vezesRestantes !== undefined && d.vezesRestantes !== null ? parseInt(d.vezesRestantes) : null,
          dataInicio: d.dataInicio || null,
          temLimite: d.temLimite === true || (d.vezesRestantes !== undefined && d.vezesRestantes !== null)
        }));
        
        restoredData.despesasExtras = restoredData.despesasExtras.map((d, idx) => ({
          id: d.id || generateUniqueId(),
          nome: d.nome || 'Despesa extra sem nome',
          valor: parseFloat(d.valor) || 0,
          mes: d.mes || new Date().toISOString().slice(0, 7),
          data: d.data || new Date().toISOString().split('T')[0],
          ativo: d.ativo !== undefined ? d.ativo !== false : true
        }));
        
        restoredData.entradasExtras = restoredData.entradasExtras.map((e, idx) => ({
          id: e.id || generateUniqueId(),
          nome: e.nome || 'Entrada extra sem nome',
          valor: parseFloat(e.valor) || 0,
          mes: e.mes || new Date().toISOString().slice(0, 7),
          data: e.data || new Date().toISOString().split('T')[0],
          recorrente: e.recorrente === true,
          somarNoSaldo: e.somarNoSaldo === true,
          ativo: e.ativo !== undefined ? e.ativo !== false : true
        }));
        
        restoredData.salariosRecebidos = restoredData.salariosRecebidos
          .filter(mes => mes && typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes))
          .map(mes => mes.trim());
        
        restoredData.apiKey = restoredData.apiKey || '';
        
        if (restoredData.historicoIA && Array.isArray(restoredData.historicoIA) && restoredData.historicoIA.length > 0 && (!restoredData.chats || restoredData.chats.length === 0)) {
          const chatInicial = {
            id: `chat-${Date.now()}`,
            titulo: 'Conversa Inicial',
            criadoEm: new Date().toISOString(),
            mensagens: restoredData.historicoIA.map(conv => [
              { id: `${conv.id || Date.now()}-user`, tipo: 'user', conteudo: conv.pergunta || '', data: conv.data || new Date().toISOString() },
              { id: `${conv.id || Date.now()}-assistant`, tipo: 'assistant', conteudo: conv.resposta || '', data: conv.data || new Date().toISOString() }
            ]).flat(),
            loading: false
          };
          restoredData.chats = [chatInicial];
          restoredData.chatAtivoId = chatInicial.id;
        } else if (!restoredData.chats || !Array.isArray(restoredData.chats) || restoredData.chats.length === 0) {
          const novoChat = {
            id: `chat-${Date.now()}`,
            titulo: 'Nova Conversa',
            criadoEm: new Date().toISOString(),
            mensagens: [],
            loading: false
          };
          restoredData.chats = [novoChat];
          restoredData.chatAtivoId = novoChat.id;
        } else {
          restoredData.chats = restoredData.chats.map(chat => ({
            id: chat.id || `chat-${Date.now()}-${Math.random()}`,
            titulo: chat.titulo || 'Nova Conversa',
            criadoEm: chat.criadoEm || new Date().toISOString(),
            mensagens: Array.isArray(chat.mensagens) ? chat.mensagens : [],
            loading: chat.loading === true
          }));
          
          if (!restoredData.chatAtivoId || !restoredData.chats.find(c => c.id === restoredData.chatAtivoId)) {
            restoredData.chatAtivoId = restoredData.chats[0].id;
          }
        }
        
        const dataToSet = {
          saldoAtual: restoredData.saldoAtual,
          diaFechamento: restoredData.diaFechamento,
          salarioMensal: restoredData.salarioMensal,
          despesasFixas: restoredData.despesasFixas,
          despesasVariaveis: restoredData.despesasVariaveis,
          compras: restoredData.compras,
          estornos: restoredData.estornos,
          entradasExtras: restoredData.entradasExtras,
          despesas: restoredData.despesas,
          despesasExtras: restoredData.despesasExtras,
          salariosRecebidos: restoredData.salariosRecebidos,
          apiKey: restoredData.apiKey,
          chats: restoredData.chats,
          chatAtivoId: restoredData.chatAtivoId
        };
        
        const confirmMessage = backup.dateFormatted 
          ? `Deseja restaurar o backup de ${backup.dateFormatted}?\n\nIsso irá substituir TODOS os dados atuais.\n\nVersão do backup: ${backup.version || 'desconhecida'}`
          : `Deseja restaurar este backup?\n\nIsso irá substituir TODOS os dados atuais.\n\nVersão do backup: ${backup.version || 'desconhecida'}`;
        
        showConfirm(confirmMessage, () => {
          setData(dataToSet);
          setConfirmModal({ show: false, message: '', onConfirm: null, type: 'confirm' });
          showAlert('Backup restaurado com sucesso!');
        });
      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        showAlert(`Erro ao restaurar backup: ${error.message}\n\nVerifique se o arquivo é um backup válido e tente novamente.`);
      } finally {
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      showAlert('Erro ao ler o arquivo. Por favor, tente novamente.');
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  const generateReport = () => {
    let report = '='.repeat(70) + '\n';
    report += 'RELATÓRIO FINANCEIRO COMPLETO - ASSISTENTE FINANCEIRO\n';
    report += '='.repeat(70) + '\n\n';
    
    report += 'INFORMAÇÕES BÁSICAS\n';
    report += '-'.repeat(70) + '\n';
    report += `Saldo Atual: ${formatCurrency(parseFloat(data.saldoAtual) || 0)}\n`;
    report += `Renda Passiva Mensal: ${formatCurrency(parseFloat(data.salarioMensal) || 0)}\n`;
    
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const totalDespesasFixasAtivas = (data.despesas || []).reduce((sum, d) => {
      if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
        return sum + parseFloat(d.valor || 0);
      }
      const vezesRestantesInicial = parseInt(d.vezesRestantes) || 0;
      if (d.dataInicio) {
        const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
        const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
        if (mesAtual < inicioDate) return sum;
        const mesesPassados = (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 + 
                              (mesAtual.getMonth() - inicioDate.getMonth());
        if (vezesRestantesInicial - mesesPassados > 0) {
          return sum + parseFloat(d.valor || 0);
        }
      } else if (vezesRestantesInicial > 0) {
        return sum + parseFloat(d.valor || 0);
      }
      return sum;
    }, 0);
    
    report += `Despesas Fixas Ativas: ${formatCurrency(totalDespesasFixasAtivas)}\n`;
    if (totalDespesasFixasAtivas === 0 && (parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0)) > 0) {
      report += `(Valor legado: ${formatCurrency(parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0))})\n`;
    }
    report += `Dia de Fechamento do Cartão: ${data.diaFechamento}\n`;
    
    if (data.salariosRecebidos && data.salariosRecebidos.length > 0) {
      report += `\nSalários Já Recebidos (${data.salariosRecebidos.length}):\n`;
      data.salariosRecebidos.sort().forEach(mes => {
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
      timeline.forEach((month, idx) => {
        report += `\n${month.name}:\n`;
        report += `  Entradas: ${formatCurrency(month.income)}\n`;
        report += `  Fatura do Cartão: ${formatCurrency(month.cardBill)}\n`;
        report += `  Despesas Fixas: ${formatCurrency(month.expenses)}\n`;
        report += `  Sobra Mensal: ${formatCurrency(month.netResult)}\n`;
        report += `  Saldo Acumulado: ${formatCurrency(month.finalBalance)}\n`;
        if (month.salarioJaRecebido) {
          report += `  [Salário já recebido - mês excluído da projeção]\n`;
        }
      });
    }
    
    report += '\n' + '='.repeat(70) + '\n';
    
    report += 'COMPRAS PARCELADAS\n';
    report += '-'.repeat(70) + '\n';
    const todasCompras = data.compras || [];
    const comprasVisiveis = todasCompras.filter(c => !c.oculta);
    const comprasOcultas = todasCompras.filter(c => c.oculta);
    
    if (comprasVisiveis.length === 0 && comprasOcultas.length === 0) {
      report += 'Nenhuma compra registrada.\n';
    } else {
      if (comprasVisiveis.length > 0) {
        comprasVisiveis.forEach((compra, idx) => {
          const parcelaAtual = calculateParcelaAtual(compra);
          const valorParcela = parseFloat(compra.valorTotal) / parseFloat(compra.parcelas);
          const parcelasRestantes = parseFloat(compra.parcelas) - parcelaAtual + 1;
          
          report += `\n${idx + 1}. ${compra.item}\n`;
          report += `   Data da Compra: ${formatDate(compra.data)}\n`;
          report += `   Valor Total: ${formatCurrency(compra.valorTotal)}\n`;
          report += `   Parcelas: ${compra.parcelas}x de ${formatCurrency(valorParcela)}\n`;
          report += `   Parcela Atual: ${parcelaAtual}/${compra.parcelas}\n`;
          report += `   Parcelas Restantes: ${parcelasRestantes > 0 ? parcelasRestantes : 0}\n`;
          
          const [year, month, day] = compra.data.split('-').map(Number);
          let faturaMonth = month - 1;
          let faturaYear = year;
          if (day >= parseInt(data.diaFechamento)) {
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
      const estornosVisiveis = data.estornos.filter(e => !data.salariosRecebidos?.includes(e.mes));
      const estornosAplicados = data.estornos.filter(e => data.salariosRecebidos?.includes(e.mes));
      
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
          const vezesRestantesInicial = parseInt(despesa.vezesRestantes) || 0;
          
          if (despesa.dataInicio) {
            const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
            const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
            const nomeInicio = inicioDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            report += `   Data de Início: ${nomeInicio} (${despesa.dataInicio})\n`;
            
            if (mesAtual >= inicioDate) {
              const mesesPassados = (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 + 
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
    const despesasExtrasAtivas = (data.despesasExtras || []).filter(d => d.ativo !== false);
    const despesasExtrasInativas = (data.despesasExtras || []).filter(d => d.ativo === false);
    
    if (despesasExtrasAtivas.length === 0 && despesasExtrasInativas.length === 0) {
      report += 'Nenhuma despesa extra registrada.\n';
    } else {
      const despesasPorMes = {};
      (data.despesasExtras || []).forEach(despesa => {
        if (!despesasPorMes[despesa.mes]) {
          despesasPorMes[despesa.mes] = { ativas: [], inativas: [] };
        }
        if (despesa.ativo === false) {
          despesasPorMes[despesa.mes].inativas.push(despesa);
        } else {
          despesasPorMes[despesa.mes].ativas.push(despesa);
        }
      });
      
      Object.keys(despesasPorMes).sort().forEach(mes => {
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
    const entradasAtivas = (data.entradasExtras || []).filter(e => e.ativo !== false);
    const entradasInativas = (data.entradasExtras || []).filter(e => e.ativo === false);
    
    if (entradasAtivas.length === 0 && entradasInativas.length === 0) {
      report += 'Nenhuma entrada extra registrada.\n';
    } else {
      const entradasPorMes = {};
      (data.entradasExtras || []).forEach(entrada => {
        if (!entradasPorMes[entrada.mes]) {
          entradasPorMes[entrada.mes] = { ativas: [], inativas: [] };
        }
        if (entrada.ativo === false) {
          entradasPorMes[entrada.mes].inativas.push(entrada);
        } else {
          entradasPorMes[entrada.mes].ativas.push(entrada);
        }
      });
      
      Object.keys(entradasPorMes).sort().forEach(mes => {
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
  };

  const addCompra = (compra) => {
    if (editingCompraId) {
      setData(prev => ({
        ...prev,
        compras: prev.compras.map(c => 
          c.id === editingCompraId 
            ? { ...compra, id: editingCompraId, oculta: c.oculta || false }
            : c
        )
      }));
      setEditingCompraId(null);
    } else {
      setData(prev => ({
        ...prev,
        compras: [...prev.compras, { ...compra, id: Date.now(), oculta: false }]
      }));
    }
    setShowModal(false);
  };

  const editCompra = (compra) => {
    setEditingCompraId(compra.id);
    setModalType('compra');
    setShowModal(true);
  };

  const removeItem = (id) => {
    setData(prev => ({ ...prev, compras: prev.compras.filter(c => c.id !== id) }));
  };

  const addEstorno = (estorno) => {
    if (editingEstornoId) {
      setData(prev => ({
        ...prev,
        estornos: prev.estornos.map(e => 
          e.id === editingEstornoId 
            ? { ...estorno, id: editingEstornoId }
            : e
        )
      }));
      setEditingEstornoId(null);
    } else {
      setData(prev => ({
        ...prev,
        estornos: [...prev.estornos, { ...estorno, id: Date.now() }]
      }));
    }
    setShowModal(false);
  };

  const addDespesa = (despesa) => {
    if (editingDespesaId) {
      setData(prev => ({
        ...prev,
        despesas: prev.despesas.map(d => 
          d.id === editingDespesaId 
            ? { ...despesa, id: editingDespesaId }
            : d
        )
      }));
      setEditingDespesaId(null);
    } else {
      setData(prev => ({
        ...prev,
        despesas: [...(prev.despesas || []), { ...despesa, id: Date.now() }]
      }));
    }
    setShowModal(false);
  };

  const editDespesa = (despesa) => {
    setEditingDespesaId(despesa.id);
    setModalType('despesa');
    setShowModal(true);
  };

  const removeDespesa = (id) => {
    setData(prev => ({ ...prev, despesas: (prev.despesas || []).filter(d => d.id !== id) }));
  };

  const editEstorno = (estorno) => {
    setEditingEstornoId(estorno.id);
    setModalType('estorno');
    setShowModal(true);
  };

  const removeEstorno = (id) => {
    setData(prev => ({ ...prev, estornos: prev.estornos.filter(e => e.id !== id) }));
  };

  const addEntradaExtra = (entrada) => {
    if (editingEntradaId) {
      setData(prev => ({
        ...prev,
        entradasExtras: prev.entradasExtras.map(e => 
          e.id === editingEntradaId 
            ? { ...entrada, id: editingEntradaId }
            : e
        )
      }));
      setEditingEntradaId(null);
    } else {
      setData(prev => ({
        ...prev,
        entradasExtras: [...(prev.entradasExtras || []), { ...entrada, id: Date.now(), ativo: true }]
      }));
    }
    setShowModal(false);
  };

  const editEntradaExtra = (entrada) => {
    setEditingEntradaId(entrada.id);
    setModalType('entradaExtra');
    setShowModal(true);
  };

  const removeEntradaExtra = (id) => {
    setData(prev => ({ ...prev, entradasExtras: prev.entradasExtras.filter(e => e.id !== id) }));
  };

  const toggleEntradaAtiva = (id) => {
    setData(prev => ({
      ...prev,
      entradasExtras: prev.entradasExtras.map(e => 
        e.id === id ? { ...e, ativo: !e.ativo } : e
      )
    }));
  };

  const addDespesaExtra = (despesaExtra) => {
    if (editingDespesaExtraId) {
      setData(prev => ({
        ...prev,
        despesasExtras: (prev.despesasExtras || []).map(d => 
          d.id === editingDespesaExtraId 
            ? { ...despesaExtra, id: editingDespesaExtraId }
            : d
        )
      }));
      setEditingDespesaExtraId(null);
    } else {
      setData(prev => ({
        ...prev,
        despesasExtras: [...(prev.despesasExtras || []), { ...despesaExtra, id: Date.now(), ativo: true }]
      }));
    }
    setShowModal(false);
    setMesDetalhado(null);
  };

  const editDespesaExtra = (despesaExtra) => {
    setEditingDespesaExtraId(despesaExtra.id);
    setModalType('despesaExtra');
    setShowModal(true);
  };

  const removeDespesaExtra = (id) => {
    setData(prev => ({ ...prev, despesasExtras: (prev.despesasExtras || []).filter(d => d.id !== id) }));
  };

  const toggleDespesaExtraAtiva = (id) => {
    setData(prev => ({
      ...prev,
      despesasExtras: (prev.despesasExtras || []).map(d => 
        d.id === id ? { ...d, ativo: !d.ativo } : d
      )
    }));
  };

  const clearAll = () => {
    showConfirm("Tem certeza que deseja apagar todos os dados?", () => {
      const chatInicial = {
        id: `chat-${Date.now()}`,
        titulo: 'Nova Conversa',
        criadoEm: new Date().toISOString(),
        mensagens: [],
        loading: false
      };
      
      setData({
        saldoAtual: 0,
        diaFechamento: 1,
        salarioMensal: 0,
        despesasFixas: 0,
        despesasVariaveis: 0,
        compras: [],
        estornos: [],
        apiKey: data.apiKey || '',
        chats: [chatInicial],
        chatAtivoId: chatInicial.id,
      });
      setConfirmModal({ show: false, message: '', onConfirm: null, type: 'confirm' });
    });
  };

  const calculateTimeline = () => {
    const months = [];
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
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

      let income = parseFloat(data.salarioMensal);
      
      if (monthsAdded === 0) {
        let saldoInicial = parseFloat(data.saldoAtual);
        income += saldoInicial;
      }

      const totalDespesasCadastradas = (data.despesas || []).reduce((sum, d) => {
        if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
          return sum + parseFloat(d.valor || 0);
        }
        
        const vezesRestantesInicial = parseInt(d.vezesRestantes) || 0;
        
        if (d.dataInicio) {
          const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
          const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
          const mesAtualDate = new Date(date.getFullYear(), date.getMonth(), 1);
          
          if (mesAtualDate < inicioDate) {
            return sum;
          }
          
          const mesesPassados = (mesAtualDate.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                (mesAtualDate.getMonth() - inicioDate.getMonth());
          const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
          
          if (vezesRestantesAgora > 0) {
            return sum + parseFloat(d.valor || 0);
          }
        } else {
          const vezesRestantesAgora = vezesRestantesInicial - monthsAdded;
          if (vezesRestantesAgora > 0) {
            return sum + parseFloat(d.valor || 0);
          }
        }
        
        return sum;
      }, 0);
      let expenses = totalDespesasCadastradas > 0 
        ? totalDespesasCadastradas 
        : parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0);
      
      let cardBill = 0;
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
        
        const currentMonthIter = date.getMonth();
        const currentYearIter = date.getFullYear();
        const monthsDiff = (currentYearIter - faturaCompetenciaYear) * 12 + (currentMonthIter - faturaCompetenciaMonth);
        
        if (monthsDiff >= 0 && monthsDiff < compra.parcelas) {
          cardBill += parseFloat(compra.valorTotal) / parseFloat(compra.parcelas);
        }
      });

      data.estornos.forEach(estorno => {
        const [estornoYear, estornoMonth] = estorno.mes.split('-').map(Number);
        const estornoMonthIndex = estornoMonth - 1;
        const monthIndex = date.getMonth();
        const yearIndex = date.getFullYear();
        
        if (estornoYear === yearIndex && estornoMonthIndex === monthIndex) {
          cardBill -= parseFloat(estorno.valor);
        }
      });

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
        finalBalance: accumulatedBalance 
      });
      
      monthsAdded++;
      i++;
    }
    return months;
  };

  const calculateParcelaAtual = (compra) => {
    const today = new Date();
    const [year, month, day] = compra.data.split('-').map(Number);
    
    let faturaMonth = month - 1;
    let faturaYear = year;
    
    if (day >= parseInt(data.diaFechamento)) {
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
  };

  const shouldShowCompra = (compra) => {
    const parcelaAtual = calculateParcelaAtual(compra);
    
    if (parcelaAtual > compra.parcelas) return false;
    
    if (parcelaAtual === compra.parcelas) {
      const [year, month, day] = compra.data.split('-').map(Number);
      let faturaMonth = month - 1;
      let faturaYear = year;
      
      // Ajuste inicial do fechamento
      if (day >= parseInt(data.diaFechamento)) {
        faturaMonth++;
        if (faturaMonth > 11) {
          faturaMonth = 0;
          faturaYear++;
        }
      }
      
      faturaMonth += (parcelaAtual - 1);
      while (faturaMonth > 11) {
        faturaMonth -= 12;
        faturaYear++;
      }
      
      const faturaKey = `${faturaYear}-${String(faturaMonth + 1).padStart(2, '0')}`;
      
      if (data.salariosRecebidos?.includes(faturaKey)) {
        return false;
      }
    }
    
    return true;
  };

  const timeline = calculateTimeline();

  const isMesAtencao = (month) => {
    return month.netResult < 0 || month.finalBalance < 0 || month.netResult < 500;
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-indigo-500/30 pb-20">
      {confirmModal.show && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && confirmModal.type === 'alert') {
              setConfirmModal({ show: false, message: '', onConfirm: null, type: 'alert' });
            }
          }}
        >
          <div className="bg-zinc-900/90 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl ring-1 ring-white/10">
            <div className="flex items-start gap-4 mb-4">
              {confirmModal.type === 'alert' ? (
                <div className="bg-amber-500/20 p-3 rounded-full ring-1 ring-amber-500/30">
                  <AlertTriangle size={24} className="text-amber-400" />
                </div>
              ) : (
                <div className="bg-indigo-500/20 p-3 rounded-full ring-1 ring-indigo-500/30">
                  <AlertTriangle size={24} className="text-indigo-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  {confirmModal.type === 'alert' ? 'Atenção' : 'Confirmar ação'}
                </h3>
                <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {confirmModal.type === 'confirm' && (
                <button 
                  onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null, type: 'confirm' })}
                  className="flex-1 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-white/5 hover:border-white/10 transition-all font-medium"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  } else {
                    setConfirmModal({ show: false, message: '', onConfirm: null, type: confirmModal.type });
                  }
                }}
                className={`flex-1 p-3 rounded-xl text-white font-semibold transition-all shadow-lg ${
                  confirmModal.type === 'alert' 
                    ? 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20' 
                    : 'bg-rose-600 hover:bg-rose-500 hover:shadow-rose-500/20'
                }`}
              >
                {confirmModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'ai' && (
        <ChatInterface
          data={data}
          setData={setData}
          showModal={showModal}
          setShowModal={setShowModal}
          aiLoading={aiLoading}
          setAiLoading={setAiLoading}
          formatCurrency={formatCurrency}
          timeline={timeline}
          comprasVisiveis={data.compras.filter(c => !c.oculta && shouldShowCompra(c))}
          estornosVisiveis={data.estornos.filter(e => !data.salariosRecebidos.includes(e.mes))}
        />
      )}

      <ModalDetalhesMes
        showModal={mesDetalhado !== null}
        setShowModal={(show) => !show && setMesDetalhado(null)}
        monthKey={mesDetalhado}
        monthName={mesDetalhado ? timeline.find(m => m.monthKey === mesDetalhado)?.name || '' : ''}
        data={data}
        addEntradaExtra={addEntradaExtra}
        editEntradaExtra={editEntradaExtra}
        removeEntradaExtra={removeEntradaExtra}
        toggleEntradaAtiva={toggleEntradaAtiva}
        addDespesaExtra={addDespesaExtra}
        editDespesaExtra={editDespesaExtra}
        removeDespesaExtra={removeDespesaExtra}
        toggleDespesaExtraAtiva={toggleDespesaExtraAtiva}
        editDespesa={editDespesa}
        removeDespesa={removeDespesa}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        setEditingEntradaId={setEditingEntradaId}
        setEditingDespesaExtraId={setEditingDespesaExtraId}
        setEditingDespesaId={setEditingDespesaId}
        setModalType={setModalType}
        setShowMainModal={setShowModal}
      />

      <Modal
        showModal={showModal && modalType !== 'ai' && modalType !== 'detalhesMes'}
        setShowModal={(show) => {
          setShowModal(show);
          if (!show && (modalType === 'entradaExtra' || modalType === 'despesaExtra')) {
            setMesDetalhado(null);
          }
        }}
        modalType={modalType}
        addCompra={addCompra}
        addEstorno={addEstorno}
        addDespesa={addDespesa}
        addEntradaExtra={addEntradaExtra}
        addDespesaExtra={addDespesaExtra}
        setData={setData}
        editingCompraId={editingCompraId}
        editingEstornoId={editingEstornoId}
        editingDespesaId={editingDespesaId}
        editingDespesaExtraId={editingDespesaExtraId}
        editingEntradaId={editingEntradaId}
        compraParaEditar={editingCompraId ? data.compras.find(c => c.id === editingCompraId) : null}
        estornoParaEditar={editingEstornoId ? data.estornos.find(e => e.id === editingEstornoId) : null}
        despesaParaEditar={editingDespesaId ? (data.despesas || []).find(d => d.id === editingDespesaId) : null}
        despesaExtraParaEditar={editingDespesaExtraId ? (data.despesasExtras || []).find(d => d.id === editingDespesaExtraId) : null}
        entradaParaEditar={editingEntradaId ? data.entradasExtras?.find(e => e.id === editingEntradaId) : null}
        setEditingCompraId={setEditingCompraId}
        setEditingEstornoId={setEditingEstornoId}
        setEditingDespesaId={setEditingDespesaId}
        setEditingDespesaExtraId={setEditingDespesaExtraId}
        setEditingEntradaId={setEditingEntradaId}
        data={data}
        mesParaEntrada={mesDetalhado}
      />
      
      <header className="bg-zinc-950/70 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 supports-[backdrop-filter]:bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <LayoutDashboard size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent hidden sm:block tracking-tight">
              Assistente Financeiro
            </h1>
          </div>
          
          <div className="flex gap-3 items-center">
             <button 
                onClick={() => setHideValues(!hideValues)} 
                className={`p-2.5 rounded-xl transition-colors border ${hideValues ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-100 border-transparent hover:border-white/5'}`} 
                title={hideValues ? "Mostrar valores" : "Ocultar valores"}
             >
                 {hideValues ? <EyeOff size={20} /> : <Eye size={20} />}
             </button>
             
             <button onClick={() => { setEditingCompraId(null); setModalType('compra'); setShowModal(true); }} 
                 className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-white/5">
                 <Plus size={18} strokeWidth={2.5} /> 
                 <span className="hidden sm:inline">Parcelar</span>
             </button>
             
             <button onClick={() => { setEditingEstornoId(null); setModalType('estorno'); setShowModal(true); }} 
                 className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-emerald-500/20">
                 <Plus size={18} /> 
                 <span className="hidden sm:inline">Estorno</span>
             </button>
              
             <button onClick={() => { setEditingDespesaId(null); setModalType('despesa'); setShowModal(true); }} 
                 className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-rose-500/20">
                 <Plus size={18} /> 
                 <span className="hidden sm:inline">Despesa</span>
             </button>

             <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

             <button onClick={exportBackup} className="p-2.5 hover:bg-blue-500/10 text-zinc-400 hover:text-blue-400 rounded-xl transition border border-transparent hover:border-blue-500/20" title="Exportar Backup">
                <Save size={20} />
             </button>
             <label className="p-2.5 hover:bg-purple-500/10 text-zinc-400 hover:text-purple-400 rounded-xl transition border border-transparent hover:border-purple-500/20 cursor-pointer" title="Importar Backup">
                <Upload size={20} />
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importBackup} 
                  className="hidden" 
                />
             </label>
             <button onClick={generateReport} className="p-2.5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 rounded-xl transition border border-transparent hover:border-emerald-500/20" title="Exportar Relatório">
                <Download size={20} />
             </button>
             <button onClick={clearAll} className="p-2.5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-xl transition border border-transparent hover:border-rose-500/20" title="Limpar Tudo">
                <Trash2 size={20} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Saldo Atual</label>
                <div className="flex items-center gap-1 relative">
                    <span className="text-white text-3xl font-bold">R$</span>
                    <input 
                      type={hideValues ? "password" : "number"} 
                      step="0.01" 
                      className="bg-transparent text-3xl font-bold text-white w-full focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-zinc-700" 
                      value={data.saldoAtual} 
                      onChange={e => setData({...data, saldoAtual: e.target.value})} 
                    />
                </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/20"></div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Renda Passiva</label>
                <div className="flex items-center gap-1 relative">
                    <span className="text-emerald-400 text-3xl font-bold">R$</span>
                    <input 
                      type={hideValues ? "password" : "number"} 
                      step="0.01" 
                      className="bg-transparent text-3xl font-bold text-emerald-400 w-full focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-zinc-700" 
                      value={data.salarioMensal} 
                      onChange={e => setData({...data, salarioMensal: e.target.value})} 
                    />
                </div>
            </div>

             <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-rose-500/20"></div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Despesas Fixas</label>
                <div className="flex items-center gap-1 relative">
                    <span className="text-rose-400 text-3xl font-bold">R$</span>
                    <div className="bg-transparent text-3xl font-bold text-rose-400 w-full">
                      {hideValues ? '••••' : Math.round((data.despesas || []).reduce((sum, d) => {
                        if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
                          return sum + parseFloat(d.valor || 0);
                        }
                        
                        const vezesRestantesInicial = parseInt(d.vezesRestantes) || 0;
                        const hoje = new Date();
                        const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                        
                        if (d.dataInicio) {
                          const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
                          const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                          
                          if (mesAtual < inicioDate) {
                            return sum;
                          }
                          
                          const mesesPassados = (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                                (mesAtual.getMonth() - inicioDate.getMonth());
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
                      }, 0) || parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0))}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-violet-500/20"></div>
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 block">Fechamento Cartão de Crédito</label>
                <div className="flex items-center gap-3 relative">
                    <div className="p-2 rounded-lg bg-zinc-800/50 text-indigo-400">
                      <Calendar size={20} />
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      max="31" 
                      className="bg-transparent text-3xl font-bold text-white w-full focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-zinc-700" 
                      value={data.diaFechamento} 
                      onChange={e => setData({...data, diaFechamento: e.target.value})} 
                    />
                </div>
            </div>
        </div>

        <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400">
                    <TrendingUp size={24} /> 
                  </div>
                  Projeção Financeira
              </h2>
              <span className="text-sm text-zinc-500 font-medium bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
                Próximos 12 meses
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {timeline.map((month, idx) => {
                  const handleMarcarSalarioRecebido = () => {
                    if (month.salarioJaRecebido) return;
                    
                    setData(prev => {
                      const novosSalariosRecebidos = [...(prev.salariosRecebidos || []), month.monthKey];
                      const novoSaldoAtual = parseFloat(prev.saldoAtual) + parseFloat(prev.salarioMensal);
                      
                      return {
                        ...prev,
                        salariosRecebidos: novosSalariosRecebidos,
                        saldoAtual: novoSaldoAtual
                      };
                    });
                  };
                  
                  return (
                    <div 
                      key={idx} 
                      className={`
                        glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer
                        ${isMesAtencao(month) 
                          ? 'bg-rose-950/5 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-950/10' 
                          : 'border-white/5 hover:border-emerald-500/30'
                        }
                      `}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => setMesDetalhado(month.monthKey)}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="font-bold text-lg text-white mb-1">{month.name.split(' de ')[0]}</h3>
                              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{month.name.split(' de ')[1]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isMesAtencao(month) ? 
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">ATENÇÃO</span> : 
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">OK</span>
                                }
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEntradaId(null);
                                    setModalType('entradaExtra');
                                    setShowModal(true);
                                    setMesDetalhado(month.monthKey);
                                  }}
                                  className="p-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/30 z-10"
                                  title="Adicionar entrada extra"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDespesaExtraId(null);
                                    setModalType('despesaExtra');
                                    setShowModal(true);
                                    setMesDetalhado(month.monthKey);
                                  }}
                                  className="p-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg transition shadow-lg shadow-rose-900/20 hover:shadow-rose-500/30 z-10"
                                  title="Adicionar despesa extra"
                                >
                                  <Minus size={14} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                <span>Entradas</span>
                                <span className="text-emerald-400 font-medium">+{formatDisplay(month.income)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                <span>Fatura Cartão</span>
                                <span className="text-rose-400 font-medium">-{formatDisplay(month.cardBill)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                <span>Despesas</span>
                                <span className="text-rose-400 font-medium">-{formatDisplay(month.expenses)}</span>
                            </div>
                            
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3"></div>
                            
                            <div className="flex justify-between font-bold text-base items-end">
                                <span className="text-zinc-300">Sobra</span>
                                <span className={`${isMesAtencao(month) ? 'text-rose-500 text-lg' : 'text-indigo-400 text-lg'} text-glow`}>
                                    {formatDisplay(month.netResult)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs pt-1">
                                <span className="text-zinc-600">Acumulado</span>
                                <span className={`font-medium ${month.finalBalance >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                    {formatDisplay(month.finalBalance)}
                                </span>
                            </div>
                            
                            {idx === 0 && (
                              <div className="pt-4 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarcarSalarioRecebido();
                                    }}
                                    disabled={month.salarioJaRecebido}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                      month.salarioJaRecebido
                                        ? 'bg-emerald-500/10 text-emerald-500/70 cursor-not-allowed border border-emerald-500/10'
                                        : 'bg-white/5 hover:bg-indigo-600 text-zinc-300 hover:text-white border border-white/10 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20'
                                    }`}
                                  >
                                    {month.salarioJaRecebido ? (
                                      <>
                                        <CheckCircle2 size={16} />
                                        <span>Renda Recebida</span>
                                      </>
                                    ) : (
                                      <>
                                        <Circle size={16} />
                                        <span>Marcar Renda Recebida</span>
                                      </>
                                    )}
                                  </button>
                              </div>
                            )}
                        </div>
                    </div>
                  );
                })}
            </div>
        </section>

        <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                              <CreditCard size={20} />
                            </div>
                            Parcelados
                        </h3>
                        <button
                            onClick={() => {
                                setEditingCompraId(null);
                                setModalType('compra');
                                setShowModal(true);
                            }}
                            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-900/20"
                            title="Adicionar Parcelado"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
                        {(() => {
                            const comprasAtivas = data.compras.filter(compra => shouldShowCompra(compra));

                            if (comprasAtivas.length === 0) {
                                return (
                                    <div className="p-12 text-center flex flex-col items-center gap-3 text-zinc-500">
                                        <CreditCard size={48} strokeWidth={1} className="opacity-20" />
                                        <p>Nenhuma compra ativa.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-1">
                                    {comprasAtivas.map(compra => {
                                        const isOculta = compra.oculta || false;
                                        const parcelaAtual = calculateParcelaAtual(compra);
                                        
                                        return (
                                            <div key={compra.id} className={`p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition group border border-transparent hover:border-white/5 ${isOculta ? 'opacity-50' : ''}`}>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-medium truncate flex items-center gap-2 ${isOculta ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                                      {compra.item}
                                                    </h4>
                                                    <p className={`text-xs mt-1 flex items-center gap-2 ${isOculta ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{formatDate(compra.data)}</span>
                                                        <span>{compra.parcelas}x de {formatDisplay(compra.valorTotal / compra.parcelas)}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 ml-4">
                                                    {!isOculta && parcelaAtual > 0 && parcelaAtual <= compra.parcelas && (
                                                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg whitespace-nowrap" title="Parcela Atual">
                                                        {parcelaAtual}/{compra.parcelas}
                                                      </span>
                                                    )}
                                                    
                                                    <span className={`text-sm font-bold whitespace-nowrap ${isOculta ? 'text-zinc-600' : 'text-white'}`}>{formatDisplay(compra.valorTotal)}</span>
                                                    
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button 
                                                          onClick={() => {
                                                              setData(prev => ({
                                                                  ...prev,
                                                                  compras: prev.compras.map(c => 
                                                                      c.id === compra.id 
                                                                          ? { ...c, oculta: !c.oculta }
                                                                          : c
                                                                  )
                                                              }));
                                                          }}
                                                          className={`p-1.5 rounded-lg transition ${isOculta ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                                                          title={isOculta ? "Mostrar compra" : "Ocultar compra"}
                                                      >
                                                          {isOculta ? <EyeOff size={16} /> : <Eye size={16} />}
                                                      </button>
                                                      <button onClick={() => editCompra(compra)} className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition" title="Editar">
                                                          <Edit size={16} />
                                                      </button>
                                                      <button onClick={() => removeItem(compra.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Remover">
                                                          <Trash2 size={16} />
                                                      </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                              <TrendingUp size={20} />
                            </div>
                            Estornados
                        </h3>
                        <button
                            onClick={() => {
                                setEditingEstornoId(null);
                                setModalType('estorno');
                                setShowModal(true);
                            }}
                            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/20"
                            title="Adicionar Estorno"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
                        {(() => {
                            const estornosVisiveis = data.estornos.filter(e => !data.salariosRecebidos.includes(e.mes));
                            
                            if (estornosVisiveis.length === 0) {
                                return (
                                    <div className="p-12 text-center flex flex-col items-center gap-3 text-zinc-500">
                                        <TrendingUp size={48} strokeWidth={1} className="opacity-20" />
                                        <p>Nenhum estorno pendente.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-1">
                                    {estornosVisiveis.map(estorno => (
                                        <div key={estorno.id} className="p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition group border border-transparent hover:border-white/5">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-zinc-200 truncate">{estorno.nome}</h4>
                                                <p className="text-xs text-zinc-500 mt-1 bg-white/5 inline-block px-1.5 py-0.5 rounded">
                                                    Mês: {estorno.mes}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 ml-4">
                                                <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">+{formatDisplay(estorno.valor)}</span>
                                                
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => editEstorno(estorno)} className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition" title="Editar">
                                                      <Edit size={16} />
                                                  </button>
                                                  <button onClick={() => removeEstorno(estorno.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Remover">
                                                      <Trash2 size={16} />
                                                  </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                              <Minus size={20} />
                            </div>
                            Despesas
                        </h3>
                        <button
                            onClick={() => {
                                setEditingDespesaId(null);
                                setModalType('despesa');
                                setShowModal(true);
                            }}
                            className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-900/20"
                            title="Adicionar Despesa"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
                        {(() => {
                            const hoje = new Date();
                            const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                            
                            const despesasAtivas = (data.despesas || []).filter(d => {
                              if (d.vezesRestantes === null || d.vezesRestantes === undefined) {
                                return true;
                              }
                              
                              const vezesRestantesInicial = parseInt(d.vezesRestantes) || 0;
                              
                              if (d.dataInicio) {
                                const [inicioAno, inicioMes] = d.dataInicio.split('-').map(Number);
                                const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                                
                                if (mesAtual < inicioDate) {
                                  return true;
                                }
                                
                                const mesesPassados = (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                                      (mesAtual.getMonth() - inicioDate.getMonth());
                                const vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
                                
                                return vezesRestantesAgora > 0;
                              }
                              
                              return vezesRestantesInicial > 0;
                            });
                            
                            if (despesasAtivas.length === 0) {
                                return (
                                    <div className="p-12 text-center flex flex-col items-center gap-3 text-zinc-500">
                                        <Minus size={48} strokeWidth={1} className="opacity-20" />
                                        <p>Nenhuma despesa cadastrada.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-1">
                                    {despesasAtivas.map(despesa => {
                                      const temLimite = despesa.vezesRestantes !== undefined && despesa.vezesRestantes !== null;
                                      const vezesRestantesInicial = temLimite ? parseInt(despesa.vezesRestantes) : null;
                                      
                                      let vezesRestantesAgora = vezesRestantesInicial;
                                      if (temLimite && despesa.dataInicio) {
                                        const hoje = new Date();
                                        const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                                        const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
                                        const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                                        
                                        if (mesAtual >= inicioDate) {
                                          const mesesPassados = (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                                                (mesAtual.getMonth() - inicioDate.getMonth());
                                          vezesRestantesAgora = vezesRestantesInicial - mesesPassados;
                                        }
                                      }
                                      
                                      const deveMostrar = !temLimite || (vezesRestantesAgora !== null && vezesRestantesAgora > 0);
                                      
                                      if (!deveMostrar) return null;
                                      
                                      const decrementarVezes = () => {
                                        if (temLimite && vezesRestantesAgora > 0) {
                                          const novasVezes = vezesRestantesAgora - 1;
                                          if (novasVezes === 0) {
                                            removeDespesa(despesa.id);
                                          } else {
                                            const hoje = new Date();
                                            const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                                            let vezesRestantesParaSalvar = novasVezes;
                                            
                                            if (despesa.dataInicio) {
                                              const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
                                              const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                                              const mesesPassados = (mesAtual.getFullYear() - inicioDate.getFullYear()) * 12 + 
                                                                    (mesAtual.getMonth() - inicioDate.getMonth());
                                              vezesRestantesParaSalvar = novasVezes + mesesPassados;
                                            }
                                            
                                            setData(prev => ({
                                              ...prev,
                                              despesas: prev.despesas.map(d => 
                                                d.id === despesa.id 
                                                  ? { ...d, vezesRestantes: vezesRestantesParaSalvar }
                                                  : d
                                              )
                                            }));
                                          }
                                        }
                                      };
                                      
                                      return (
                                        <div key={despesa.id} className="p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition group border border-transparent hover:border-white/5">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                  <h4 className="font-medium text-zinc-200 truncate">{despesa.nome}</h4>
                                                  {temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap">
                                                      Falta {vezesRestantesAgora}x
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                  <p className="text-xs text-zinc-500">
                                                      {formatDisplay(despesa.valor)}/mês
                                                  </p>
                                                  {temLimite && despesa.dataInicio && (
                                                    <span className="text-xs text-zinc-500">
                                                      • Início: {formatDate(despesa.dataInicio)}
                                                    </span>
                                                  )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                                                  <button 
                                                    onClick={decrementarVezes}
                                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition opacity-0 group-hover:opacity-100 border border-transparent hover:border-emerald-500/30" 
                                                    title="Marcar como pago (decrementar)"
                                                  >
                                                    <CheckCircle2 size={16} />
                                                  </button>
                                                )}
                                                <button 
                                                    onClick={() => editDespesa(despesa)} 
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition opacity-0 group-hover:opacity-100" 
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => removeDespesa(despesa.id)} 
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100" 
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
        </section>

      </main>
    </div>
  );
}
