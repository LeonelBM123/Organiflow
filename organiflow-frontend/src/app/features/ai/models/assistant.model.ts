export interface LipSyncCue {
  start: number;
  end: number;
  value: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X'
}

export interface TtsResult {
  audioUrl: string;
  lipSyncData: LipSyncCue[];
  duration: number;
  revoke: () => void;
}

export interface AvatarOption {
  id: string;
  label: string;
  path: string;
  emoji: string;
}

export interface AssistantContext {
  pageId: string;
  pageTitle: string;
  description: string;
  enrichment?: string;
}

export interface AssistantAiResponse {
  text: string;
  [key: string]: unknown;
}

export interface AssistantPageBehavior {
  systemPrompt?: string;
  suggestedQuestions?: string[];
  onAiResponse?: (response: AssistantAiResponse) => void;
  /**
   * Modo especial de la página. En 'policy-recommend' el avatar enruta el texto
   * del usuario al recomendador de políticas (deep learning) en vez del LLM
   * genérico, y muestra el top-3 de workflows para que el usuario elija.
   */
  mode?: 'policy-recommend';
}
