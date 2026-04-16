import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Sparkles, X, Plus, Trash2, MessageSquare, Send, KeyRound } from 'lucide-react';

const MODELO_ANALISE = 'gemini-2.5-flash';
const TRANSIENT_ERROR_STATUS = new Set([429, 500, 503, 504]);

const ChatInterface = ({
  data,
  setData,
  showModal,
  setShowModal,
  apiKeyModalOpen,
  openApiKeyModal,
  formatCurrency,
  timeline,
  comprasVisiveis = [],
  estornosVisiveis = []
}) => {
  const [inputMensagem, setInputMensagem] = useState('');
  const [editandoTitulo, setEditandoTitulo] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const chatAtivo = data.chats?.find(chat => chat.id === data.chatAtivoId) || data.chats?.[0];
  const chatAtivoLoading = chatAtivo?.loading || false;
  const apiKeyConfigurada = Boolean(data.apiKey?.trim());

  const gerarTimestamp = () => new Date().toISOString();

  const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const parseChatDate = (value) => {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const directDate = new Date(value);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }

    const ptBrMatch = value.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:,\s*(\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (!ptBrMatch) {
      return null;
    }

    const [, day, month, year, hour = '00', minute = '00', second = '00'] = ptBrMatch;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const formatarErroAnalise = (status, message) => {
    const normalizedMessage = (message || '').toLowerCase();

    if (normalizedMessage.includes('api key not valid')) {
      return 'Chave da API inválida. Gere uma nova chave no Google AI Studio e atualize a configuração.';
    }

    if (normalizedMessage.includes('high demand') || status === 503) {
      return 'O modelo está com alta demanda no momento. Tente novamente em alguns instantes.';
    }

    if (status === 429 || normalizedMessage.includes('rate limit') || normalizedMessage.includes('quota')) {
      return 'O limite temporário da API foi atingido. Aguarde um pouco e tente novamente.';
    }

    if (normalizedMessage.includes('free tier is not available in your country')) {
      return 'O plano gratuito da Gemini API não está disponível para esse projeto ou região. Verifique o projeto no Google AI Studio.';
    }

    if (status === 403) {
      return 'Essa chave não tem permissão para usar a Gemini API nesse projeto.';
    }

    if (status === 500 || status === 504) {
      return 'A análise não pôde ser concluída agora. Tente novamente em instantes.';
    }

    return message || 'Ocorreu um erro inesperado durante a análise.';
  };

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
        if (apiKeyModalOpen) {
          return;
        }

        if (event.key === 'Escape') {
          setShowModal(false);
        }
      };
      window.addEventListener('keydown', handleEsc);

      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [showModal, data.chatAtivoId, apiKeyModalOpen, setShowModal]);

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
        conteudo: '⚠️ **Chave da API não configurada.**\n\nCadastre a chave do Google Gemini nas configurações antes de usar a análise financeira.',
        data: gerarTimestamp()
      };

      adicionarMensagemAoChat(mensagemErro);
      return;
    }

    const mensagemUsuario = {
      id: `msg-${Date.now()}`,
      tipo: 'user',
      conteudo: mensagemTexto,
      data: gerarTimestamp()
    };

    const historicoChat = [...chatAtivo.mensagens, mensagemUsuario].map(msg => ({
      role: msg.tipo === 'user' ? 'user' : 'model',
      parts: [{ text: msg.conteudo }]
    }));

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

    let contentsToSend;

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
      : ['Nenhuma receita mensal já lançada'];

    const financialContext = {
      dataAtual: dataAtual,
      saldoAtual: formatCurrency(parseFloat(data.saldoAtual) || 0),
      receitaMensal: formatCurrency(parseFloat(data.salarioMensal) || 0),
      despesasFixas: formatCurrency((data.despesas || []).reduce((sum, d) => sum + parseFloat(d.valor || 0), 0) || parseFloat(data.despesasFixas || 0) + parseFloat(data.despesasVariaveis || 0)),
      despesasCadastradas: (data.despesas || []).length > 0
        ? data.despesas.map(d => `${d.nome}: ${formatCurrency(d.valor)}/mês`)
        : ['Nenhuma despesa cadastrada'],
      diaFechamentoFatura: data.diaFechamento,
      receitaMensalLancada: salariosRecebidosFormatados,
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

IMPORTANTE SOBRE A RECEITA MENSAL:
- Os meses listados em "receitaMensalLancada" já tiveram a receita mensal incorporada ao saldo atual
- Nos meses marcados como "salarioJaRecebido: true" na projeção, a receita mensal não deve ser somada novamente
- Use a data atual para contextualizar suas respostas sobre prazos, vencimentos e planejamento

INSTRUÇÕES PARA SUAS RESPOSTAS:
1. Analise friamente se a compra/pergunta cabe no orçamento
2. Se a sobra mensal for baixa (menor que R$500), ALERTE sobre o perigo
3. Se for uma compra parcelada mencionada, verifique se a parcela cabe na sobra mensal prevista dos próximos meses
4. Considere o saldo acumulado - se estiver negativo em algum mês, ALERTE
5. Seja claro, direto e respeitoso, sem exagerar no tom
6. Explique o principal motivo por trás de cada recomendação
7. Use markdown de forma simples para organizar a resposta
8. Se não tiver informações suficientes, peça mais detalhes
9. SEMPRE responda em português brasileiro
10. Mantenha o contexto da conversa anterior quando relevante`;

    contentsToSend = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...historicoChat
    ];

    try {
      let result = null;
      let responseStatus = null;
      let responseMessage = '';

      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO_ANALISE}:generateContent?key=${data.apiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contentsToSend
          })
        });

        responseStatus = response.status;

        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (response.ok && !payload.error) {
          result = payload;
          break;
        }

        responseMessage = payload?.error?.message || 'Erro desconhecido na API';

        if (attempt === 0 && TRANSIENT_ERROR_STATUS.has(responseStatus)) {
          const retryAfterHeader = response.headers.get('retry-after');
          const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;
          const retryDelayMs = Number.isFinite(retryAfterSeconds)
            ? retryAfterSeconds * 1000
            : responseStatus === 429
              ? 3000
              : 1500;

          await esperar(retryDelayMs);
          continue;
        }

        throw new Error(formatarErroAnalise(responseStatus, responseMessage));
      }

      if (!result) {
        throw new Error(formatarErroAnalise(responseStatus, responseMessage));
      }

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui analisar agora. Tente novamente.";

      const mensagemAssistente = {
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo: text,
        data: gerarTimestamp()
      };

      adicionarMensagemAoChat(mensagemAssistente);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Ocorreu um erro inesperado durante a análise.';
      const errorMessage = `Erro ao processar a análise financeira: ${errorText}`;
      const mensagemErro = {
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo: errorMessage,
        data: gerarTimestamp()
      };

      adicionarMensagemAoChat(mensagemErro);
    } finally {
      setData(prev => ({
        ...prev,
        chats: prev.chats.map(chat =>
          chat.id === prev.chatAtivoId ? { ...chat, loading: false } : chat
        )
      }));
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
    const data = parseChatDate(dataStr);

    if (!data) {
      return '';
    }

    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    }

    if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    }

    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatarHora = (dataStr) => {
    const data = parseChatDate(dataStr);

    if (!data) {
      return '';
    }

    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!showModal) return null;

  return (
    <div
      className="overlay-shell"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowModal(false);
        }
      }}
    >
      <div className="chat-shell surface-enter">
        <div className="chat-header">
          <div className="chat-header__title">
            <span className="panel-kicker">Análise</span>
            <h2>Leitura rápida</h2>
            <p className="section-description">Pergunte sobre compra, aperto de caixa ou projeção.</p>
          </div>
          <div className="chat-header__tools">
            <span className="info-chip info-chip--accent">Modelo {MODELO_ANALISE}</span>
            <button type="button" onClick={openApiKeyModal} className="icon-button" title="Alterar chave da API">
              <KeyRound size={16} />
            </button>
            <button onClick={() => setShowModal(false)} className="modal-close" title="Fechar análise">
              <X size={20} />
            </button>
          </div>
        </div>

        {!apiKeyConfigurada && (
          <div className="chat-alert">
            Configure sua chave do Google AI Studio para usar a análise. Ela fica salva só neste navegador.
            <div className="mt-3">
              <button type="button" onClick={openApiKeyModal} className="button-secondary">
                Configurar chave
              </button>
            </div>
          </div>
        )}

        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-sidebar__top">
              <button onClick={criarNovoChat} className="chat-thread-create">
                <Plus size={18} />
                Nova conversa
              </button>
            </div>

            <div className="chat-thread-list custom-scrollbar">
              {data.chats && data.chats.length > 0 ? (
                <div className="list-stack">
                  {data.chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selecionarChat(chat.id)}
                      className={`chat-thread ${chat.id === data.chatAtivoId ? 'chat-thread--active' : ''} ${chat.loading ? 'chat-thread--busy' : ''}`}
                    >
                      <MessageSquare size={15} className="chat-thread__icon" />
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
                            className="field-input h-10 min-h-0 px-3 py-2 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <h3 className="chat-thread__title" onDoubleClick={(e) => iniciarEdicaoTitulo(chat, e)} title="Duplo clique para editar">
                              {chat.titulo}
                            </h3>
                            {chat.loading ? (
                              <p className="chat-thread__preview flex items-center gap-2">
                                <Sparkles size={12} />
                                Gerando análise...
                              </p>
                            ) : chat.mensagens.length > 0 ? (
                              <p className="chat-thread__preview truncate">{chat.mensagens[chat.mensagens.length - 1].conteudo.substring(0, 54)}...</p>
                            ) : (
                              <p className="chat-thread__preview">Sem mensagens ainda.</p>
                            )}
                          </>
                        )}
                      </div>
                      <button onClick={(e) => excluirChat(chat.id, e)} className="chat-thread__delete row-icon-button row-icon-button--negative" title="Excluir chat">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <MessageSquare size={40} strokeWidth={1.2} className="empty-state__icon" />
                  <p>Nenhuma conversa criada.</p>
                </div>
              )}
            </div>
          </aside>

          <div className="chat-main">
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
              className="chat-stream custom-scrollbar"
            >
              {chatAtivo && chatAtivo.mensagens.length === 0 ? (
                <div className="chat-empty animate-enter">
                  <div className="chat-empty__orb">
                    <Sparkles size={34} />
                  </div>
                  <h3 className="chat-empty__title">{apiKeyConfigurada ? 'Faça uma pergunta' : 'Falta a chave da API'}</h3>
                  <p className="chat-empty__description">
                    {apiKeyConfigurada
                      ? 'Descreva uma compra, uma preocupação do mês ou peça uma leitura do horizonte.'
                      : 'Depois de configurar a chave no Google AI Studio, este painel já pode responder com base nos seus dados.'}
                  </p>

                  {apiKeyConfigurada ? (
                    <div className="chat-suggestion-row">
                      <button onClick={() => setInputMensagem('Posso comprar um monitor de R$ 800 agora?')} className="chat-suggestion">
                        Monitor de R$800 cabe?
                      </button>
                      <button onClick={() => setInputMensagem('Como está minha saúde financeira?')} className="chat-suggestion">
                        Como está meu cenário?
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <button type="button" onClick={openApiKeyModal} className="button-primary button-primary--accent">
                        Cadastrar minha chave
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {chatAtivo?.mensagens.map((mensagem, index) => {
                    const dataFormatada = formatarData(mensagem.data);
                    const mostrarData =
                      index === 0 ||
                      (chatAtivo.mensagens[index - 1] &&
                        formatarData(chatAtivo.mensagens[index - 1].data) !== formatarData(mensagem.data));

                    const mensagemAnterior = index > 0 ? chatAtivo.mensagens[index - 1] : null;
                    const mostrarEspaco = mensagemAnterior && mensagemAnterior.tipo !== mensagem.tipo;

                    return (
                      <div key={mensagem.id} className="animate-slide-up">
                        {mostrarData && dataFormatada && (
                          <div className="chat-date-divider">
                            <span>{dataFormatada}</span>
                          </div>
                        )}
                        <div className={`chat-bubble-row ${mensagem.tipo === 'user' ? 'chat-bubble-row--user' : 'chat-bubble-row--assistant'} ${mostrarEspaco ? 'mt-4' : 'mt-2'}`}>
                          <div className={`chat-bubble ${mensagem.tipo === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
                            <div className="markdown-content whitespace-pre-line">{mensagem.conteudo}</div>
                            <div className="chat-bubble__time">{formatarHora(mensagem.data)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {chatAtivoLoading && (
                    <div className="chat-bubble-row chat-bubble-row--assistant animate-slide-up">
                      <div className="chat-loading">
                        <div className="chat-loading__dots">
                          <span className="chat-loading__dot" style={{ animationDelay: '0ms' }} />
                          <span className="chat-loading__dot" style={{ animationDelay: '150ms' }} />
                          <span className="chat-loading__dot" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="chat-thread__preview">Montando a análise...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-4" />
                </>
              )}
            </div>

            <div className="chat-composer">
              <div className="chat-composer__inner">
                <input
                  ref={inputRef}
                  id="analise-financeira-input"
                  name="analise_financeira_input"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="chat-input"
                  placeholder={chatAtivoLoading ? 'Aguardando resposta...' : 'Descreva sua dúvida ou o cenário que quer avaliar...'}
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
                <button onClick={handleEnviarMensagem} disabled={chatAtivoLoading || !inputMensagem.trim()} className="chat-send">
                  {chatAtivoLoading ? <Sparkles className="animate-spin" size={20} /> : <Send size={20} />}
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
