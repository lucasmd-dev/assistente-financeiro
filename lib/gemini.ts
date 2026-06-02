// Integração com Google Gemini — lógica portada verbatim de ChatInterface.jsx.
// BYOK: a apiKey do usuário fica só no navegador e é enviada direto ao endpoint do Gemini.

import { formatCurrency } from './currency';
import type { ChatMessage, Compra, Estorno, FinanceData, TimelineMonth } from './types';

export const MODELO_ANALISE = 'gemini-2.5-flash';
const TRANSIENT_ERROR_STATUS = new Set([429, 500, 503, 504]);

export interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function formatarErroAnalise(status: number | null, message: string): string {
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
}

export function gerarSystemPrompt(
  data: FinanceData,
  timeline: TimelineMonth[],
  comprasVisiveis: Compra[],
  estornosVisiveis: Estorno[],
): string {
  const hoje = new Date();
  const dataAtual = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const salariosRecebidosFormatados =
    data.salariosRecebidos && data.salariosRecebidos.length > 0
      ? data.salariosRecebidos.map((mesKey) => {
          const [ano, mes] = mesKey.split('-');
          const dataMes = new Date(parseInt(ano), parseInt(mes) - 1, 1);
          return dataMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        })
      : ['Nenhuma receita mensal já lançada'];

  const financialContext = {
    dataAtual,
    saldoAtual: formatCurrency(parseFloat(String(data.saldoAtual)) || 0),
    receitaMensal: formatCurrency(parseFloat(String(data.salarioMensal)) || 0),
    despesasFixas: formatCurrency(
      (data.despesas || []).reduce((sum, d) => sum + parseFloat(String(d.valor || 0)), 0) ||
        parseFloat(String(data.despesasFixas || 0)) + parseFloat(String(data.despesasVariaveis || 0)),
    ),
    despesasCadastradas:
      (data.despesas || []).length > 0
        ? data.despesas.map((d) => `${d.nome}: ${formatCurrency(d.valor)}/mês`)
        : ['Nenhuma despesa cadastrada'],
    diaFechamentoFatura: data.diaFechamento,
    receitaMensalLancada: salariosRecebidosFormatados,
    comprasAtivas:
      comprasVisiveis.length > 0
        ? comprasVisiveis.map(
            (c) =>
              `${c.item}: ${formatCurrency(c.valorTotal)} em ${c.parcelas}x de ${formatCurrency(c.valorTotal / c.parcelas)}`,
          )
        : ['Nenhuma compra parcelada no momento'],
    estornos:
      estornosVisiveis.length > 0
        ? estornosVisiveis.map((e) => `${e.nome}: ${formatCurrency(e.valor)} no mês ${e.mes}`)
        : ['Nenhum estorno registrado'],
    entradasExtras:
      data.entradasExtras && data.entradasExtras.length > 0
        ? data.entradasExtras
            .filter((e) => e.ativo !== false)
            .map(
              (e) =>
                `${e.nome}: ${formatCurrency(e.valor)} no mês ${e.mes}${e.recorrente ? ' (recorrente)' : ''}`,
            )
        : ['Nenhuma entrada extra registrada'],
    proximosMeses: timeline.slice(0, 6).map((m) => ({
      mes: m.name,
      salarioJaRecebido: m.salarioJaRecebido,
      sobraMensal: formatCurrency(m.netResult),
      saldoAcumulado: formatCurrency(m.finalBalance),
    })),
  };

  return `Você é um consultor financeiro pessoal. Seu papel é ajudar o usuário a tomar decisões financeiras inteligentes.

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
}

export function montarContents(systemPrompt: string, mensagens: ChatMessage[]): GeminiContent[] {
  const historicoChat: GeminiContent[] = mensagens.map((msg) => ({
    role: msg.tipo === 'user' ? 'user' : 'model',
    parts: [{ text: msg.conteudo }],
  }));

  return [{ role: 'user', parts: [{ text: systemPrompt }] }, ...historicoChat];
}

/** Envia a análise ao Gemini com retry em erros transitórios. Retorna o texto ou lança Error. */
interface GeminiResult {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function enviarAnalise(apiKey: string, contents: GeminiContent[]): Promise<string> {
  let result: GeminiResult | null = null;
  let responseStatus: number | null = null;
  let responseMessage = '';

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_ANALISE}:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      },
    );

    responseStatus = response.status;

    let payload: { error?: { message?: string } } & GeminiResult = {};
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

    if (attempt === 0 && responseStatus !== null && TRANSIENT_ERROR_STATUS.has(responseStatus)) {
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

  return (
    result.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Não consegui analisar agora. Tente novamente.'
  );
}
