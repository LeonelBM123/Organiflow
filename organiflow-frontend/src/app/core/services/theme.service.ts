import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'organiflow-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isDark = signal(this.resolveInitialTheme());

  constructor() {
    effect(() => this.applyTheme(this.isDark()));
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
  }

  private resolveInitialTheme(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'dark';

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
