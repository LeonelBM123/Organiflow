import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AssistantService } from '../../services/assistant.service';
import { AssistantContextService } from '../../services/assistant-context.service';
import { TtsService } from '../../services/tts.service';
import { PolicyRecommendation } from '../../models/policy.model';
import { ExecutionService } from '../../../executions/services/execution.service';
import { WorkflowService } from '../../../workflows/services/workflow.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { AssistantChatComponent } from '../assistant-chat/assistant-chat.component';

@Component({
  selector: 'app-floating-assistant',
  imports: [AvatarComponent, AssistantChatComponent, DecimalPipe],
  templateUrl: './floating-assistant.component.html',
  styleUrl: './floating-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingAssistantComponent implements OnDestroy {
  readonly assistantService = inject(AssistantService);
  private readonly contextService   = inject(AssistantContextService);
  private readonly tts              = inject(TtsService);
  private readonly executionService = inject(ExecutionService);
  private readonly workflowService  = inject(WorkflowService);
  private readonly router           = inject(Router);

  readonly isVisible          = this.assistantService.isVisible;
  readonly isSpeaking         = this.assistantService.isSpeaking;
  readonly isThinking         = this.assistantService.isThinking;
  readonly selectedAvatar     = this.assistantService.selectedAvatar;
  readonly lipSyncData        = this.assistantService.lipSyncData;
  readonly aiResponseText     = this.assistantService.aiResponseText;
  readonly suggestedQuestions = this.assistantService.suggestedQuestions;
  readonly policyRecommendations = this.assistantService.policyRecommendations;

  /** True mientras se crea la ejecución tras elegir una política (evita doble click). */
  readonly isCreatingExecution = signal(false);

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
    // En la página de "Nueva solicitud" el avatar consume el recomendador (deep
    // learning) en vez del LLM genérico.
    if (this.contextService.currentBehavior()?.mode === 'policy-recommend') {
      await this.onDescribeNeed(question);
      return;
    }

    this.cleanupAudio();
    this.assistantService.clearResponse();

    try {
      const response = await this.assistantService.ask(question);
      if (response.text) await this.speak(response.text);
    } catch (err) {
      console.error('[FloatingAssistant] Error TTS:', err);
      this.assistantService.setSpeaking(false);
    }
  }

  /** Envía la necesidad del cliente al recomendador y habla la introducción. */
  async onDescribeNeed(need: string): Promise<void> {
    this.cleanupAudio();
    try {
      const response = await this.assistantService.recommendPolicy(need);
      if (response.text) await this.speak(response.text);
    } catch (err) {
      console.error('[FloatingAssistant] Error recomendación:', err);
      this.assistantService.setSpeaking(false);
    }
  }

  /**
   * El cliente eligió una política del top-3: crea la ejecución, navega a su
   * detalle y el avatar narra por voz los próximos pasos del workflow.
   */
  onPickPolicy(rec: PolicyRecommendation): void {
    if (this.isCreatingExecution()) return;
    this.isCreatingExecution.set(true);

    this.executionService.create({ workflowId: rec.workflowId }).subscribe({
      next: async (execution) => {
        this.isCreatingExecution.set(false);
        this.assistantService.clearPolicyRecommendations();
        this.router.navigate(['/user/executions', execution.id]);
        await this.guideThroughSteps(rec.workflowId);
      },
      error: (err) => {
        this.isCreatingExecution.set(false);
        console.error('[FloatingAssistant] Error creando ejecución:', err);
      },
    });
  }

  /** Carga el workflow y hace que el avatar narre sus próximos pasos. */
  private async guideThroughSteps(workflowId: string): Promise<void> {
    this.cleanupAudio();
    try {
      const workflow = await firstValueFrom(this.workflowService.findById(workflowId));
      const guide = await this.assistantService.buildStepGuide(workflow);
      if (guide) await this.speak(guide);
    } catch (err) {
      console.error('[FloatingAssistant] Error guía de pasos:', err);
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

  /** Sintetiza voz para `text` y reproduce con lip-sync. */
  private async speak(text: string): Promise<void> {
    const result = await this.tts.synthesizeSpeech(text);
    this.revokeAudio = result.revoke;
    this.audioEl     = new Audio(result.audioUrl);
    this.assistantService.setLipSyncData(result.lipSyncData);

    this.audioEl.onended = () => {
      this.assistantService.setSpeaking(false);
    };

    await this.audioEl.play();
    this.assistantService.setSpeaking(true);
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
