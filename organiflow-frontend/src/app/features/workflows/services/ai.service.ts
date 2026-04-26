import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiNodeSummary {
  id: string;
  name: string;
  type: string;
}

export interface AiEdgeSummary {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface AiEditRequest {
  prompt: string;
  current_nodes: AiNodeSummary[];
  current_edges: AiEdgeSummary[];
}

export interface AiMutation {
  action: 'ADD_NODE' | 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_EDGE' | 'DELETE_EDGE';
  target_id?: string;
  node_data?: {
    id: string;
    name: string;
    type?: string;
  };
  edge_data?: {
    id?: string;
    sourceId: string;
    targetId: string;
  };
}

export interface AiMutationPlan {
  razonamiento: string;
  mutations: AiMutation[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8005/api/v1/ia/mutations';

  getMutations(request: AiEditRequest): Observable<AiMutationPlan> {
    return this.http.post<AiMutationPlan>(this.apiUrl, request);
  }
}
