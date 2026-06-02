// Máscara e formatação de moeda BRL — portado verbatim de src/utils/currency.js.

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const parseCurrencyInput = (value: string | number | null | undefined): string => {
  const digits = String(value ?? '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return (Number(digits) / 100).toFixed(2);
};

export const formatCurrencyInput = (value: string | number | null | undefined): string => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return brlFormatter.format(numericValue);
};

// formatCurrency vivia inline em App.jsx; centralizado aqui.
export const formatCurrency = (val: number): string => brlFormatter.format(val);

// formatDate vivia inline em App.jsx (espera 'YYYY-MM-DD').
export const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

// Rótulo legível de competência 'YYYY-MM' -> 'Mai. de 2026'.
export const mesLabel = (mes: string): string => {
  const [ano, m] = mes.split('-').map(Number);
  const s = new Date(ano, (m || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
