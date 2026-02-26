import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Sparkles, X, Plus, Trash2, MessageSquare, Send, Settings } from 'lucide-react';

const ChatInterface = ({ 
  data, 
  setData, 
  showModal, 
  setShowModal,
  aiLoading,
  setAiLoading,
  formatCurrency,
  timeline,
  comprasVisiveis = [],
  estornosVisiveis = []
}) => {
  const [inputMensagem, setInputMensagem] = useState('');
  const [editandoTitulo, setEditandoTitulo] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [incluirContexto, setIncluirContexto] = useState(() => {
    const saved = localStorage.getItem('chatIncluirContexto');
    return saved !== null ? saved === 'true' : true;
  });
  const [modeloSelecionado, setModeloSelecionado] = useState(() => {
    const saved = localStorage.getItem('chatModeloSelecionado');
    return saved || 'gemini-3.1-pro-preview';
  });
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const chatAtivo = data.chats?.find(chat => chat.id === data.chatAtivoId) || data.chats?.[0];
  const chatAtivoLoading = chatAtivo?.loading || false;

  useEffect(() => {
    localStorage.setItem('chatIncluirContexto', incluirContexto.toString());
  }, [incluirContexto]);

  useEffect(() => {
    localStorage.setItem('chatModeloSelecionado', modeloSelecionado);
  }, [modeloSelecionado]);

  const scrollToBottom = (instant = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    if (chatAtivo?.mensagens && chatAtivo.mensagens.length > 0) {
      scrollToBottom();
    }
  }, [chatAtivo?.mensagens?.length]);

  useLayoutEffect(() => {
    if (showModal && messagesContainerRef.current && chatAtivo && chatAtivo.mensagens.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [showModal, data.chatAtivoId, chatAtivo?.mensagens?.length]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 200);
      
      const handleEsc = (event) => {
        if (event.key === 'Escape') {
          setShowModal(false);
        }
      };
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [showModal, data.chatAtivoId]);

  const criarNovoChat = () => {
    const algumChatCarregando = data.chats?.some(chat => chat.loading);
    if (algumChatCarregando) {
      return;
    }
    
    const novoChat = {
      id: `chat-${Date.now()}`,
      titulo: 'Nova Conversa',
      criadoEm: new Date().toISOString(),
      mensagens: [],
      loading: false
    };
    
    setData(prev => ({
      ...prev,
      chats: [novoChat, ...(prev.chats || [])],
      chatAtivoId: novoChat.id
    }));
    
    setInputMensagem('');
  };

  const selecionarChat = (chatId) => {
    const chatAtual = data.chats.find(chat => chat.id === chatId);
    if (chatAtual?.loading) return;
    
    setData(prev => ({
      ...prev,
      chatAtivoId: chatId
    }));
    setInputMensagem('');
  };

  const excluirChat = (chatId, e) => {
    e.stopPropagation();
    
    if (data.chats.length === 1) {
      criarNovoChat();
      setTimeout(() => {
        setData(prev => ({
          ...prev,
          chats: prev.chats.filter(chat => chat.id !== chatId)
        }));
      }, 100);
    } else {
      const chatsRestantes = data.chats.filter(chat => chat.id !== chatId);
      const novoChatAtivo = chatId === data.chatAtivoId 
        ? chatsRestantes[0].id 
        : data.chatAtivoId;
      
      setData(prev => ({
        ...prev,
        chats: chatsRestantes,
        chatAtivoId: novoChatAtivo
      }));
    }
  };

  const iniciarEdicaoTitulo = (chat, e) => {
    e.stopPropagation();
    setEditandoTitulo(chat.id);
    setNovoTitulo(chat.titulo);
  };

  const salvarTitulo = (chatId) => {
    if (novoTitulo.trim()) {
      setData(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === chatId ? { ...chat, titulo: novoTitulo.trim() } : chat
        )
      }));
    }
    setEditandoTitulo(null);
    setNovoTitulo('');
  };

  const cancelarEdicaoTitulo = () => {
    setEditandoTitulo(null);
    setNovoTitulo('');
  };

  const gerarTituloAutomatico = (primeiraMensagem) => {
    const palavras = primeiraMensagem.split(' ').slice(0, 5);
    return palavras.join(' ') + (primeiraMensagem.split(' ').length > 5 ? '...' : '');
  };

  const handleEnviarMensagem = async () => {
    if (!inputMensagem.trim() || chatAtivoLoading) return;
    
    const mensagemTexto = inputMensagem.trim();
    const eraChatVazio = chatAtivo.mensagens.length === 0;
    
    setInputMensagem('');
    
    if (!data.apiKey || data.apiKey.trim() === '') {
      const mensagemErro = {
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo: '⚠️ **API Key não configurada!**\n\nPor favor, configure sua API Key do Google Gemini nas configurações antes de usar o conselheiro IA.',
        data: new Date().toLocaleString('pt-BR')
      };
      
      adicionarMensagemAoChat(mensagemErro);
      return;
    }

    const mensagemUsuario = {
      id: `msg-${Date.now()}`,
      tipo: 'user',
      conteudo: mensagemTexto,
      data: new Date().toLocaleString('pt-BR')
    };

    const historicoChat = incluirContexto 
      ? [...chatAtivo.mensagens, mensagemUsuario].map(msg => ({
          role: msg.tipo === 'user' ? 'user' : 'model',
          parts: [{ text: msg.conteudo }]
        }))
      : [{
          role: 'user',
          parts: [{ text: mensagemTexto }]
        }];

    if (eraChatVazio) {
      const novoTitulo = gerarTituloAutomatico(mensagemTexto);
      setData(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === prev.chatAtivoId ? { ...chat, titulo: novoTitulo } : chat
        )
      }));
    }

    adicionarMensagemAoChat(mensagemUsuario);
    
    setData(prev => ({
      ...prev,
      chats: prev.chats.map(chat =>
        chat.id === prev.chatAtivoId ? { ...chat, loading: true } : chat
      )
    }));
    
    setAiLoading(true);

    let contentsToSend;
    
    if (incluirContexto) {
      const hoje = new Date();
      const dataAtual = hoje.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const salariosRecebidosFormatados = data.salariosRecebidos && data.salariosRecebidos.length > 0
        ? data.salariosRecebidos.map(mesKey => {
            const [ano, mes] = mesKey.split('-');
            const dataMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
            return dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          })
        : ['Nenhuma renda passiva marcada como recebida'];
      
      const financialContext = {
        dataAtual: dataAtual,
        saldoAtual: formatCurrency(parseFloat(data.saldoAtual) || 0),
        rendaPassiva: formatCurrency(parseFloat(data.salarioMensal) || 0),
        despesasFixas: formatCurrency((data.despesas || []).reduce((sum, d) => sum + parseFloat(d.valor || 0), 0) || parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0)),
        despesasCadastradas: (data.despesas || []).length > 0
          ? data.despesas.map(d => `${d.nome}: ${formatCurrency(d.valor)}/mês`)
          : ['Nenhuma despesa cadastrada'],
        diaFechamentoFatura: data.diaFechamento,
        rendaPassivaRecebida: salariosRecebidosFormatados,
        comprasAtivas: comprasVisiveis.length > 0 
          ? comprasVisiveis.map(c => `${c.item}: ${formatCurrency(c.valorTotal)} em ${c.parcelas}x de ${formatCurrency(c.valorTotal / c.parcelas)}`)
          : ['Nenhuma compra parcelada no momento'],
        estornos: estornosVisiveis.length > 0
          ? estornosVisiveis.map(e => `${e.nome}: ${formatCurrency(e.valor)} no mês ${e.mes}`)
          : ['Nenhum estorno registrado'],
        entradasExtras: data.entradasExtras && data.entradasExtras.length > 0
          ? data.entradasExtras.filter(e => e.ativo !== false).map(e => 
              `${e.nome}: ${formatCurrency(e.valor)} no mês ${e.mes}${e.recorrente ? ' (recorrente)' : ''}`
            )
          : ['Nenhuma entrada extra registrada'],
        proximosMeses: timeline.slice(0, 6).map(m => ({
          mes: m.name,
          salarioJaRecebido: m.salarioJaRecebido,
          sobraMensal: formatCurrency(m.netResult),
          saldoAcumulado: formatCurrency(m.finalBalance)
        }))
      };

      const systemPrompt = `Você é um consultor financeiro pessoal. Seu papel é ajudar o usuário a tomar decisões financeiras inteligentes.

DATA ATUAL: ${dataAtual}

DADOS FINANCEIROS ATUAIS DO USUÁRIO:
${JSON.stringify(financialContext, null, 2)}

IMPORTANTE SOBRE RENDA PASSIVA RECEBIDA:
- Os meses listados em "rendaPassivaRecebida" já tiveram sua renda passiva recebida e adicionada ao saldo atual
- Nos meses marcados como "salarioJaRecebido: true" na projeção, a renda passiva não será mais somada na entrada daquele mês
- Use a data atual para contextualizar suas respostas sobre prazos, vencimentos e planejamento

INSTRUÇÕES PARA SUAS RESPOSTAS:
1. Analise friamente se a compra/pergunta cabe no orçamento
2. Se a sobra mensal for baixa (menor que R$500), ALERTE sobre o perigo
3. Se for uma compra parcelada mencionada, verifique se a parcela cabe na sobra mensal prevista dos próximos meses
4. Considere o saldo acumulado - se estiver negativo em algum mês, ALERTE
5. Seja direto, objetivo e use emojis quando apropriado
6. Fale de forma amigável e próxima, como um consultor que quer ajudar
7. Use markdown para formatar (negrito, listas, etc)
8. Se não tiver informações suficientes, peça mais detalhes
9. SEMPRE responda em português brasileiro
10. Mantenha o contexto da conversa anterior quando relevante`;

      contentsToSend = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...historicoChat
      ];
    } else {
      contentsToSend = historicoChat;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modeloSelecionado}:generateContent?key=${data.apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contentsToSend
        })
      });
      
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message || 'Erro desconhecido na API');
      }
      
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui analisar agora. Tente novamente.";
      
      const mensagemAssistente = {
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo: text,
        data: new Date().toLocaleString('pt-BR')
      };
      
      adicionarMensagemAoChat(mensagemAssistente);
    } catch (error) {
      const errorMessage = `Erro ao consultar o conselheiro financeiro: ${error.message}`;
      const mensagemErro = {
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo: errorMessage,
        data: new Date().toLocaleString('pt-BR')
      };
      
      adicionarMensagemAoChat(mensagemErro);
    } finally {
      setData(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === prev.chatAtivoId ? { ...chat, loading: false } : chat
        )
      }));
      setAiLoading(false);
    }
  };

  const adicionarMensagemAoChat = (mensagem) => {
    setData(prev => {
      const chatAtual = prev.chats.find(chat => chat.id === prev.chatAtivoId);
      if (!chatAtual) return prev;
      
      return {
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === prev.chatAtivoId
            ? { ...chat, mensagens: [...chat.mensagens, mensagem] }
            : chat
        )
      };
    });
  };

  const formatarData = (dataStr) => {
    try {
      const data = new Date(dataStr);
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      
      if (data.toDateString() === hoje.toDateString()) {
        return 'Hoje';
      } else if (data.toDateString() === ontem.toDateString()) {
        return 'Ontem';
      } else {
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return dataStr;
    }
  };

  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
        }
      }}
    >
      <div className="bg-zinc-900/95 border border-white/10 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400 fill-indigo-400/20 animate-pulse-slow" size={20} /> 
              Conselheiro IA
            </h2>
            <button 
              onClick={() => setShowModal(false)} 
              className="p-2 hover:bg-white/5 rounded-full transition text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200 transition select-none">
              <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={incluirContexto}
                onChange={(e) => setIncluirContexto(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-zinc-600 bg-zinc-800 checked:border-indigo-500 checked:bg-indigo-500 transition-all"
                />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <span>Incluir contexto financeiro</span>
            </label>
            
            <div className="flex items-center gap-2 ml-auto">
              <Settings size={14} className="text-zinc-500" />
              <select
                value={modeloSelecionado}
                onChange={(e) => setModeloSelecionado(e.target.value)}
                className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition cursor-pointer appearance-none hover:bg-zinc-700/50"
              >
                <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 border-r border-white/5 bg-black/20 flex flex-col">
            <div className="p-4">
              <button
                onClick={criarNovoChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/20"
              >
                <Plus size={18} />
                Novo Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
              {data.chats && data.chats.length > 0 ? (
                <div className="space-y-1 pb-2">
                  {data.chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selecionarChat(chat.id)}
                      className={`p-3 rounded-xl transition-all group relative border ${
                        chat.loading 
                          ? 'opacity-60 cursor-not-allowed border-transparent' 
                          : 'cursor-pointer'
                      } ${
                        chat.id === data.chatAtivoId
                          ? 'bg-white/10 border-white/10 shadow-inner'
                          : 'hover:bg-white/5 border-transparent hover:border-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {editandoTitulo === chat.id ? (
                            <input
                              type="text"
                              value={novoTitulo}
                              onChange={(e) => setNovoTitulo(e.target.value)}
                              onBlur={() => salvarTitulo(chat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') salvarTitulo(chat.id);
                                if (e.key === 'Escape') cancelarEdicaoTitulo();
                              }}
                              className="w-full bg-black/40 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare size={14} className={`${chat.id === data.chatAtivoId ? 'text-indigo-400' : 'text-zinc-600'} flex-shrink-0 transition-colors`} />
                                <h3 
                                  className={`font-medium text-sm truncate ${chat.id === data.chatAtivoId ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'} transition-colors`}
                                  onDoubleClick={(e) => iniciarEdicaoTitulo(chat, e)}
                                  title="Duplo clique para editar"
                                >
                                  {chat.titulo}
                                </h3>
                              </div>
                              {chat.loading ? (
                                <p className="text-xs text-indigo-400 truncate flex items-center gap-1 ml-5">
                                  <Sparkles size={10} className="animate-pulse" />
                                  Respondendo...
                                </p>
                              ) : chat.mensagens.length > 0 ? (
                                <p className="text-xs text-zinc-600 group-hover:text-zinc-500 truncate ml-5">
                                  {chat.mensagens[chat.mensagens.length - 1].conteudo.substring(0, 40)}...
                                </p>
                              ) : null}
                            </>
                          )}
                        </div>
                        <button
                          onClick={(e) => excluirChat(chat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded-lg transition text-zinc-500 hover:text-rose-400 absolute right-2 top-2"
                          title="Excluir chat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-zinc-600 text-sm">
                  Nenhum chat ainda.
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-zinc-950/50 relative">
            <div 
              ref={(el) => {
                messagesContainerRef.current = el;
                if (el && chatAtivo && chatAtivo.mensagens.length > 0) {
                  el.scrollTop = el.scrollHeight;
                  requestAnimationFrame(() => {
                    if (el) {
                      el.scrollTop = el.scrollHeight;
                    }
                  });
                }
              }} 
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              style={{ scrollBehavior: 'auto' }}
            >
              {chatAtivo && chatAtivo.mensagens.length === 0 ? (
                <div className="h-full flex items-center justify-center animate-enter">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="bg-gradient-to-b from-indigo-500/10 to-purple-500/10 p-8 rounded-3xl border border-white/5 shadow-2xl">
                      <Sparkles className="text-indigo-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" size={48} />
                      <h3 className="text-xl font-bold text-white mb-2">Olá! Sou seu Conselheiro IA</h3>
                      <p className="text-zinc-400 mb-6 leading-relaxed">Estou aqui para ajudar com suas finanças. Pergunte sobre seus gastos, projeções ou peça dicas.</p>
                      
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button 
                          onClick={() => setInputMensagem("Posso comprar um Monitor de R$800 agora?")} 
                          className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-full text-xs text-zinc-300 transition hover:scale-105"
                        >
                          Posso comprar algo de R$800?
                        </button>
                        <button 
                          onClick={() => setInputMensagem("Como está minha saúde financeira?")} 
                          className="bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-full text-xs text-zinc-300 transition hover:scale-105"
                        >
                          Minha saúde financeira
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {chatAtivo?.mensagens.map((mensagem, index) => {
                    const mostrarData = index === 0 || 
                      (chatAtivo.mensagens[index - 1] && 
                       formatarData(chatAtivo.mensagens[index - 1].data) !== formatarData(mensagem.data));
                    
                    const mensagemAnterior = index > 0 ? chatAtivo.mensagens[index - 1] : null;
                    const mostrarEspaco = mensagemAnterior && mensagemAnterior.tipo !== mensagem.tipo;
                    
                    return (
                      <div key={mensagem.id} className="animate-slide-up">
                        {mostrarData && (
                          <div className="text-center my-6">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/80 px-3 py-1 rounded-full border border-white/5">
                              {formatarData(mensagem.data)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${mensagem.tipo === 'user' ? 'justify-end' : 'justify-start'} ${mostrarEspaco ? 'mt-4' : 'mt-2'}`}>
                          <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-lg ${
                            mensagem.tipo === 'user'
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-indigo-900/20'
                              : 'bg-zinc-800/80 backdrop-blur text-zinc-100 rounded-bl-sm border border-white/5 shadow-black/20'
                          }`}>
                            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line markdown-content">
                              {mensagem.conteudo}
                            </div>
                            <div className={`text-[10px] mt-2 text-right opacity-60`}>
                              {new Date(mensagem.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {chatAtivoLoading && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-zinc-800/50 text-zinc-300 rounded-2xl rounded-bl-sm px-5 py-4 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-xs font-medium text-indigo-300">Analisando finanças...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </>
              )}
            </div>

            <div className="p-4 bg-zinc-900/80 backdrop-blur border-t border-white/5">
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                <input 
                  ref={inputRef}
                  type="text" 
                      className="relative w-full bg-zinc-900 border border-white/10 rounded-xl px-5 py-4 focus:outline-none text-white placeholder-zinc-500 transition-colors duration-200"
                      placeholder={chatAtivoLoading ? "Aguardando resposta..." : "Digite sua pergunta aqui..."}
                  value={inputMensagem}
                  onChange={(e) => setInputMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !chatAtivoLoading) {
                      e.preventDefault();
                      handleEnviarMensagem();
                    }
                  }}
                  disabled={chatAtivoLoading}
                />
                </div>
                <button 
                  onClick={handleEnviarMensagem} 
                  disabled={chatAtivoLoading || !inputMensagem.trim()}
                  className="h-[58px] px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {chatAtivoLoading ? (
                    <Sparkles className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
