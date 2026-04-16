# Assistente Financeiro

Aplicação web para planejamento financeiro pessoal com foco em clareza operacional. O projeto reúne saldo atual, despesas recorrentes, compras parceladas, estornos, lançamentos extras e projeção de caixa para os próximos 12 meses em uma interface única.

## Visão geral

A proposta deste projeto é resolver um problema cotidiano: entender, de forma rápida, como decisões do presente afetam o orçamento dos meses seguintes. Em vez de depender de planilhas, a aplicação centraliza as regras financeiras no front-end e mantém os dados persistidos localmente no navegador.

## Funcionalidades principais

- Cadastro do saldo atual e da receita mensal.
- Projeção financeira de 12 meses com saldo acumulado.
- Controle de compras parceladas considerando dia de fechamento do cartão.
- Registro de estornos, com impacto automático na fatura do mês.
- Cadastro de despesas recorrentes com início programado e limite de recorrência.
- Lançamento de entradas e despesas extras por mês.
- Visão detalhada de cada mês, com resumo de entradas, despesas e fatura.
- Backup em JSON e geração de relatório em TXT.

## Regras de negócio implementadas

- Compras parceladas entram na competência correta de acordo com o dia de fechamento do cartão.
- Estornos reduzem o valor da fatura do mês correspondente.
- Despesas recorrentes podem ser permanentes ou limitadas por quantidade de meses.
- Entradas e despesas extras podem ser ativadas ou desativadas sem perda do histórico.
- Meses já marcados como recebidos não duplicam a receita na projeção.

## Stack

- React 18
- Vite
- Tailwind CSS
- lucide-react
- localStorage para persistência
- Integração opcional com Google Gemini API

## Estrutura

- `src/App.jsx`: concentra o fluxo principal, a projeção financeira e a orquestração dos modais.
- `src/components/Modal.jsx`: formulários de cadastro e edição.
- `src/components/ModalDetalhesMes.jsx`: detalhamento mensal da projeção.
- `src/components/ChatInterface.jsx`: análise financeira assistida com contexto do planejamento atual.
- `src/components/Calendar.jsx`: seletor de data customizado.

## Como executar localmente

Pré-requisito recomendado: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.

## Build

```bash
npm run build
```

## Demonstração

Projeto publicado em: [assistente-financeiro-pi.vercel.app](https://assistente-financeiro-pi.vercel.app/)

## Observações sobre persistência e integração

- Os dados da aplicação ficam salvos no `localStorage` do navegador.
- A chave da API é armazenada localmente e não entra no arquivo exportado de backup.
- O projeto funciona sem a integração externa; a análise financeira é um recurso opcional.
