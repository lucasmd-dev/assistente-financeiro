'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Spinner } from '@heroui/react';
import { KeyRound, MessageSquare, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import type { Derivations } from '@/lib/finance';
import { MODELO_ANALISE, enviarAnalise, gerarSystemPrompt, montarContents } from '@/lib/gemini';
import { createNovoChat } from '@/lib/state';
import type { ChatMessage, FinanceData } from '@/lib/types';
import { GlowButton } from '@/components/ui/GlowButton';
import { Pill } from '@/components/ui/Pill';
import { MarkdownLite } from './MarkdownLite';
import { cn } from '@/lib/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: FinanceData;
  setData: Dispatch<SetStateAction<FinanceData>>;
  derived: Derivations;
  onOpenApiKey: () => void;
  apiKeyModalOpen: boolean;
}

const now = () => new Date().toISOString();

function parseChatDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
function formatarData(value: string): string {
  const d = parseChatDate(value);
  if (!d) return '';
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatarHora(value: string): string {
  const d = parseChatDate(value);
  return d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
}

export function ChatInterface({ isOpen, onClose, data, setData, derived, onOpenApiKey, apiKeyModalOpen }: Props) {
  const [input, setInput] = useState('');
  const [editandoTitulo, setEditandoTitulo] = useState<string | null>(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatAtivo = data.chats?.find((c) => c.id === data.chatAtivoId) || data.chats?.[0];
  const loading = chatAtivo?.loading || false;
  const apiKeyConfigurada = Boolean(data.apiKey?.trim());

  const comprasVisiveis = derived.comprasAtivas.filter((c) => !c.oculta);
  const estornosVisiveis = derived.estornosPendentes;

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
    });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, chatAtivo?.mensagens.length, data.chatAtivoId]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    const onKey = (e: KeyboardEvent) => {
      if (apiKeyModalOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, apiKeyModalOpen, onClose]);

  const adicionarMensagem = (mensagem: ChatMessage) =>
    setData((prev) => ({
      ...prev,
      chats: prev.chats.map((c) =>
        c.id === prev.chatAtivoId ? { ...c, mensagens: [...c.mensagens, mensagem] } : c,
      ),
    }));
  const setChatLoading = (value: boolean) =>
    setData((prev) => ({
      ...prev,
      chats: prev.chats.map((c) => (c.id === prev.chatAtivoId ? { ...c, loading: value } : c)),
    }));

  const criarNovoChat = () => {
    if (data.chats?.some((c) => c.loading)) return;
    const novo = createNovoChat();
    setData((prev) => ({ ...prev, chats: [novo, ...(prev.chats || [])], chatAtivoId: novo.id }));
    setInput('');
  };
  const selecionarChat = (id: string) => {
    if (data.chats.find((c) => c.id === id)?.loading) return;
    setData((prev) => ({ ...prev, chatAtivoId: id }));
    setInput('');
  };
  const excluirChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setData((prev) => {
      if (prev.chats.length === 1) {
        const novo = createNovoChat();
        return { ...prev, chats: [novo], chatAtivoId: novo.id };
      }
      const restantes = prev.chats.filter((c) => c.id !== id);
      const ativo = id === prev.chatAtivoId ? restantes[0].id : prev.chatAtivoId;
      return { ...prev, chats: restantes, chatAtivoId: ativo };
    });
  };
  const salvarTitulo = (id: string) => {
    if (novoTitulo.trim()) {
      setData((prev) => ({
        ...prev,
        chats: prev.chats.map((c) => (c.id === id ? { ...c, titulo: novoTitulo.trim() } : c)),
      }));
    }
    setEditandoTitulo(null);
    setNovoTitulo('');
  };
  const gerarTituloAutomatico = (msg: string) => {
    const palavras = msg.split(' ').slice(0, 5);
    return palavras.join(' ') + (msg.split(' ').length > 5 ? '…' : '');
  };

  const handleEnviar = async () => {
    if (!input.trim() || loading || !chatAtivo) return;
    const texto = input.trim();
    const eraVazio = chatAtivo.mensagens.length === 0;
    setInput('');

    if (!data.apiKey || !data.apiKey.trim()) {
      adicionarMensagem({
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo:
          '⚠️ **Chave da API não configurada.**\n\nCadastre a chave do Google Gemini nas configurações antes de usar a análise financeira.',
        data: now(),
      });
      return;
    }

    const msgUser: ChatMessage = { id: `msg-${Date.now()}`, tipo: 'user', conteudo: texto, data: now() };
    if (eraVazio) {
      const titulo = gerarTituloAutomatico(texto);
      setData((prev) => ({
        ...prev,
        chats: prev.chats.map((c) => (c.id === prev.chatAtivoId ? { ...c, titulo } : c)),
      }));
    }
    adicionarMensagem(msgUser);
    setChatLoading(true);

    try {
      const systemPrompt = gerarSystemPrompt(data, derived.timeline, comprasVisiveis, estornosVisiveis);
      const contents = montarContents(systemPrompt, [...chatAtivo.mensagens, msgUser]);
      const text = await enviarAnalise(data.apiKey.trim(), contents);
      adicionarMensagem({ id: `msg-${Date.now()}`, tipo: 'assistant', conteudo: text, data: now() });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ocorreu um erro inesperado durante a análise.';
      adicionarMensagem({
        id: `msg-${Date.now()}`,
        tipo: 'assistant',
        conteudo: `Erro ao processar a análise financeira: ${msg}`,
        data: now(),
      });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[75] grid place-items-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-md" aria-hidden />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="glass-strong edge-light relative flex h-[88dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] shadow-[var(--shadow-glass)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-edge)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl border border-[oklch(0.82_0.15_210/0.4)] bg-[oklch(0.82_0.15_210/0.14)] text-[oklch(0.9_0.12_210)]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg leading-tight font-bold text-white">Análise financeira</h2>
                  <p className="text-xs text-white/45">Pergunte sobre compras, aperto de caixa ou projeção.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="cyan" className="hidden sm:inline-flex">{MODELO_ANALISE}</Pill>
                <button
                  onClick={onOpenApiKey}
                  aria-label="Alterar chave da API"
                  className="grid size-9 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  onClick={onClose}
                  aria-label="Fechar análise"
                  className="grid size-9 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!apiKeyConfigurada && (
              <div className="border-b border-[oklch(0.85_0.16_82/0.3)] bg-[oklch(0.85_0.16_82/0.1)] px-5 py-3 text-sm text-[oklch(0.9_0.14_82)]">
                Configure sua chave do Google AI Studio para usar a análise. Ela fica salva só neste navegador.{' '}
                <button onClick={onOpenApiKey} className="font-semibold underline underline-offset-2">
                  Configurar chave
                </button>
              </div>
            )}

            <div className="flex min-h-0 flex-1">
              {/* Sidebar */}
              <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-edge)] md:flex">
                <div className="p-3">
                  <GlowButton tone="accent" size="sm" fullWidth onClick={criarNovoChat}>
                    <Plus size={16} /> Nova conversa
                  </GlowButton>
                </div>
                <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                  {data.chats?.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selecionarChat(chat.id)}
                      className={cn(
                        'group flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors',
                        chat.id === data.chatAtivoId
                          ? 'border-[oklch(0.7_0.18_286/0.4)] bg-[oklch(0.64_0.25_286/0.12)]'
                          : 'border-transparent hover:bg-white/[0.04]',
                      )}
                    >
                      <MessageSquare size={14} className="shrink-0 text-white/40" />
                      <div className="min-w-0 flex-1">
                        {editandoTitulo === chat.id ? (
                          <input
                            value={novoTitulo}
                            onChange={(e) => setNovoTitulo(e.target.value)}
                            onBlur={() => salvarTitulo(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') salvarTitulo(chat.id);
                              if (e.key === 'Escape') { setEditandoTitulo(null); setNovoTitulo(''); }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full rounded-md bg-white/10 px-1.5 py-1 text-sm text-white outline-none"
                          />
                        ) : (
                          <>
                            <h3
                              className="truncate text-sm font-medium text-white/85"
                              onDoubleClick={(e) => { e.stopPropagation(); setEditandoTitulo(chat.id); setNovoTitulo(chat.titulo); }}
                            >
                              {chat.titulo}
                            </h3>
                            <p className="truncate text-[0.7rem] text-white/35">
                              {chat.loading
                                ? 'Gerando análise…'
                                : chat.mensagens.length > 0
                                  ? chat.mensagens[chat.mensagens.length - 1].conteudo.substring(0, 40)
                                  : 'Sem mensagens ainda.'}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={(e) => excluirChat(chat.id, e)}
                        aria-label="Excluir conversa"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 size={13} className="text-white/40 hover:text-[oklch(0.8_0.2_14)]" />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>

              {/* Main */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div ref={streamRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
                  {chatAtivo && chatAtivo.mensagens.length === 0 ? (
                    <EmptyChat apiKeyConfigurada={apiKeyConfigurada} onSuggestion={setInput} onOpenApiKey={onOpenApiKey} />
                  ) : (
                    <>
                      {chatAtivo?.mensagens.map((m, i) => {
                        const dataFmt = formatarData(m.data);
                        const showDate = i === 0 || formatarData(chatAtivo.mensagens[i - 1].data) !== dataFmt;
                        return (
                          <div key={m.id}>
                            {showDate && dataFmt && (
                              <div className="my-3 flex items-center justify-center">
                                <span className="rounded-full bg-white/[0.06] px-3 py-0.5 text-[0.65rem] text-white/40">{dataFmt}</span>
                              </div>
                            )}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                              className={cn('flex', m.tipo === 'user' ? 'justify-end' : 'justify-start')}
                            >
                              <div
                                className={cn(
                                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                                  m.tipo === 'user'
                                    ? 'bg-[linear-gradient(135deg,oklch(0.64_0.25_286),oklch(0.58_0.24_295))] text-white'
                                    : 'glass border border-[var(--color-edge)]',
                                )}
                              >
                                {m.tipo === 'user' ? (
                                  <p className="text-sm whitespace-pre-line">{m.conteudo}</p>
                                ) : (
                                  <MarkdownLite content={m.conteudo} />
                                )}
                                <div className={cn('mt-1 text-[0.65rem]', m.tipo === 'user' ? 'text-white/60' : 'text-white/35')}>
                                  {formatarHora(m.data)}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="glass flex items-center gap-2 rounded-2xl border border-[var(--color-edge)] px-4 py-3">
                            <Spinner size="sm" />
                            <span className="text-xs text-white/45">Montando a análise…</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-[var(--color-edge)] p-3 sm:p-4">
                  <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-edge-strong)] bg-white/[0.03] p-1.5 focus-within:border-[oklch(0.7_0.18_286/0.6)]">
                    <input
                      ref={inputRef}
                      type="text"
                      autoComplete="off"
                      value={input}
                      disabled={loading}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !loading) {
                          e.preventDefault();
                          handleEnviar();
                        }
                      }}
                      placeholder={loading ? 'Aguardando resposta…' : 'Descreva sua dúvida ou o cenário que quer avaliar…'}
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none"
                    />
                    <motion.button
                      onClick={handleEnviar}
                      disabled={loading || !input.trim()}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Enviar"
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,oklch(0.64_0.25_286),oklch(0.58_0.24_295))] text-white shadow-[0_8px_24px_-10px_oklch(0.64_0.25_286/0.9)] transition-opacity disabled:opacity-40"
                    >
                      {loading ? <Spinner size="sm" /> : <Send size={18} />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EmptyChat({
  apiKeyConfigurada,
  onSuggestion,
  onOpenApiKey,
}: {
  apiKeyConfigurada: boolean;
  onSuggestion: (s: string) => void;
  onOpenApiKey: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="grid size-16 place-items-center rounded-3xl border border-[oklch(0.7_0.18_286/0.4)] bg-[oklch(0.64_0.25_286/0.14)] text-[oklch(0.82_0.14_286)] shadow-[var(--shadow-glow-violet)]"
      >
        <Sparkles size={32} />
      </motion.div>
      <div>
        <h3 className="font-display text-lg font-bold text-white">
          {apiKeyConfigurada ? 'Faça uma pergunta' : 'Falta a chave da API'}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-white/45">
          {apiKeyConfigurada
            ? 'Descreva uma compra, uma preocupação do mês ou peça uma leitura do horizonte.'
            : 'Configure a chave do Google AI Studio para liberar a análise com base nos seus dados.'}
        </p>
      </div>
      {apiKeyConfigurada ? (
        <div className="flex flex-wrap justify-center gap-2">
          {['Posso comprar um monitor de R$ 800 agora?', 'Como está minha saúde financeira?'].map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="rounded-full border border-[var(--color-edge-strong)] bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-colors hover:border-[oklch(0.7_0.18_286/0.6)] hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <GlowButton tone="accent" onClick={onOpenApiKey}>
          Cadastrar minha chave
        </GlowButton>
      )}
    </div>
  );
}
