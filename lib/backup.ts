// Export/import de backup JSON (v1.1) — portado verbatim de App.jsx.
// apiKey é sempre exportada como '' (nunca sai do navegador).

import type { FinanceData } from './types';

export function exportBackup(data: FinanceData, onError: (msg: string) => void): void {
  try {
    const dataToExport = {
      saldoAtual: parseFloat(String(data.saldoAtual)) || 0,
      diaFechamento: parseInt(String(data.diaFechamento)) || 1,
      salarioMensal: parseFloat(String(data.salarioMensal)) || 0,
      despesasFixas: parseFloat(String(data.despesasFixas)) || 0,
      despesasVariaveis: parseFloat(String(data.despesasVariaveis)) || 0,
      compras: Array.isArray(data.compras) ? data.compras : [],
      estornos: Array.isArray(data.estornos) ? data.estornos : [],
      entradasExtras: Array.isArray(data.entradasExtras) ? data.entradasExtras : [],
      despesas: Array.isArray(data.despesas) ? data.despesas : [],
      despesasExtras: Array.isArray(data.despesasExtras) ? data.despesasExtras : [],
      salariosRecebidos: Array.isArray(data.salariosRecebidos) ? data.salariosRecebidos : [],
      limiteAlertaMensal:
        data.limiteAlertaMensal !== undefined && data.limiteAlertaMensal !== null
          ? parseFloat(String(data.limiteAlertaMensal)) || 0
          : 500,
      apiKey: '',
      chats: Array.isArray(data.chats) ? data.chats : [],
      chatAtivoId: data.chatAtivoId || null,
    };

    const backup = {
      version: '1.1',
      data: dataToExport,
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('pt-BR'),
      exportDate: new Date().toISOString().split('T')[0],
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro inesperado ao gerar o arquivo.';
    onError(`Erro ao exportar backup: ${errorMessage}`);
  }
}

interface ImportHandlers {
  showAlert: (msg: string) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
  applyData: (data: FinanceData) => void;
  resetInput: () => void;
}

export function importBackup(file: File, handlers: ImportHandlers): void {
  const { showAlert, showConfirm, applyData, resetInput } = handlers;

  if (!file) return;

  if (!file.name.endsWith('.json')) {
    showAlert('Arquivo inválido. Por favor, selecione um arquivo JSON de backup.');
    resetInput();
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
        resetInput();
        return;
      }

      if (!backup.data) {
        showAlert('Arquivo de backup inválido: estrutura de dados não encontrada.');
        resetInput();
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

      restoredData.compras = restoredData.compras.map((c: Record<string, unknown>) => ({
        id: c.id || generateUniqueId(),
        item: c.item || 'Item sem nome',
        data: c.data || new Date().toISOString().split('T')[0],
        valorTotal: parseFloat(String(c.valorTotal)) || 0,
        parcelas: parseInt(String(c.parcelas)) || 1,
        oculta: c.oculta === true,
      }));

      restoredData.estornos = restoredData.estornos.map((e: Record<string, unknown>) => ({
        id: e.id || generateUniqueId(),
        nome: e.nome || 'Estorno sem nome',
        mes: e.mes || new Date().toISOString().slice(0, 7),
        valor: parseFloat(String(e.valor)) || 0,
      }));

      restoredData.despesas = restoredData.despesas.map((d: Record<string, unknown>) => ({
        id: d.id || generateUniqueId(),
        nome: d.nome || 'Despesa sem nome',
        valor: parseFloat(String(d.valor)) || 0,
        vezesRestantes:
          d.vezesRestantes !== undefined && d.vezesRestantes !== null
            ? parseInt(String(d.vezesRestantes))
            : null,
        dataInicio: d.dataInicio || null,
        temLimite: d.temLimite === true || (d.vezesRestantes !== undefined && d.vezesRestantes !== null),
      }));

      restoredData.despesasExtras = restoredData.despesasExtras.map((d: Record<string, unknown>) => ({
        id: d.id || generateUniqueId(),
        nome: d.nome || 'Despesa extra sem nome',
        valor: parseFloat(String(d.valor)) || 0,
        mes: d.mes || new Date().toISOString().slice(0, 7),
        data: d.data || new Date().toISOString().split('T')[0],
        ativo: d.ativo !== undefined ? d.ativo !== false : true,
      }));

      restoredData.entradasExtras = restoredData.entradasExtras.map((e: Record<string, unknown>) => ({
        id: e.id || generateUniqueId(),
        nome: e.nome || 'Entrada extra sem nome',
        valor: parseFloat(String(e.valor)) || 0,
        mes: e.mes || new Date().toISOString().slice(0, 7),
        data: e.data || new Date().toISOString().split('T')[0],
        recorrente: e.recorrente === true,
        somarNoSaldo: e.somarNoSaldo === true,
        ativo: e.ativo !== undefined ? e.ativo !== false : true,
      }));

      restoredData.salariosRecebidos = restoredData.salariosRecebidos
        .filter((mes: unknown) => mes && typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes))
        .map((mes: string) => mes.trim());

      restoredData.apiKey = restoredData.apiKey || '';

      if (
        restoredData.historicoIA &&
        Array.isArray(restoredData.historicoIA) &&
        restoredData.historicoIA.length > 0 &&
        (!restoredData.chats || restoredData.chats.length === 0)
      ) {
        const chatInicial = {
          id: `chat-${Date.now()}`,
          titulo: 'Conversa Inicial',
          criadoEm: new Date().toISOString(),
          mensagens: restoredData.historicoIA
            .map((conv: { id?: string | number; pergunta?: string; resposta?: string; data?: string }) => [
              {
                id: `${conv.id || Date.now()}-user`,
                tipo: 'user',
                conteudo: conv.pergunta || '',
                data: conv.data || new Date().toISOString(),
              },
              {
                id: `${conv.id || Date.now()}-assistant`,
                tipo: 'assistant',
                conteudo: conv.resposta || '',
                data: conv.data || new Date().toISOString(),
              },
            ])
            .flat(),
          loading: false,
        };
        restoredData.chats = [chatInicial];
        restoredData.chatAtivoId = chatInicial.id;
      } else if (
        !restoredData.chats ||
        !Array.isArray(restoredData.chats) ||
        restoredData.chats.length === 0
      ) {
        const novoChat = {
          id: `chat-${Date.now()}`,
          titulo: 'Nova Conversa',
          criadoEm: new Date().toISOString(),
          mensagens: [],
          loading: false,
        };
        restoredData.chats = [novoChat];
        restoredData.chatAtivoId = novoChat.id;
      } else {
        restoredData.chats = restoredData.chats.map((chat: Record<string, unknown>) => ({
          id: chat.id || `chat-${Date.now()}-${Math.random()}`,
          titulo: chat.titulo || 'Nova Conversa',
          criadoEm: chat.criadoEm || new Date().toISOString(),
          mensagens: Array.isArray(chat.mensagens) ? chat.mensagens : [],
          loading: chat.loading === true,
        }));

        if (
          !restoredData.chatAtivoId ||
          !restoredData.chats.find((c: { id: string }) => c.id === restoredData.chatAtivoId)
        ) {
          restoredData.chatAtivoId = restoredData.chats[0].id;
        }
      }

      const dataToSet: FinanceData = {
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
        chatAtivoId: restoredData.chatAtivoId,
      };

      const confirmMessage = backup.dateFormatted
        ? `Deseja restaurar o backup de ${backup.dateFormatted}?\n\nIsso irá substituir TODOS os dados atuais.\n\nVersão do backup: ${backup.version || 'desconhecida'}`
        : `Deseja restaurar este backup?\n\nIsso irá substituir TODOS os dados atuais.\n\nVersão do backup: ${backup.version || 'desconhecida'}`;

      showConfirm(confirmMessage, () => {
        applyData(dataToSet);
        showAlert('Backup restaurado com sucesso!');
      });
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Não foi possível interpretar o arquivo informado.';
      showAlert(
        `Erro ao restaurar backup: ${errorMessage}\n\nVerifique se o arquivo é um backup válido e tente novamente.`,
      );
    } finally {
      resetInput();
    }
  };

  reader.onerror = () => {
    showAlert('Erro ao ler o arquivo. Por favor, tente novamente.');
    resetInput();
  };

  reader.readAsText(file);
}
