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
}
