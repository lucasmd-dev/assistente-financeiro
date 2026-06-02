// Inicialização e migração do estado — portado verbatim de App.jsx (getInitialState/clearAll).
// Migra chave antiga pcBuildData, converte historicoIA->chats, normaliza arrays e defaults.

import type { Chat, FinanceData } from './types';

export const STORAGE_KEY = 'assistenteFinanceiroData';
const LEGACY_KEY = 'pcBuildData';

export const createNovoChat = (titulo = 'Nova Conversa'): Chat => ({
  id: `chat-${Date.now()}`,
  titulo,
  criadoEm: new Date().toISOString(),
  mensagens: [],
  loading: false,
});

export const createDefaultData = (): FinanceData => {
  const chatInicial = createNovoChat();
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

/** Reset preservando a apiKey (clearAll do App.jsx). */
export const createClearedData = (apiKey: string): FinanceData => {
  const chatInicial = createNovoChat();
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
    salariosRecebidos: [],
    limiteAlertaMensal: 500,
    apiKey: apiKey || '',
    chats: [chatInicial],
    chatAtivoId: chatInicial.id,
  };
};

/** Lê e normaliza o estado do localStorage (client-only). */
export const getInitialState = (): FinanceData => {
  if (typeof window === 'undefined') {
    return createDefaultData();
  }

  try {
    let saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const oldData = localStorage.getItem(LEGACY_KEY);
      if (oldData) {
        localStorage.setItem(STORAGE_KEY, oldData);
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
        parsed.despesas = parsed.despesas.map((d: Record<string, unknown>) => ({
          ...d,
          vezesRestantes: d.vezesRestantes !== undefined ? d.vezesRestantes : null,
          dataInicio: d.dataInicio || null,
        }));
      }
      if (parsed.compras && Array.isArray(parsed.compras)) {
        parsed.compras = parsed.compras.map((c: Record<string, unknown>) => ({
          ...c,
          oculta: c.oculta || false,
        }));
      }
      if (parsed.entradasExtras && Array.isArray(parsed.entradasExtras)) {
        parsed.entradasExtras = parsed.entradasExtras.map((e: Record<string, unknown>) => ({
          ...e,
          somarNoSaldo: e.somarNoSaldo !== undefined ? e.somarNoSaldo : false,
          recorrente: e.recorrente !== undefined ? e.recorrente : false,
          ativo: e.ativo !== undefined ? e.ativo : true,
        }));
      }

      if (
        parsed.historicoIA &&
        parsed.historicoIA.length > 0 &&
        (!parsed.chats || parsed.chats.length === 0)
      ) {
        const chatInicial = {
          id: `chat-${Date.now()}`,
          titulo: 'Conversa Inicial',
          criadoEm: new Date().toISOString(),
          mensagens: parsed.historicoIA
            .map((conv: { id?: string | number; pergunta?: string; resposta?: string; data?: string }) => [
              { id: `${conv.id}-user`, tipo: 'user', conteudo: conv.pergunta, data: conv.data },
              { id: `${conv.id}-assistant`, tipo: 'assistant', conteudo: conv.resposta, data: conv.data },
            ])
            .flat(),
          loading: false,
        };
        parsed.chats = [chatInicial];
        parsed.chatAtivoId = chatInicial.id;
      } else if (!parsed.chats || parsed.chats.length === 0) {
        parsed.chats = [];
      }

      if (!parsed.chats || parsed.chats.length === 0) {
        const novoChat = createNovoChat();
        parsed.chats = [novoChat];
        parsed.chatAtivoId = novoChat.id;
      } else if (!parsed.chatAtivoId) {
        parsed.chatAtivoId = parsed.chats[0].id;
      }

      parsed.limiteAlertaMensal =
        parsed.limiteAlertaMensal !== undefined && parsed.limiteAlertaMensal !== null
          ? parseFloat(parsed.limiteAlertaMensal) || 0
          : 500;

      return parsed as FinanceData;
    }
  } catch {
    /* fallthrough para default */
  }

  return createDefaultData();
};
