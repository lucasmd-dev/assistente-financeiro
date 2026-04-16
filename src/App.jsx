import { useState, useEffect } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff
} from 'lucide-react';
import Modal from './components/Modal';
import ChatInterface from './components/ChatInterface';
import ModalDetalhesMes from './components/ModalDetalhesMes';
import { formatCurrencyInput, parseCurrencyInput } from './utils/currency';

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

        parsed.limiteAlertaMensal =
          parsed.limiteAlertaMensal !== undefined && parsed.limiteAlertaMensal !== null
            ? parseFloat(parsed.limiteAlertaMensal) || 0
            : 500;
        
        return parsed;
      }
    } catch {}
    
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
      limiteAlertaMensal: 500,
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
  const [mesFormulario, setMesFormulario] = useState(null);
  const [editingEntradaId, setEditingEntradaId] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editandoLimiteAlerta, setEditandoLimiteAlerta] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null, type: 'confirm' });
  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem('assistenteFinanceiroHideValues') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('assistenteFinanceiroHideValues', String(hideValues));
  }, [hideValues]);

  useEffect(() => {
    try {
      localStorage.setItem('assistenteFinanceiroData', JSON.stringify(data));
    } catch {}
  }, [data]);

  useEffect(() => {
    if (!showModal || modalType !== 'analise') {
      setShowApiKeyModal(false);
    }
  }, [showModal, modalType]);

  const openApiKeyModal = () => {
    setShowApiKeyModal(true);
  };

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
        limiteAlertaMensal:
          data.limiteAlertaMensal !== undefined && data.limiteAlertaMensal !== null
            ? parseFloat(data.limiteAlertaMensal) || 0
            : 500,
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
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao gerar o arquivo.';
      showAlert(`Erro ao exportar backup: ${errorMessage}`);
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
        if (typeof e.target?.result !== 'string') {
          throw new Error('Conteúdo do arquivo em formato inválido.');
        }

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
        restoredData.limiteAlertaMensal =
          restoredData.limiteAlertaMensal !== undefined && restoredData.limiteAlertaMensal !== null
            ? parseFloat(restoredData.limiteAlertaMensal) || 0
            : 500;
        
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
        
        restoredData.compras = restoredData.compras.map(c => ({
          id: c.id || generateUniqueId(),
          item: c.item || 'Item sem nome',
          data: c.data || new Date().toISOString().split('T')[0],
          valorTotal: parseFloat(c.valorTotal) || 0,
          parcelas: parseInt(c.parcelas) || 1,
          oculta: c.oculta === true
        }));
        
        restoredData.estornos = restoredData.estornos.map(e => ({
          id: e.id || generateUniqueId(),
          nome: e.nome || 'Estorno sem nome',
          mes: e.mes || new Date().toISOString().slice(0, 7),
          valor: parseFloat(e.valor) || 0
        }));
        
        restoredData.despesas = restoredData.despesas.map(d => ({
          id: d.id || generateUniqueId(),
          nome: d.nome || 'Despesa sem nome',
          valor: parseFloat(d.valor) || 0,
          vezesRestantes: d.vezesRestantes !== undefined && d.vezesRestantes !== null ? parseInt(d.vezesRestantes) : null,
          dataInicio: d.dataInicio || null,
          temLimite: d.temLimite === true || (d.vezesRestantes !== undefined && d.vezesRestantes !== null)
        }));
        
        restoredData.despesasExtras = restoredData.despesasExtras.map(d => ({
          id: d.id || generateUniqueId(),
          nome: d.nome || 'Despesa extra sem nome',
          valor: parseFloat(d.valor) || 0,
          mes: d.mes || new Date().toISOString().slice(0, 7),
          data: d.data || new Date().toISOString().split('T')[0],
          ativo: d.ativo !== undefined ? d.ativo !== false : true
        }));
        
        restoredData.entradasExtras = restoredData.entradasExtras.map(e => ({
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
          limiteAlertaMensal: restoredData.limiteAlertaMensal,
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
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível interpretar o arquivo informado.';
        showAlert(`Erro ao restaurar backup: ${errorMessage}\n\nVerifique se o arquivo é um backup válido e tente novamente.`);
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
    report += `Receita Mensal: ${formatCurrency(parseFloat(data.salarioMensal) || 0)}\n`;
    
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
      report += `\nMeses com Receita Já Lançada (${data.salariosRecebidos.length}):\n`;
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
      timeline.forEach(month => {
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
    setMesFormulario(null);
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
    setMesFormulario(null);
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
        entradasExtras: [],
        despesas: [],
        despesasExtras: [],
        salariosRecebidos: [],
        limiteAlertaMensal: 500,
        apiKey: data.apiKey || '',
        chats: [chatInicial],
        chatAtivoId: chatInicial.id,
      });
      setShowModal(false);
      setShowApiKeyModal(false);
      setMesDetalhado(null);
      setMesFormulario(null);
      setEditingCompraId(null);
      setEditingEstornoId(null);
      setEditingDespesaId(null);
      setEditingDespesaExtraId(null);
      setEditingEntradaId(null);
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
  const limiteAlertaMensal =
    data.limiteAlertaMensal !== undefined && data.limiteAlertaMensal !== null
      ? parseFloat(data.limiteAlertaMensal) || 0
      : 500;

  const isMesAtencao = (month) => {
    return month.netResult < 0 || month.finalBalance < 0 || month.netResult < limiteAlertaMensal;
  };

  const mesAtual = new Date();
  const inicioMesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const comprasAtivas = data.compras.filter((compra) => shouldShowCompra(compra));
  const estornosPendentes = data.estornos.filter((estorno) => !data.salariosRecebidos?.includes(estorno.mes));
  const despesasAtivas = (data.despesas || []).filter((despesa) => {
    if (despesa.vezesRestantes === null || despesa.vezesRestantes === undefined) {
      return true;
    }

    const vezesRestantesInicial = parseInt(despesa.vezesRestantes) || 0;

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

  const totalDespesasAtivas =
    despesasAtivas.reduce((sum, despesa) => sum + parseFloat(despesa.valor || 0), 0) ||
    parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0);
  const mediaSobra = timeline.length > 0 ? timeline.reduce((sum, month) => sum + month.netResult, 0) / timeline.length : 0;
  const primeiroMesCritico = timeline.find((month) => isMesAtencao(month));
  const mesesSobControle = timeline.filter((month) => !isMesAtencao(month)).length;
  const mesAtualLabel = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="app-shell">
      {confirmModal.show && (
        <div
          className="overlay-shell"
          onClick={(e) => {
            if (e.target === e.currentTarget && confirmModal.type === 'alert') {
              setConfirmModal({ show: false, message: '', onConfirm: null, type: 'alert' });
            }
          }}
        >
          <div className="dialog-card surface-enter">
            <div className="modal-header">
              {confirmModal.type === 'alert' ? (
                <div className="dialog-icon dialog-icon--alert">
                  <AlertTriangle size={24} />
                </div>
              ) : (
                <div className="dialog-icon dialog-icon--confirm">
                  <AlertTriangle size={24} />
                </div>
              )}
              <div className="dialog-copy">
                <h3 className="dialog-title">{confirmModal.type === 'alert' ? 'Atenção' : 'Confirmar ação'}</h3>
                <p className="dialog-message whitespace-pre-line">{confirmModal.message}</p>
              </div>
            </div>
            <div className="dialog-actions">
              {confirmModal.type === 'confirm' && (
                <button
                  onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null, type: 'confirm' })}
                  className="button-secondary"
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
                className={confirmModal.type === 'alert' ? 'button-primary button-primary--accent' : 'button-primary button-primary--negative'}
              >
                {confirmModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'analise' && (
        <ChatInterface
          data={data}
          setData={setData}
          showModal={showModal}
          setShowModal={setShowModal}
          apiKeyModalOpen={showApiKeyModal}
          openApiKeyModal={openApiKeyModal}
          formatCurrency={formatCurrency}
          timeline={timeline}
          comprasVisiveis={comprasAtivas.filter((compra) => !compra.oculta)}
          estornosVisiveis={estornosPendentes}
        />
      )}

      <ModalDetalhesMes
        showModal={mesDetalhado !== null}
        setShowModal={(show) => !show && setMesDetalhado(null)}
        monthKey={mesDetalhado}
        monthName={mesDetalhado ? timeline.find((month) => month.monthKey === mesDetalhado)?.name || '' : ''}
        data={data}
        removeEntradaExtra={removeEntradaExtra}
        toggleEntradaAtiva={toggleEntradaAtiva}
        editDespesaExtra={editDespesaExtra}
        removeDespesaExtra={removeDespesaExtra}
        toggleDespesaExtraAtiva={toggleDespesaExtraAtiva}
        editDespesa={editDespesa}
        removeDespesa={removeDespesa}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        setEditingEntradaId={setEditingEntradaId}
        setModalType={setModalType}
        setShowMainModal={setShowModal}
      />

      <Modal
        showModal={showApiKeyModal}
        setShowModal={setShowApiKeyModal}
        modalType="apikey"
        setData={setData}
        data={data}
        modalZIndexClass="z-[80]"
      />

      <Modal
        showModal={showModal && modalType !== 'analise' && modalType !== 'detalhesMes' && modalType !== 'apikey'}
        setShowModal={(show) => {
          setShowModal(show);
          if (!show && (modalType === 'entradaExtra' || modalType === 'despesaExtra')) {
            setMesFormulario(null);
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
        compraParaEditar={editingCompraId ? data.compras.find((compra) => compra.id === editingCompraId) : null}
        estornoParaEditar={editingEstornoId ? data.estornos.find((estorno) => estorno.id === editingEstornoId) : null}
        despesaParaEditar={editingDespesaId ? (data.despesas || []).find((despesa) => despesa.id === editingDespesaId) : null}
        despesaExtraParaEditar={editingDespesaExtraId ? (data.despesasExtras || []).find((despesa) => despesa.id === editingDespesaExtraId) : null}
        entradaParaEditar={editingEntradaId ? data.entradasExtras?.find((entrada) => entrada.id === editingEntradaId) : null}
        setEditingCompraId={setEditingCompraId}
        setEditingEstornoId={setEditingEstornoId}
        setEditingDespesaId={setEditingDespesaId}
        setEditingDespesaExtraId={setEditingDespesaExtraId}
        setEditingEntradaId={setEditingEntradaId}
        data={data}
        mesParaEntrada={mesFormulario}
        modalZIndexClass="z-[70]"
      />

      <header className="site-header">
        <div className="header-inner">
          <div className="brand-lockup">
            <div className="brand-mark">
              <LayoutDashboard size={22} />
            </div>
            <div className="brand-copy">
              <span className="brand-overline">Assistente financeiro</span>
              <h1 className="brand-name">Fluxo mensal</h1>
              <span className="brand-caption">Planejamento de caixa em 12 meses</span>
            </div>
          </div>

          <div className="header-context" aria-label="Contexto do planejamento">
            <div className="header-context__item">
              <span>Agora</span>
              <strong>{mesAtualLabel}</strong>
            </div>
            <div className={`header-context__status ${primeiroMesCritico ? 'header-context__status--warn' : 'header-context__status--ok'}`}>
              {primeiroMesCritico ? 'atenção' : 'em dia'}
            </div>
          </div>

          <div className="header-tools" aria-label="Ações do planejamento">
            <button
              onClick={() => setHideValues(!hideValues)}
              className={`header-action header-action--visibility ${hideValues ? 'is-active' : ''}`}
              title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {hideValues ? <EyeOff size={18} /> : <Eye size={18} />}
              <span>{hideValues ? 'Mostrar' : 'Ocultar'}</span>
            </button>

            <div className="header-action-group">
              <button onClick={exportBackup} className="header-action" title="Exportar backup">
                <Save size={17} />
                <span>Salvar</span>
              </button>
              <label className="header-action cursor-pointer" title="Importar backup">
                <Upload size={17} />
                <span>Importar</span>
                <input type="file" accept=".json" onChange={importBackup} className="hidden" />
              </label>
              <button onClick={generateReport} className="header-action" title="Exportar relatório">
                <Download size={17} />
                <span>Relatório</span>
              </button>
              <button onClick={clearAll} className="header-action header-action--danger" title="Limpar tudo">
                <Trash2 size={17} />
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-shell animate-fade-in">
        <section className="command-stage stagger-item">
          <div className="panel panel--hero">
            <div className="section-header">
              <div>
                <span className="panel-kicker">Base do mês</span>
                <h2 className="section-title">Resumo do mês</h2>
                <p className="section-description">Saldo, receita, despesas ativas e corte do cartão.</p>
              </div>
              <div className="section-badges">
                <span className="info-chip info-chip--accent">{mesAtualLabel}</span>
                <span className="info-chip info-chip--positive">{comprasAtivas.length} parcelados</span>
                <span className="info-chip info-chip--negative">{estornosPendentes.length} estornos</span>
              </div>
            </div>

            <div className="hero-grid">
              <div className="hero-copy">
                <h3 className="hero-title">Visão rápida</h3>
                <p className="hero-description">Bater o olho, lançar o que mudou e seguir.</p>
              </div>

              <div className="quick-actions">
                <button
                  onClick={() => {
                    setEditingCompraId(null);
                    setModalType('compra');
                    setShowModal(true);
                  }}
                  className="quick-action quick-action--primary"
                >
                  <div className="quick-action__copy">
                    <span className="quick-action__title">Parcelado</span>
                    <span className="quick-action__text">Compra no cartão</span>
                  </div>
                  <Plus size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    setEditingEstornoId(null);
                    setModalType('estorno');
                    setShowModal(true);
                  }}
                  className="quick-action quick-action--positive"
                >
                  <div className="quick-action__copy">
                    <span className="quick-action__title">Estorno</span>
                    <span className="quick-action__text">Crédito previsto</span>
                  </div>
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => {
                    setEditingDespesaId(null);
                    setModalType('despesa');
                    setShowModal(true);
                  }}
                  className="quick-action quick-action--negative"
                >
                  <div className="quick-action__copy">
                    <span className="quick-action__title">Despesa</span>
                    <span className="quick-action__text">Fixa ou pontual</span>
                  </div>
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => {
                    setModalType('analise');
                    setShowModal(true);
                  }}
                  className="quick-action quick-action--ghost"
                >
                  <div className="quick-action__copy">
                    <span className="quick-action__title">Análise</span>
                    <span className="quick-action__text">Consultar cenário</span>
                  </div>
                  <Sparkles size={18} />
                </button>
              </div>
            </div>

            <div className="metric-board">
              <label className="metric-panel metric-panel--accent">
                <span className="metric-panel__label">Saldo atual</span>
                <div className="metric-input-row">
                  <input
                    type={hideValues ? 'password' : 'text'}
                    inputMode="decimal"
                    className="metric-input"
                    value={hideValues ? data.saldoAtual : formatCurrencyInput(data.saldoAtual)}
                    onChange={(e) => setData({ ...data, saldoAtual: parseCurrencyInput(e.target.value) })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <span className="metric-panel__hint">Disponível agora.</span>
              </label>

              <label className="metric-panel metric-panel--positive">
                <span className="metric-panel__label">Receita mensal</span>
                <div className="metric-input-row">
                  <input
                    type={hideValues ? 'password' : 'text'}
                    inputMode="decimal"
                    className="metric-input metric-input--salary"
                    value={hideValues ? data.salarioMensal : formatCurrencyInput(data.salarioMensal)}
                    onChange={(e) => setData({ ...data, salarioMensal: parseCurrencyInput(e.target.value) })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <span className="metric-panel__hint">Base recorrente.</span>
              </label>

              <div className="metric-panel metric-panel--negative">
                <span className="metric-panel__label">Despesas fixas ativas</span>
                <div className="metric-input-row">
                  <div className="metric-static metric-static--negative">{hideValues ? '••••••' : formatCurrency(totalDespesasAtivas)}</div>
                </div>
                <span className="metric-panel__hint">Impacto mensal atual.</span>
              </div>

              <label className="metric-panel">
                <span className="metric-panel__label">Fechamento do cartão</span>
                <div className="metric-input-row">
                  <div className="panel-icon panel-icon--accent">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="metric-input metric-input--accent"
                    value={data.diaFechamento}
                    onChange={(e) => setData({ ...data, diaFechamento: e.target.value })}
                  />
                </div>
                <span className="metric-panel__hint">Dia que vira a fatura.</span>
              </label>
            </div>
          </div>

          <aside className="panel panel--support">
            <div>
              <span className="panel-kicker">Radar</span>
              <h3 className="panel-title">Resumo</h3>
            </div>

            <div className="support-stack">
              <div className="support-row">
                <span className="support-row__label">Primeiro mês crítico</span>
                <strong className="support-row__value">{primeiroMesCritico ? primeiroMesCritico.name : 'Nenhum em alerta'}</strong>
              </div>
              <div className="support-row">
                <span className="support-row__label">Média de sobra</span>
                <strong className="support-row__value">{formatDisplay(mediaSobra)}</strong>
              </div>
              <div className="support-row">
                <span className="support-row__label">Meses sob controle</span>
                <strong className="support-row__value">{mesesSobControle}/{timeline.length}</strong>
              </div>
              <div className="support-row support-row--editable">
                <span className="support-row__label">Alerta de sobra</span>
                <div className="support-edit">
                  {editandoLimiteAlerta ? (
                    <input
                      className="field-input support-edit__input"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(data.limiteAlertaMensal)}
                      onChange={(e) => setData({ ...data, limiteAlertaMensal: parseCurrencyInput(e.target.value) })}
                      onBlur={() => setEditandoLimiteAlerta(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          setEditandoLimiteAlerta(false);
                          e.currentTarget.blur();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <strong className="support-row__value">{formatDisplay(limiteAlertaMensal)}</strong>
                  )}
                  <button
                    type="button"
                    className="row-icon-button row-icon-button--accent support-edit__button"
                    onClick={() => setEditandoLimiteAlerta(true)}
                    title="Alterar limite de alerta mensal"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              </div>
              <div className="support-row">
                <span className="support-row__label">Despesas ativas</span>
                <strong className="support-row__value">{despesasAtivas.length}</strong>
              </div>
            </div>

            <p className="support-note">Meses com sobra abaixo de {formatDisplay(limiteAlertaMensal)} entram em atenção.</p>
          </aside>
        </section>

        <section className="section-shell stagger-item">
          <div className="section-header">
            <div>
              <span className="panel-kicker">Projeção</span>
              <h2 className="section-title">12 meses</h2>
              <p className="section-description">Abra um mês para ver os itens e lançar extras no lugar certo.</p>
            </div>
            <div className="section-badges">
              <span className="info-chip">12 meses</span>
              <span className="info-chip info-chip--accent">média {formatDisplay(mediaSobra)}</span>
              <span className={`info-chip ${primeiroMesCritico ? 'info-chip--negative' : 'info-chip--positive'}`}>
                {primeiroMesCritico ? 'atenção' : 'ok'}
              </span>
            </div>
          </div>

          <div className="projection-grid">
            {timeline.map((month, idx) => {
              const handleMarcarSalarioRecebido = () => {
                if (month.salarioJaRecebido) return;

                setData((prev) => {
                  const novosSalariosRecebidos = [...(prev.salariosRecebidos || []), month.monthKey];
                  const novoSaldoAtual = parseFloat(prev.saldoAtual) + parseFloat(prev.salarioMensal);

                  return {
                    ...prev,
                    salariosRecebidos: novosSalariosRecebidos,
                    saldoAtual: novoSaldoAtual
                  };
                });
              };

              const [mesNome, anoNome] = month.name.split(' de ');

              return (
                <article
                  key={month.monthKey}
                  className={`month-panel stagger-item ${isMesAtencao(month) ? 'month-panel--warn' : 'month-panel--steady'}`}
                  style={{ animationDelay: `${120 + idx * 45}ms` }}
                  onClick={() => setMesDetalhado(month.monthKey)}
                >
                  <div className="month-panel__header">
                    <div>
                      <div className="month-panel__index">{String(idx + 1).padStart(2, '0')}</div>
                      <h3 className="month-panel__title">{mesNome}</h3>
                      <span className="month-panel__year">{anoNome}</span>
                    </div>
                    <div className="month-panel__status">
                      <span className={isMesAtencao(month) ? 'status-dot status-dot--warn' : 'status-dot status-dot--steady'} />
                      <span className={`pill ${isMesAtencao(month) ? 'pill--negative' : 'pill--positive'}`}>
                        {isMesAtencao(month) ? 'atenção' : 'ok'}
                      </span>
                      <div className="month-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEntradaId(null);
                            setMesFormulario(month.monthKey);
                            setModalType('entradaExtra');
                            setShowModal(true);
                          }}
                          className="mini-action mini-action--positive"
                          title="Adicionar entrada extra"
                        >
                          <Plus size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDespesaExtraId(null);
                            setMesFormulario(month.monthKey);
                            setModalType('despesaExtra');
                            setShowModal(true);
                          }}
                          className="mini-action mini-action--negative"
                          title="Adicionar despesa extra"
                        >
                          <Minus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="month-panel__rows">
                    <div className="month-row">
                      <span>Entradas</span>
                      <span className="month-row__value month-row__value--positive">+{formatDisplay(month.income)}</span>
                    </div>
                    <div className="month-row">
                      <span>Fatura do cartão</span>
                      <span className="month-row__value month-row__value--negative">-{formatDisplay(month.cardBill)}</span>
                    </div>
                    <div className="month-row">
                      <span>Despesas</span>
                      <span className="month-row__value month-row__value--negative">-{formatDisplay(month.expenses)}</span>
                    </div>

                    <div className="month-divider" />

                    <div className="month-row month-row--summary">
                      <span>Sobra</span>
                      <span className={`month-row__value ${isMesAtencao(month) ? 'month-row__value--negative' : 'month-row__value--accent'} text-glow`}>
                        {formatDisplay(month.netResult)}
                      </span>
                    </div>
                    <div className="month-row month-row--foot">
                      <span>Acumulado</span>
                      <span className={`month-row__value ${month.finalBalance >= 0 ? 'month-row__value--positive' : 'month-row__value--negative'}`}>
                        {formatDisplay(month.finalBalance)}
                      </span>
                    </div>
                  </div>

                  {idx === 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarSalarioRecebido();
                      }}
                      disabled={month.salarioJaRecebido}
                      className={`salary-flag ${month.salarioJaRecebido ? 'salary-flag--done' : 'salary-flag--pending'}`}
                    >
                      {month.salarioJaRecebido ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Renda recebida</span>
                        </>
                      ) : (
                        <>
                          <Circle size={16} />
                          <span>Marcar renda recebida</span>
                        </>
                      )}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-shell stagger-item">
          <div className="section-header">
            <div>
              <span className="panel-kicker">Listas</span>
              <h2 className="section-title">Operação</h2>
              <p className="section-description">Lançamentos ativos e ajustes rápidos.</p>
            </div>
          </div>

          <div className="workspace-grid">
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title-wrap">
                  <div className="panel-icon panel-icon--accent">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="panel-title">Parcelados</h3>
                    <p className="panel-subtitle">{comprasAtivas.length} ativos</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingCompraId(null);
                    setModalType('compra');
                    setShowModal(true);
                  }}
                  className="panel-add"
                  title="Adicionar parcelado"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="list-scroll custom-scrollbar">
                {comprasAtivas.length === 0 ? (
                  <div className="empty-state">
                    <CreditCard size={44} strokeWidth={1.3} className="empty-state__icon" />
                    <p>Nenhuma compra ativa no cartão.</p>
                  </div>
                ) : (
                  <div className="list-stack">
                    {comprasAtivas.map((compra) => {
                      const isOculta = compra.oculta || false;
                      const parcelaAtual = calculateParcelaAtual(compra);

                      return (
                        <div key={compra.id} className={`ledger-row ${isOculta ? 'ledger-row--muted' : ''}`}>
                          <div className="ledger-row__main">
                            <p className={`ledger-row__title ${isOculta ? 'ledger-row__title--muted' : ''}`}>{compra.item}</p>
                            <div className="ledger-row__meta flex flex-wrap items-center gap-2">
                              <span className="pill pill--muted">{formatDate(compra.data)}</span>
                              <span>{compra.parcelas}x de {formatDisplay(compra.valorTotal / compra.parcelas)}</span>
                              {!isOculta && parcelaAtual > 0 && parcelaAtual <= compra.parcelas && (
                                <span className="pill pill--accent">{parcelaAtual}/{compra.parcelas}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`ledger-row__value ${isOculta ? '' : 'month-row__value--accent'}`}>{formatDisplay(compra.valorTotal)}</span>
                            <div className="ledger-row__actions">
                              <button
                                onClick={() => {
                                  setData((prev) => ({
                                    ...prev,
                                    compras: prev.compras.map((item) =>
                                      item.id === compra.id ? { ...item, oculta: !item.oculta } : item
                                    )
                                  }));
                                }}
                                className="row-icon-button row-icon-button--neutral"
                                title={isOculta ? 'Mostrar compra' : 'Ocultar compra'}
                              >
                                {isOculta ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                              <button onClick={() => editCompra(compra)} className="row-icon-button row-icon-button--accent" title="Editar">
                                <Edit size={15} />
                              </button>
                              <button onClick={() => removeItem(compra.id)} className="row-icon-button row-icon-button--negative" title="Remover">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div className="panel-title-wrap">
                  <div className="panel-icon panel-icon--positive">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="panel-title">Estornos</h3>
                    <p className="panel-subtitle">{estornosPendentes.length} pendentes</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingEstornoId(null);
                    setModalType('estorno');
                    setShowModal(true);
                  }}
                  className="panel-add"
                  title="Adicionar estorno"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="list-scroll custom-scrollbar">
                {estornosPendentes.length === 0 ? (
                  <div className="empty-state">
                    <TrendingUp size={44} strokeWidth={1.3} className="empty-state__icon" />
                    <p>Nenhum estorno pendente.</p>
                  </div>
                ) : (
                  <div className="list-stack">
                    {estornosPendentes.map((estorno) => (
                      <div key={estorno.id} className="ledger-row">
                        <div className="ledger-row__main">
                          <p className="ledger-row__title">{estorno.nome}</p>
                          <div className="ledger-row__meta flex flex-wrap items-center gap-2">
                            <span className="pill pill--muted">Mês {estorno.mes}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="ledger-row__value ledger-row__value--positive">+{formatDisplay(estorno.valor)}</span>
                          <div className="ledger-row__actions">
                            <button onClick={() => editEstorno(estorno)} className="row-icon-button row-icon-button--accent" title="Editar">
                              <Edit size={15} />
                            </button>
                            <button onClick={() => removeEstorno(estorno.id)} className="row-icon-button row-icon-button--negative" title="Remover">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div className="panel-title-wrap">
                  <div className="panel-icon panel-icon--negative">
                    <Minus size={20} />
                  </div>
                  <div>
                    <h3 className="panel-title">Despesas</h3>
                    <p className="panel-subtitle">{despesasAtivas.length} ativas</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingDespesaId(null);
                    setModalType('despesa');
                    setShowModal(true);
                  }}
                  className="panel-add"
                  title="Adicionar despesa"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="list-scroll custom-scrollbar">
                {despesasAtivas.length === 0 ? (
                  <div className="empty-state">
                    <Minus size={44} strokeWidth={1.3} className="empty-state__icon" />
                    <p>Nenhuma despesa cadastrada.</p>
                  </div>
                ) : (
                  <div className="list-stack">
                    {despesasAtivas.map((despesa) => {
                      const temLimite = despesa.vezesRestantes !== undefined && despesa.vezesRestantes !== null;
                      const vezesRestantesInicial = temLimite ? parseInt(despesa.vezesRestantes) : null;

                      let vezesRestantesAgora = vezesRestantesInicial;
                      if (temLimite && despesa.dataInicio) {
                        const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
                        const inicioDate = new Date(inicioAno, inicioMes - 1, 1);

                        if (inicioMesAtual >= inicioDate) {
                          const mesesPassados =
                            (inicioMesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
                            (inicioMesAtual.getMonth() - inicioDate.getMonth());

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
                            let vezesRestantesParaSalvar = novasVezes;

                            if (despesa.dataInicio) {
                              const [inicioAno, inicioMes] = despesa.dataInicio.split('-').map(Number);
                              const inicioDate = new Date(inicioAno, inicioMes - 1, 1);
                              const mesesPassados =
                                (inicioMesAtual.getFullYear() - inicioDate.getFullYear()) * 12 +
                                (inicioMesAtual.getMonth() - inicioDate.getMonth());

                              vezesRestantesParaSalvar = novasVezes + mesesPassados;
                            }

                            setData((prev) => ({
                              ...prev,
                              despesas: prev.despesas.map((item) =>
                                item.id === despesa.id ? { ...item, vezesRestantes: vezesRestantesParaSalvar } : item
                              )
                            }));
                          }
                        }
                      };

                      return (
                        <div key={despesa.id} className="ledger-row">
                          <div className="ledger-row__main">
                            <p className="ledger-row__title">{despesa.nome}</p>
                            <div className="ledger-row__meta flex flex-wrap items-center gap-2">
                              <span>{formatDisplay(despesa.valor)}/mês</span>
                              {temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                                <span className="pill pill--accent">Falta {vezesRestantesAgora}x</span>
                              )}
                              {temLimite && despesa.dataInicio && (
                                <span className="pill pill--muted">Início {formatDate(despesa.dataInicio)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="ledger-row__value ledger-row__value--negative">{formatDisplay(despesa.valor)}</span>
                            <div className="ledger-row__actions">
                              {temLimite && vezesRestantesAgora !== null && vezesRestantesAgora > 0 && (
                                <button onClick={decrementarVezes} className="row-icon-button row-icon-button--positive" title="Marcar como pago">
                                  <CheckCircle2 size={15} />
                                </button>
                              )}
                              <button onClick={() => editDespesa(despesa)} className="row-icon-button row-icon-button--accent" title="Editar">
                                <Edit size={15} />
                              </button>
                              <button onClick={() => removeDespesa(despesa.id)} className="row-icon-button row-icon-button--negative" title="Remover">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
