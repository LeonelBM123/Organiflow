import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
} from '@angular/core';
import { AssistantService } from '../../services/assistant.service';
import { TtsService } from '../../services/tts.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { AssistantChatComponent } from '../assistant-chat/assistant-chat.component';

@Component({
  selector: 'app-floating-assistant',
  imports: [AvatarComponent, AssistantChatComponent],
  templateUrl: './floating-assistant.component.html',
  styleUrl: './floating-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingAssistantComponent implements OnDestroy {
  readonly assistantService = inject(AssistantService);
  private readonly tts      = inject(TtsService);

  readonly isVisible          = this.assistantService.isVisible;
  readonly isSpeaking         = this.assistantService.isSpeaking;
  readonly isThinking         = this.assistantService.isThinking;
  readonly selectedAvatar     = this.assistantService.selectedAvatar;
  readonly lipSyncData        = this.assistantService.lipSyncData;
  readonly aiResponseText     = this.assistantService.aiResponseText;
  readonly suggestedQuestions = this.assistantService.suggestedQuestions;

  readonly showResponse = computed(() =>
    !!this.assistantService.aiResponseText() || this.assistantService.isThinking()
  );

  readonly cleanedResponse = computed(() =>
    this.sanitizeText(this.assistantService.aiResponseText())
  );

  audioEl: HTMLAudioElement | null = null;
  private revokeAudio?: () => void;

  ngOnDestroy(): void {
    this.cleanupAudio();
  }

  async onAskQuestion(question: string): Promise<void> {
    this.cleanupAudio();
    this.assistantService.clearResponse();

    try {
      const response = await this.assistantService.ask(question);
      if (!response.text) return;

      const result = await this.tts.synthesizeSpeech(response.text);
      this.revokeAudio = result.revoke;
      this.audioEl     = new Audio(result.audioUrl);
      this.assistantService.setLipSyncData(result.lipSyncData);

      this.audioEl.onended = () => {
        this.assistantService.setSpeaking(false);
      };

      await this.audioEl.play();
      this.assistantService.setSpeaking(true);
    } catch (err) {
      console.error('[FloatingAssistant] Error TTS:', err);
      this.assistantService.setSpeaking(false);
    }
  }

  onSuggestion(q: string): void {
    this.onAskQuestion(q);
  }

  onClose(): void {
    this.cleanupAudio();
    this.assistantService.setSpeaking(false);
    this.assistantService.hide();
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/gs, '$1')
      .replace(/\*(.+?)\*/gs, '$1')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private cleanupAudio(): void {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.onended = null;
      this.audioEl = null;
    }
    this.revokeAudio?.();
    this.revokeAudio = undefined;
    this.assistantService.setLipSyncData(null);
  }
}
