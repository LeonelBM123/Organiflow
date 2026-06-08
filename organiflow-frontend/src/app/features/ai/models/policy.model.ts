/**
 * Modelos del recomendador de políticas (deep learning).
 * Reflejan los DTOs del microservicio organiflow-ia (`/api/v1/ia/policy`).
 */

/** Workflow candidato a recomendación (catálogo publicado del tenant). */
export interface WorkflowCatalogItem {
  id: string;
  name: string;
  description?: string;
}

/** Una recomendación de workflow con su score de confianza (0..1). */
export interface PolicyRecommendation {
  workflowId: string;
  name: string;
  score: number;
}

/** Respuesta de `/recommend`: ranking top-k + origen (modelo entrenado o fallback). */
export interface PolicyRecommendResponse {
  recommendations: PolicyRecommendation[];
  modelTrained: boolean;
}

/** Respuesta de `/train`: métricas del entrenamiento. */
export interface PolicyTrainResponse {
  tenantId: string;
  numClasses: number;
  numSamples: number;
  accuracy: number;
  top3Accuracy: number;
  perClassF1: Record<string, number>;
  trainedAt: string;
}
