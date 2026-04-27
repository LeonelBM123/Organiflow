import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiNodeSummary {
  id: string;
  name: string;
  type: string;
  laneId?: string;
}

export interface AiEdgeSummary {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface AiLaneSummary {
  id: string;
  name: string;
}

export interface AiEditRequest {
  prompt: string;
  current_nodes: AiNodeSummary[];
  current_edges: AiEdgeSummary[];
  current_lanes: AiLaneSummary[];
}

export interface AiMutation {
  action: 'ADD_NODE' | 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_EDGE' | 'DELETE_EDGE' | 'ADD_LANE' | 'UPDATE_LANE' | 'DELETE_LANE';
  target_id?: string;
  node_data?: {
    id: string;
    name: string;
    type?: string;
    laneId?: string;
  };
  edge_data?: {
    id?: string;
    sourceId: string;
    targetId: string;
    relationType?: string;
  };
  lane_data?: {
    id?: string;
    name: string;
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
