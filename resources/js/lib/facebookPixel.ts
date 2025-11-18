/**
 * Facebook Pixel Helper
 * Utilitário para gerenciar eventos do Facebook Pixel
 */

declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, any>
    ) => void;
  }
}

/**
 * Verifica se o Facebook Pixel está carregado
 */
export const isFbqLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

/**
 * Track CompleteRegistration - quando o usuário inicia o cadastro
 */
export const trackCompleteRegistration = () => {
  if (!isFbqLoaded()) {
    console.warn('Facebook Pixel não está carregado');
    return;
  }

  try {
    window.fbq('track', 'CompleteRegistration', {
      stage: 'start',
      status: 'initiated',
      funnel_step: 'cadastro_inicio',
    });
  } catch (error) {
    console.error('Erro ao rastrear CompleteRegistration:', error);
  }
};

/**
 * Track Lead - quando o cadastro é concluído com sucesso
 */
export const trackLeadCompleted = () => {
  if (!isFbqLoaded()) {
    console.warn('Facebook Pixel não está carregado');
    return;
  }

  try {
    // Primeiro evento Lead (cadastro concluído)
    window.fbq('track', 'Lead', {
      content_name: 'Cadastro Concluido',
      lead_type: 'qualificado',
      qualification_level: 'high',
      registration_status: 'success',
      funnel_step: 'cadastro_final',
    });

    // Segundo evento Lead (registrado)
    window.fbq('track', 'Lead', {
      value: 0.0,
      currency: 'BRL',
      content_name: 'Cadastro Plataforma',
      status: 'registrado',
    });
  } catch (error) {
    console.error('Erro ao rastrear Lead:', error);
  }
};

/**
 * Track PageView - rastrear visualização de página
 */
export const trackPageView = () => {
  if (!isFbqLoaded()) {
    console.warn('Facebook Pixel não está carregado');
    return;
  }

  try {
    window.fbq('track', 'PageView');
  } catch (error) {
    console.error('Erro ao rastrear PageView:', error);
  }
};

