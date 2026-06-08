import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { WorkflowService } from '../../workflows/services/workflow.service';
import {
  PolicyRecommendResponse,
  PolicyTrainResponse,
  WorkflowCatalogItem,
} from '../models/policy.model';

/**
 * Cliente HTTP del recomendador de políticas (red neuronal en organiflow-ia).
 *
 * Responsabilidad única: comunicar el frontend con `/api/v1/ia/policy`. Lo
 * consume el avatar (AssistantService) para recomendar workflows desde un prompt
 * y el admin para (re)entrenar el modelo.
 */
@Injectable({ providedIn: 'root' })
export class PolicyRecommenderService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly workflowService = inject(WorkflowService);
  private readonly base = `${environment.iaApiUrl}/api/v1/ia/policy`;

  /** Pide el top-k de workflows que mejor encajan con la necesidad del cliente. */
  recommend(
    prompt: string,
    workflows: WorkflowCatalogItem[],
    topK = 3,
  ): Observable<PolicyRecommendResponse> {
    return this.http.post<PolicyRecommendResponse>(`${this.base}/recommend`, {
      tenantId: this.tenantId(),
      prompt,
      workflows: this.toCatalog(workflows),
      topK,
    });
  }

  /** Entrena (o reentrena) el recomendador con el catálogo de workflows publicados. */
  train(workflows: WorkflowCatalogItem[], samplesPerClass = 30): Observable<PolicyTrainResponse> {
    return this.http.post<PolicyTrainResponse>(`${this.base}/train`, {
      tenantId: this.tenantId(),
      workflows: this.toCatalog(workflows),
      samplesPerClass,
    });
  }

  /**
   * Obtiene el catálogo de workflows publicados y reentrena el modelo con él.
   * Usado por el admin (auto al publicar/archivar y por el botón manual).
   */
  trainFromPublished(samplesPerClass = 30): Observable<PolicyTrainResponse> {
    return this.workflowService.findPublished().pipe(
      switchMap(list => this.train(list, samplesPerClass)),
    );
  }

  /** Reduce cualquier objeto de workflow a {id, name, description} para un payload limpio. */
  private toCatalog(workflows: WorkflowCatalogItem[]): WorkflowCatalogItem[] {
    return workflows.map(({ id, name, description }) => ({ id, name, description }));
  }

  private tenantId(): string {
    return this.auth.currentUser()?.tenantId ?? 'default';
  }
}
