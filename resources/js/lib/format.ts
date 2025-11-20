/**
 * Formata um número para o formato brasileiro de moeda
 * @param value - Valor numérico a ser formatado
 * @param showCurrency - Se deve mostrar o símbolo R$ (padrão: true)
 * @returns String formatada no padrão brasileiro (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number | string | null | undefined, showCurrency: boolean = true): string {
  if (value === null || value === undefined || value === '') {
    return showCurrency ? 'R$ 0,00' : '0,00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return showCurrency ? 'R$ 0,00' : '0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Formata um número para o formato brasileiro (sem moeda)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada (ex: 1.234,56)
 */
export function formatNumber(value: number | string | null | undefined): string {
  return formatCurrency(value, false);
}

