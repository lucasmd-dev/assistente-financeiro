const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export const parseCurrencyInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return (Number(digits) / 100).toFixed(2);
};

export const formatCurrencyInput = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return brlFormatter.format(numericValue);
};
