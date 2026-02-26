# Assistente Financeiro

Aplicação web para planejamento financeiro pessoal com projeção de 12 meses, gestão de compras parceladas, estornos e conselheiro IA.

## Funcionalidades

- **Controle Financeiro**: Saldo atual, renda passiva e despesas fixas
- **Projeção**: Cálculo automático de 12 meses com saldo acumulado
- **Parcelados**: Gestão de compras parceladas no cartão de crédito
- **Estornos**: Registro de estornos que reduzem automaticamente a fatura do mês
- **Despesas**: Cadastro com suporte a limite de vezes e data de início
- **Entradas/Despesas Extras**: Registro por mês (informativo)
- **Conselheiro IA**: Análise financeira usando Google Gemini API
- **Backup**: Exportação e importação de dados (API key não inclui credenciais)
- **Relatórios**: Geração de relatórios textuais em TXT

## Tecnologias

- React 18
- Vite
- Tailwind CSS
- Lucide React (ícones)
- Google Gemini API

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

## Build

```bash
npm run build
```

## Deploy

Configurado para Vercel. O arquivo `vercel.json` já está configurado.

## Configuração

1. API Key do Google Gemini: configure nas configurações da aplicação (quando disponível)
2. Dados salvos localmente no navegador (localStorage)
3. Migração automática de dados antigos

## Teste

Aplicação disponível em: **[https://assistente-financeiro-pi.vercel.app/](https://assistente-financeiro-pi.vercel.app/)**
