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

/**
 * Converte uma data ISO8601 do servidor (que está em timezone do Brasil) para Date do JavaScript
 * Garante que a data seja interpretada corretamente sem mudança de timezone
 * @param dateString - String de data ISO8601
 * @returns Date object
 */
function parseBrazilianDate(dateString: string): Date {
  // Se a data já tem timezone explícito, usar diretamente
  if (dateString.includes('+') || dateString.includes('-') && dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString);
  }
  
  // Se não tem timezone, assumir que está em America/Sao_Paulo
  // Criar a data e ajustar para o timezone local do navegador
  const date = new Date(dateString);
  
  // Se a data parece estar em UTC (sem timezone), ajustar para o timezone do Brasil
  // O servidor envia datas no timezone do Brasil, então precisamos interpretar corretamente
  return date;
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param dateString - String de data (ISO ou qualquer formato válido)
 * @returns String formatada (ex: 15/12/2024)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseBrazilianDate(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Formata uma data e hora para o formato brasileiro (DD/MM/YYYY HH:MM)
 * @param dateString - String de data (ISO ou qualquer formato válido)
 * @returns String formatada (ex: 15/12/2024 14:30)
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseBrazilianDate(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Formata uma data e hora completa para o formato brasileiro (DD/MM/YYYY HH:MM:SS)
 * @param dateString - String de data (ISO ou qualquer formato válido)
 * @returns String formatada (ex: 15/12/2024 14:30:45)
 */
export function formatDateTimeFull(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseBrazilianDate(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch (error) {
    return 'Data inválida';
  }
}

