import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AssistantAiResponse, AssistantPageBehavior, AvatarOption, LipSyncCue } from '../models/assistant.model';
import { PolicyRecommendation, WorkflowCatalogItem } from '../models/policy.model';
import { AVATAR_LIST } from '../config/assistant.config';
import { AssistantContextService } from './assistant-context.service';
import { OpenRouterService } from './azure-openai.service';
import { PolicyRecommenderService } from './policy-recommender.service';
import { WorkflowService } from '../../workflows/services/workflow.service';
import { WorkflowNode, WorkflowResponse } from '../../workflows/models/workflow.model';

const BASE_SYSTEM_PROMPT = `Eres el asistente virtual de Organiflow, una plataforma de gestión
de workflows y políticas de negocio empresariales. Ayuda al usuario de forma clara y concisa.
Responde en el idioma del usuario. Máximo 3 oraciones salvo que el usuario pida más detalle.`;

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly context  = inject(AssistantContextService);
  private readonly openAi   = inject(OpenRouterService);
  private readonly policyRecommender = inject(PolicyRecommenderService);
  private readonly workflowService   = inject(WorkflowService);

  private readonly _isVisible      = signal(true);
  private readonly _isSpeaking     = signal(false);
  private readonly _isThinking     = signal(false);
  private readonly _aiResponseText = signal('');
  private readonly _selectedAvatar = signal<AvatarOption>(AVATAR_LIST[0]);
  private readonly _lipSyncData    = signal<LipSyncCue[] | null>(null);
  private readonly _policyRecommendations = signal<PolicyRecommendation[]>([]);

  /** Catálogo de workflows publicados, cacheado para el recomendador. */
  private catalogCache: WorkflowCatalogItem[] | null = null;

  readonly isVisible      = this._isVisible.asReadonly();
  readonly isSpeaking     = this._isSpeaking.asReadonly();
  readonly isThinking     = this._isThinking.asReadonly();
  readonly aiResponseText = this._aiResponseText.asReadonly();
  readonly selectedAvatar = this._selectedAvatar.asReadonly();
  readonly lipSyncData    = this._lipSyncData.asReadonly();
  readonly avatarList     = AVATAR_LIST;
  readonly policyRecommendations = this._policyRecommendations.asReadonly();

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

  // ── Recomendador de políticas (deep learning) ─────────────────────────────

  /**
   * Recomienda los workflows que mejor encajan con la necesidad del cliente.
   * Llena `policyRecommendations` (top-3) y devuelve el texto que el avatar dirá.
   */
  async recommendPolicy(need: string): Promise<AssistantAiResponse> {
    this._isThinking.set(true);
    this._aiResponseText.set('');
    this._policyRecommendations.set([]);

    try {
      const catalog = await this.loadCatalog();
      const result = await firstValueFrom(this.policyRecommender.recommend(need, catalog, 3));
      const recommendations = result.recommendations ?? [];
      this._policyRecommendations.set(recommendations);

      const text = recommendations.length
        ? 'Según lo que necesitas, estas son las políticas que mejor encajan. ¿Cuál quieres iniciar?'
        : 'No encontré una política que coincida con esa descripción. ¿Puedes darme un poco más de detalle?';
      this._aiResponseText.set(text);
      return { text };
    } catch {
      const text = 'No pude obtener una recomendación ahora mismo. Intenta de nuevo o elige de la lista.';
      this._aiResponseText.set(text);
      return { text };
    } finally {
      this._isThinking.set(false);
    }
  }

  clearPolicyRecommendations(): void {
    this._policyRecommendations.set([]);
    this.catalogCache = null;
  }

  /**
   * Construye (vía LLM) una guía hablada de los próximos pasos del workflow
   * recién iniciado. Usa solo los nodos reales del proceso; si el LLM falla,
   * cae a un texto determinista. Devuelve el texto para que el avatar lo narre.
   */
  async buildStepGuide(workflow: WorkflowResponse): Promise<string> {
    const steps = this.orderedTaskSteps(workflow);

    if (!steps.length) {
      const text = `Tu solicitud "${workflow.name}" se creó correctamente. Pronto podrás ver su avance.`;
      this._aiResponseText.set(text);
      return text;
    }

    const stepsText = steps
      .map((s, i) => `${i + 1}. ${s.name}${s.lane ? ` (área: ${s.lane})` : ''}`)
      .join('\n');

    this._isThinking.set(true);
    try {
      const systemPrompt =
        `${BASE_SYSTEM_PROMPT}\n\nEl usuario acaba de iniciar la solicitud "${workflow.name}". ` +
        'Explícale de forma breve y amable, en segunda persona, los próximos pasos que seguirá su ' +
        'solicitud. No inventes pasos: usa únicamente los proporcionados, en ese orden.';
      const text = await this.openAi.ask([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Pasos del proceso:\n${stepsText}` },
      ]);
      this._aiResponseText.set(text);
      return text;
    } catch {
      const text =
        `Tu solicitud "${workflow.name}" se inició. Los pasos serán: ` +
        `${steps.map(s => s.name).join(', ')}.`;
      this._aiResponseText.set(text);
      return text;
    } finally {
      this._isThinking.set(false);
    }
  }

  /** Ordena los nodos TASK/ITERATOR siguiendo el flujo desde el nodo START. */
  private orderedTaskSteps(workflow: WorkflowResponse): { name: string; lane?: string }[] {
    const laneName = new Map(workflow.lanes.map(l => [l.id, l.name]));
    const nodeById = new Map(workflow.nodes.map(n => [n.id, n]));
    const adjacency = new Map<string, string[]>();
    for (const edge of workflow.edges) {
      const targets = adjacency.get(edge.sourceId) ?? [];
      targets.push(edge.targetId);
      adjacency.set(edge.sourceId, targets);
    }

    const start = workflow.nodes.find(n => n.type === 'START');
    const queue: string[] = start ? [start.id] : workflow.nodes.map(n => n.id);
    const visited = new Set<string>();
    const ordered: WorkflowNode[] = [];

    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodeById.get(id);
      if (node && (node.type === 'TASK' || node.type === 'ITERATOR')) ordered.push(node);
      for (const target of adjacency.get(id) ?? []) {
        if (!visited.has(target)) queue.push(target);
      }
    }

    return ordered.map(n => ({
      name: n.name,
      lane: n.laneId ? laneName.get(n.laneId) : undefined,
    }));
  }

  /** Carga (y cachea) el catálogo de workflows publicados como candidatos. */
  private async loadCatalog(): Promise<WorkflowCatalogItem[]> {
    if (this.catalogCache) return this.catalogCache;
    const published = await firstValueFrom(this.workflowService.findPublished());
    this.catalogCache = published.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
    }));
    return this.catalogCache;
  }
}
