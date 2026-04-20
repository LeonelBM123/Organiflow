import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActiveUser, DiagramSyncResponse } from '../models/collaboration.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CollaborationHttpService {
  private readonly http = inject(HttpClient);

  getSessions(workflowId: string): Observable<ActiveUser[]> {
    return this.http.get<ActiveUser[]>(
      `${environment.apiUrl}/api/v1/collaboration/workflows/${workflowId}/sessions`
    );
  }

  sync(workflowId: string): Observable<DiagramSyncResponse> {
    return this.http.get<DiagramSyncResponse>(
      `${environment.apiUrl}/api/v1/collaboration/workflows/${workflowId}/sync`
    );
  }
}
