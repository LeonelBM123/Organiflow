import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  WorkflowAnalysisRequest,
  WorkflowAnalysisResult,
  NodeSchemaRequest,
  NodeSchemaResponse,
  FormSchema,
  AiConfig,
} from '../models/workflow.model';

// ---- Tipos de request/response para el endpoint /mutations ----

export interface AiNodeSummary {
  id:     string;
  name:   string;
  type:   string;
  laneId?: string;
}

export interface AiEdgeSummary {
  id:       string;
  sourceId: string;
  targetId: string;
}

export interface AiLaneSummary {
  id:   string;
  name: string;
}

export interface AiEditRequest {
  prompt:        string;
  current_nodes: AiNodeSummary[];
  current_edges: AiEdgeSummary[];
  current_lanes: AiLaneSummary[];
}

export interface AiMutation {
  action: 'ADD_NODE' | 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_EDGE' | 'DELETE_EDGE' | 'ADD_LANE' | 'UPDATE_LANE' | 'DELETE_LANE';
  target_id?: string;
  node_data?: {
    id:              string;
    name:            string;
    type?:           string;
    laneId?:         string;
    departmentId?:   string;
    assignedUserId?: string;
    timeoutHours?:   number;
    formSchema?:     FormSchema;
    aiConfig?:       AiConfig;
  };
  edge_data?: { id?: string; sourceId: string; targetId: string; relationType?: string };
  lane_data?: { id?: string; name: string };
}

export interface AiMutationPlan {
  razonamiento: string;
  mutations:    AiMutation[];
}

// ---- Servicio ----

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.iaApiUrl}/api/v1/ia`;

  /** Genera mutaciones de workflow a partir de un prompt en lenguaje natural. */
  getMutations(request: AiEditRequest): Observable<AiMutationPlan> {
    return this.http.post<AiMutationPlan>(`${this.baseUrl}/mutations`, request);
  }

  /** Analiza el workflow en busca de errores lógicos UML y cuellos de botella. */
  analyze(request: WorkflowAnalysisRequest): Observable<WorkflowAnalysisResult> {
    return this.http.post<WorkflowAnalysisResult>(`${this.baseUrl}/analyze`, request);
  }

  /** Genera un FormSchema para un nodo dado su tipo y contexto de proceso. */
  generateSchema(request: NodeSchemaRequest): Observable<NodeSchemaResponse> {
    return this.http.post<NodeSchemaResponse>(`${this.baseUrl}/generate-schema`, request);
  }
}
