import { Injectable, computed, inject, signal } from '@angular/core';
import { AssistantAiResponse, AssistantPageBehavior, AvatarOption, LipSyncCue } from '../models/assistant.model';
import { AVATAR_LIST } from '../config/assistant.config';
import { AssistantContextService } from './assistant-context.service';
import { OpenRouterService } from './azure-openai.service';

const BASE_SYSTEM_PROMPT = `Eres el asistente virtual de Organiflow, una plataforma de gestión
de workflows y políticas de negocio empresariales. Ayuda al usuario de forma clara y concisa.
Responde en el idioma del usuario. Máximo 3 oraciones salvo que el usuario pida más detalle.`;

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly context  = inject(AssistantContextService);
  private readonly openAi   = inject(OpenRouterService);

  private readonly _isVisible      = signal(true);
  private readonly _isSpeaking     = signal(false);
  private readonly _isThinking     = signal(false);
  private readonly _aiResponseText = signal('');
  private readonly _selectedAvatar = signal<AvatarOption>(AVATAR_LIST[0]);
  private readonly _lipSyncData    = signal<LipSyncCue[] | null>(null);

  readonly isVisible      = this._isVisible.asReadonly();
  readonly isSpeaking     = this._isSpeaking.asReadonly();
  readonly isThinking     = this._isThinking.asReadonly();
  readonly aiResponseText = this._aiResponseText.asReadonly();
  readonly selectedAvatar = this._selectedAvatar.asReadonly();
  readonly lipSyncData    = this._lipSyncData.asReadonly();
  readonly avatarList     = AVATAR_LIST;

  readonly suggestedQuestions = computed<string[]>(
    () => this.context.currentBehavior()?.suggestedQuestions ?? []
  );

  show(): void   { this._isVisible.set(true);  }
  hide(): void   { this._isVisible.set(false); }
  toggle(): void { this._isVisible.update(v => !v); }

  setSpeaking(val: boolean): void             { this._isSpeaking.set(val); }
  setLipSyncData(data: LipSyncCue[] | null): void { this._lipSyncData.set(data); }
  clearResponse(): void                       { this._aiResponseText.set(''); }
  selectAvatar(avatar: AvatarOption): void    { this._selectedAvatar.set(avatar); }

  registerBehavior(behavior: AssistantPageBehavior | null): void {
    this.context.registerBehavior(behavior);
  }

  async ask(question: string): Promise<AssistantAiResponse> {
    this._isThinking.set(true);
    this._aiResponseText.set('');

    try {
      const contextText  = this.context.fullContextText();
      const behavior     = this.context.currentBehavior();
      const systemPrompt = behavior?.systemPrompt
        ? `${BASE_SYSTEM_PROMPT}\n\n${behavior.systemPrompt}\n\nContexto actual: ${contextText}`
        : `${BASE_SYSTEM_PROMPT}\n\nContexto actual: ${contextText}`;

      const responseText = await this.openAi.ask([
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: question },
      ]);

      this._aiResponseText.set(responseText);
      const response: AssistantAiResponse = { text: responseText };
      behavior?.onAiResponse?.(response);
      return response;
    } finally {
      this._isThinking.set(false);
    }
  }
}
