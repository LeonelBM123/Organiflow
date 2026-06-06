import { Injectable, computed, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { AssistantContext, AssistantPageBehavior } from '../models/assistant.model';
import { DEFAULT_CONTEXT, PAGE_CONTEXTS } from '../config/assistant.config';

@Injectable({ providedIn: 'root' })
export class AssistantContextService {
  private readonly router = inject(Router);

  private readonly baseContext  = signal<AssistantContext>(DEFAULT_CONTEXT);
  private readonly enrichment   = signal<string>('');
  private readonly pageBehavior = signal<AssistantPageBehavior | null>(null);

  readonly context = this.baseContext.asReadonly();

  readonly fullContextText = computed(() => {
    const base  = this.baseContext();
    const extra = this.enrichment();
    return extra ? `${base.description} ${extra}` : base.description;
  });

  readonly currentBehavior = this.pageBehavior.asReadonly();

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.baseContext.set(this.resolve((e as NavigationEnd).urlAfterRedirects));
        this.enrichment.set('');
        this.pageBehavior.set(null);
      });
  }

  setEnrichment(text: string): void {
    this.enrichment.set(text);
  }

  registerBehavior(behavior: AssistantPageBehavior | null): void {
    this.pageBehavior.set(behavior);
  }

  private resolve(url: string): AssistantContext {
    const cleanUrl = url.split('?')[0];
    const match = PAGE_CONTEXTS.find(entry => entry.pattern.test(cleanUrl));
    return match ? match.context : DEFAULT_CONTEXT;
  }
}
