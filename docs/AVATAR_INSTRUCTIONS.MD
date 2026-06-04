# Guía: Reconstruir el Asistente Virtual 3D en Angular

## Contexto

Este documento describe cómo portar la carpeta `src/asistente` de un proyecto React (Open edX MFE) a Angular. El asistente es un widget flotante fijo que muestra un avatar 3D con lip-sync, guía al usuario por pasos del curso y responde preguntas vía Azure OpenAI + síntesis de voz via un API Python (Rhubarb).

---

## Arquitectura original (React)

```
src/asistente/
├── AvatarTour.jsx          → Orquestador principal (estado, flujos)
├── Avatar.jsx              → Renderizado 3D + lip-sync (React Three Fiber)
├── AvatarSwitcher.jsx      → Selector de modelo de avatar
├── TourUI.jsx              → UI de controles, burbujas, chat
└── config/
    ├── ToursConfig.js      → Pasos del tour por nombre
    ├── ttsServiceV3.js     → Llamada al API Python TTS (activo)
    ├── ttsService.js       → Versión v1 (legacy)
    ├── azureSpeechService.js → Azure Speech SDK directo (deprecado)
    └── useTts.js           → Hook React para TTS
```

---

## Estructura Angular equivalente

```
src/app/asistente/
├── asistente.module.ts
├── components/
│   ├── avatar-tour/
│   │   ├── avatar-tour.component.ts
│   │   ├── avatar-tour.component.html
│   │   └── avatar-tour.component.scss
│   ├── avatar/
│   │   ├── avatar.component.ts
│   │   └── avatar.component.html
│   ├── avatar-switcher/
│   │   ├── avatar-switcher.component.ts
│   │   └── avatar-switcher.component.html
│   └── tour-ui/
│       ├── tour-ui.component.ts
│       ├── tour-ui.component.html
│       └── tour-ui.component.scss
├── services/
│   ├── tts.service.ts
│   ├── azure-openai.service.ts
│   └── avatar-preference.service.ts
├── models/
│   └── tour.models.ts
└── config/
    └── tours.config.ts
```

---

## Paso 0 – Dependencias

```bash
npm install three @types/three
npm install microsoft-cognitiveservices-speech-sdk
# Opcional para cargar GLB/FBX sin Three.js manual:
npm install three-stdlib
```

No existe un wrapper oficial Angular para React Three Fiber. Se usa Three.js directamente dentro de un `<canvas>` en el componente `AvatarComponent`.

---

## Paso 1 – Modelos de datos (`tour.models.ts`)

```typescript
export interface TourStep {
  text: string;
  useAzureTTS: boolean;
  audio?: string;       // fallback mp3
  json?: string;        // fallback lip-sync JSON
  targetDOMId?: string; // elemento a resaltar
  startTime?: number;
  endTime?: number;
}

export interface AvatarOption {
  id: string;
  label: string;
  path: string;
  emoji: string;
}

export interface LipSyncCue {
  start: number;
  end: number;
  value: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X'
}

export interface TtsResult {
  audioUrl: string;
  lipSyncData: LipSyncCue[];
  duration: number;
  revoke: () => void;
}
```

---

## Paso 2 – Configuración de tours (`tours.config.ts`)

```typescript
import { TourStep } from '../models/tour.models';

export const PORTAL_TOURS: Record<string, TourStep[]> = {
  demo_tour: [
    {
      text: 'Bienvenido al curso. Aquí encontrarás todos los materiales.',
      useAzureTTS: true,
      audio: '/assets/explicacion.mp3',
      json: '/assets/explicacion.json',
      targetDOMId: 'courseTabsNavigation',
      startTime: 0,
      endTime: 8.0,
    },
    // ... más pasos
  ],
};

export const AVATAR_LIST: AvatarOption[] = [
  { id: 'avatar',  label: 'Avatar',   path: '/assets/avatar.glb',   emoji: '🧑' },
  { id: 'avatar1', label: 'Avatar 1', path: '/assets/avatar-1.glb', emoji: '🧑' },
  { id: 'avatar2', label: 'Avatar 2', path: '/assets/avatar-2.glb', emoji: '🧑' },
  { id: 'avatar3', label: 'Avatar 3', path: '/assets/avatar-3.glb', emoji: '🧑' },
  { id: 'avatar4', label: 'Avatar 4', path: '/assets/avatar-4.glb', emoji: '👩' },
  { id: 'avatar6', label: 'Avatar 6', path: '/assets/avatar-6.glb', emoji: '👩' },
];
```

---

## Paso 3 – Servicio TTS con Azure Speech SDK (`tts.service.ts`)

Equivale a `azureSpeechService.js`. Usa el SDK oficial de Azure Cognitive Services para sintetizar voz y capturar visemas en tiempo real. Los visemas de Azure (IDs 0-21) se mapean al formato ARKit (A-X) que consume el motor de lip-sync del avatar.

### Cómo funciona Azure Speech con visemas

1. Se crea un `SpeechSynthesizer` configurado con `null` como output (el audio queda en `result.audioData` como `ArrayBuffer`).
2. El evento `visemeReceived` se dispara durante la síntesis. Cada evento tiene `audioOffset` (en unidades de 100 ns) y `visemeId` (0-21).
3. Al completar (`SynthesizingAudioCompleted`), `result.audioDuration` (también en 100 ns) sirve para calcular el `end` del último visema.
4. Se convierte `audioData` a `Blob → ObjectURL` para pasarlo a `<audio>`.

```typescript
import { Injectable } from '@angular/core';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { LipSyncCue, TtsResult } from '../models/tour.models';
import { environment } from 'src/environments/environment';

// Mapa de Azure visemeId (0-21) → ARKit (A-X)
// Fuente: azureSpeechService.js original
const AZURE_TO_ARKIT: Record<number, string> = {
  0: 'X',  // silencio
  1: 'A',  2: 'E',  3: 'A',  4: 'F',  5: 'A',
  6: 'C',  7: 'D',  8: 'B',  9: 'E', 10: 'F',
  11: 'F', 12: 'D', 13: 'C', 14: 'C', 15: 'C',
  16: 'B', 17: 'B', 18: 'G', 19: 'G', 20: 'H',
  21: 'C',
};

export const SPANISH_VOICES: Record<string, string> = {
  'es-MX-DaliaNeural':   'Femenina - México',
  'es-MX-JorgeNeural':   'Masculina - México',
  'es-ES-ElviraNeural':  'Femenina - España',
  'es-ES-AlvaroNeural':  'Masculina - España',
  'es-AR-ElenaNeural':   'Femenina - Argentina',
  'es-AR-TomasNeural':   'Masculina - Argentina',
  'es-CO-SalomeNeural':  'Femenina - Colombia',
  'es-CO-GonzaloNeural': 'Masculina - Colombia',
};

@Injectable({ providedIn: 'root' })
export class TtsService {
  private key    = environment.azureSpeechKey;
  private region = environment.azureSpeechRegion;

  async synthesizeSpeech(
    text: string,
    voiceName = 'es-MX-DaliaNeural',
  ): Promise<TtsResult> {
    const speechConfig = sdk.SpeechConfig.fromSubscription(this.key, this.region);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

    // null → el audio se recibe en result.audioData (no se reproduce por altavoz del sistema)
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as any);

    const rawVisemes: Array<{ audioOffset: number; visemeId: number }> = [];

    synthesizer.visemeReceived = (_s, e) => {
      rawVisemes.push({
        audioOffset: e.audioOffset / 10_000_000, // 100ns → segundos
        visemeId: e.visemeId,
      });
    };

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        result => {
          synthesizer.close();

          if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
            reject(new Error(`Azure TTS error: ${result.errorDetails}`));
            return;
          }

          const totalDuration = result.audioDuration / 10_000_000;
          const lipSyncData   = this.convertVisemes(rawVisemes, totalDuration);

          const blob     = new Blob([result.audioData], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(blob);

          resolve({
            audioUrl,
            lipSyncData,
            duration: totalDuration,
            revoke: () => URL.revokeObjectURL(audioUrl),
          });
        },
        error => {
          synthesizer.close();
          reject(error);
        },
      );
    });
  }

  private convertVisemes(
    visemes: Array<{ audioOffset: number; visemeId: number }>,
    totalDuration: number,
  ): LipSyncCue[] {
    return visemes.map((v, i, arr) => ({
      start: v.audioOffset,
      end:   arr[i + 1]?.audioOffset ?? totalDuration,
      value: AZURE_TO_ARKIT[v.visemeId] ?? 'X',
    }));
  }
}
```

---

## Paso 4 – Servicio Azure OpenAI (`azure-openai.service.ts`)

Equivale a la función `handleAskQuestion` de `AvatarTour.jsx`.

```typescript
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AzureOpenAiService {
  async ask(question: string, courseContext: string): Promise<string> {
    const { azureOpenAiKey, azureOpenAiEndpoint, azureOpenAiDeployment } = environment;

    const url = `https://${azureOpenAiEndpoint}/openai/deployments/${azureOpenAiDeployment}/chat/completions?api-version=2024-08-01-preview`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `Eres un asistente educativo amigable y conciso para un curso universitario.

INSTRUCCIONES IMPORTANTES:
- Responde en MÁXIMO 2-3 oraciones
- Sé claro, didáctico y motivador
- Usa lenguaje simple
- Si no sabes algo específico del curso, ofrece ayuda general

CONTEXTO DEL CURSO:
${courseContext}`,
          },
          { role: 'user', content: question },
        ],
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  }
}
```

---

## Paso 5 – Servicio de preferencias (`avatar-preference.service.ts`)

Equivale al `useEffect` de carga de preferencias en `AvatarTour.jsx`.

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

interface UserPrefs {
  avatar_model?: string;
  avatar_enabled?: string;
}

@Injectable({ providedIn: 'root' })
export class AvatarPreferenceService {
  constructor(private http: HttpClient) {}

  async loadPrefs(username: string): Promise<UserPrefs> {
    return firstValueFrom(
      this.http.get<UserPrefs>(
        `${environment.lmsBaseUrl}/api/user/v1/preferences/${username}`
      )
    );
  }
}
```

---

## Paso 6 – Componente Avatar 3D (`avatar.component.ts`)

Este es el componente más complejo. Reemplaza React Three Fiber con Three.js puro sobre un `<canvas>`.

### Conceptos clave de la traducción

| React Three Fiber | Angular Three.js |
|-------------------|-----------------|
| `useFrame(callback)` | `requestAnimationFrame` loop en `ngAfterViewInit` |
| `useGLTF(path)` | `GLTFLoader` de `three/examples/jsm/loaders/GLTFLoader` |
| `useFBX(path)` | `FBXLoader` de `three/examples/jsm/loaders/FBXLoader` |
| `useAnimations(clips, ref)` | `AnimationMixer` de Three.js |
| `<Canvas>` | `<canvas #canvas>` + `WebGLRenderer` |

### avatar.component.ts

```typescript
import {
  Component, ElementRef, Input, OnChanges, OnDestroy,
  AfterViewInit, ViewChild, SimpleChanges
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { LipSyncCue } from '../../models/tour.models';

const ARKIT_MUSCLES = [
  'jawOpen','mouthFunnel','mouthPucker','mouthClose',
  'mouthRollLower','mouthSmileLeft','mouthSmileRight',
  'eyeBlinkLeft','eyeBlinkRight',
];

const ARKIT_MAPPING: Record<string, Partial<Record<string, number>>> = {
  A: { jawOpen: 0.0 },
  B: { jawOpen: 0.1 },
  C: { jawOpen: 0.2, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 },
  D: { jawOpen: 0.4 },
  E: { jawOpen: 0.1, mouthFunnel: 0.7 },
  F: { jawOpen: 0.1, mouthPucker: 0.8 },
  G: { jawOpen: 0.1, mouthRollLower: 0.6 },
  H: { jawOpen: 0.2 },
  X: { jawOpen: 0.0 },
};

@Component({
  selector: 'app-avatar',
  template: `<canvas #canvas style="width:100%;height:100%;"></canvas>`,
})
export class AvatarComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() avatarPath = '/assets/avatar.glb';
  @Input() audioElement: HTMLAudioElement | null = null;
  @Input() lipSyncData: LipSyncCue[] | null = null;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mixer?: THREE.AnimationMixer;
  private headNode?: THREE.Mesh;
  private targetInfluences: Record<string, number> = {};
  private clock = new THREE.Clock();
  private animId = 0;
  private nextBlink = 0;
  private blinkEndTime = 0;
  private revokeModel?: () => void;

  ngAfterViewInit() {
    this.initRenderer();
    this.loadModel(this.avatarPath);
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['avatarPath'] && !changes['avatarPath'].firstChange) {
      this.loadModel(this.avatarPath);
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    this.renderer?.dispose();
  }

  private initRenderer() {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 0.3, 1.8);
    this.camera.lookAt(0, 0.2, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dir1.position.set(2, 2, 5);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-2, 0, 2);
    this.scene.add(ambient, dir1, dir2);
  }

  private loadModel(path: string) {
    // Limpiar modelo anterior
    this.scene.children
      .filter(c => c.userData['isAvatar'])
      .forEach(c => this.scene.remove(c));
    this.mixer?.stopAllAction();

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(path, (gltf) => {
      const root = gltf.scene;
      root.userData['isAvatar'] = true;
      root.position.set(-0.6, -2.4, -0.5);
      root.scale.setScalar(1.45);

      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.frustumCulled = false;
          if (mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).metalness = 0.1;
            (mesh.material as THREE.MeshStandardMaterial).roughness = 0.7;
          }
          if (child.name.toLowerCase().includes('cornea')) child.visible = false;
          if (child.name === 'Streamoji_Head') this.headNode = mesh;
        }
      });

      this.scene.add(root);
      this.mixer = new THREE.AnimationMixer(root);

      // Cargar animación idle
      const fbxLoader = new FBXLoader();
      fbxLoader.load('/assets/animacion.fbx', (fbx) => {
        if (fbx.animations[0]) {
          fbx.animations[0].name = 'Idle';
          const action = this.mixer!.clipAction(fbx.animations[0], root);
          action.reset().fadeIn(0.5).play();
        }
      });
    });
  }

  private animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.mixer?.update(delta);
    this.applyLipSync(delta);

    this.renderer.render(this.scene, this.camera);
  }

  private applyLipSync(delta: number) {
    if (!this.headNode?.morphTargetDictionary || !this.headNode?.morphTargetInfluences) return;

    // Resetear targets
    ARKIT_MUSCLES.forEach(m => (this.targetInfluences[m] = 0));

    // Lip-sync
    if (this.audioElement && this.lipSyncData && !this.audioElement.paused) {
      const t = this.audioElement.currentTime;
      const cue = this.lipSyncData.find(c => t >= c.start && t <= c.end);
      const poses = ARKIT_MAPPING[cue?.value ?? 'X'] ?? ARKIT_MAPPING['X'];
      Object.entries(poses).forEach(([m, v]) => (this.targetInfluences[m] = v!));
    }

    // Pestañeo aleatorio
    const elapsed = this.clock.elapsedTime;
    if (elapsed > this.nextBlink) {
      this.blinkEndTime = elapsed + 0.15;
      this.nextBlink = elapsed + THREE.MathUtils.randFloat(2, 6);
    }
    if (elapsed < this.blinkEndTime) {
      this.targetInfluences['eyeBlinkLeft'] = 1;
      this.targetInfluences['eyeBlinkRight'] = 1;
    }

    // Lerp suave
    const lerpSpeed = 15;
    ARKIT_MUSCLES.forEach(muscle => {
      const idx = this.headNode!.morphTargetDictionary![muscle];
      if (idx !== undefined) {
        const curr = this.headNode!.morphTargetInfluences![idx];
        const target = this.targetInfluences[muscle] ?? 0;
        this.headNode!.morphTargetInfluences![idx] = THREE.MathUtils.lerp(curr, target, delta * lerpSpeed);
      }
    });
  }
}
```

---

## Paso 7 – Componente TourUI (`tour-ui.component.ts`)

Equivale a `TourUI.jsx`. Utiliza `@Output()` para eventos en vez de props callbacks.

```typescript
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-tour-ui',
  templateUrl: './tour-ui.component.html',
  styleUrls: ['./tour-ui.component.scss'],
})
export class TourUiComponent implements OnChanges {
  @Input() isTourActive = false;
  @Input() isSpeaking = false;
  @Input() stepText = '';
  @Input() currentStep = 0;
  @Input() totalSteps = 0;
  @Input() aiResponse = '';
  @Input() isThinking = false;

  @Output() start = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() end = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() askQuestion = new EventEmitter<string>();

  question = '';
  showAiResponse = false;
  private hideTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['aiResponse']?.currentValue) {
      this.showAiResponse = true;
    }
    if (changes['isSpeaking'] && !this.isSpeaking && this.aiResponse) {
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => (this.showAiResponse = false), 3000);
    }
  }

  get buttonIcon(): string {
    if (this.question.trim()) return '➤';
    if (this.isTourActive) return '⏹';
    return '▶';
  }

  get buttonColor(): string {
    return this.isTourActive && !this.question.trim() ? '#d93025' : '#1c3e5a';
  }

  handleSend() {
    if (!this.question.trim()) return;
    this.showAiResponse = false;
    this.askQuestion.emit(this.question.trim());
    this.question = '';
  }

  handleButtonClick() {
    if (this.question.trim()) {
      this.handleSend();
    } else if (this.isTourActive) {
      this.end.emit();
    } else {
      this.start.emit();
    }
  }
}
```

### tour-ui.component.html (extracto)

```html
<!-- Burbuja tour -->
<div *ngIf="isTourActive && !showAiResponse" class="bubble">
  <p>{{ stepText }}</p>
  <div class="bubble-nav">
    <button (click)="prev.emit()" [disabled]="currentStep === 0">←</button>
    <span>{{ currentStep + 1 }} / {{ totalSteps }}</span>
    <button *ngIf="currentStep < totalSteps - 1" (click)="next.emit()">→</button>
    <button *ngIf="currentStep === totalSteps - 1" (click)="end.emit()" class="btn-fin">Fin ✓</button>
  </div>
  <div class="bubble-arrow"></div>
</div>

<!-- Burbuja IA -->
<div *ngIf="showAiResponse || isThinking" class="bubble">
  <div *ngIf="isThinking" class="thinking">Pensando...</div>
  <p *ngIf="!isThinking">{{ aiResponse }}</p>
  <div class="bubble-arrow"></div>
</div>

<!-- Barra de chat -->
<div class="chat-bar">
  <input
    type="text"
    [(ngModel)]="question"
    (keydown.enter)="handleSend()"
    [disabled]="isThinking"
    [placeholder]="isTourActive ? 'Haz una pregunta...' : 'Iniciar recorrido...'"
  />
  <button
    (click)="handleButtonClick()"
    [disabled]="isThinking"
    [style.backgroundColor]="buttonColor"
    class="btn-send"
  >{{ buttonIcon }}</button>
</div>

<!-- Cerrar -->
<button (click)="close.emit()" class="btn-close">✕</button>
```

---

## Paso 8 – Componente orquestador (`avatar-tour.component.ts`)

Equivale a `AvatarTour.jsx`. Contiene toda la lógica de estado.

```typescript
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TtsService } from '../../services/tts.service';
import { AzureOpenAiService } from '../../services/azure-openai.service';
import { AvatarPreferenceService } from '../../services/avatar-preference.service';
import { PORTAL_TOURS, AVATAR_LIST } from '../../config/tours.config';
import { AvatarOption, LipSyncCue, TourStep } from '../../models/tour.models';

@Component({
  selector: 'app-avatar-tour',
  templateUrl: './avatar-tour.component.html',
})
export class AvatarTourComponent implements OnInit, OnDestroy {
  @Input() tourName!: string;

  steps: TourStep[] = [];
  isVisible = true;
  isTourActive = false;
  isSpeaking = false;
  currentStep = 0;
  lipSyncData: LipSyncCue[] | null = null;
  selectedAvatar: AvatarOption = AVATAR_LIST[0];
  showAvatarSelector = false;
  aiResponse = '';
  isThinking = false;

  audioEl: HTMLAudioElement | null = null;
  private revokeAudio?: () => void;

  constructor(
    private tts: TtsService,
    private openAi: AzureOpenAiService,
    private prefs: AvatarPreferenceService,
  ) {}

  ngOnInit() {
    this.steps = PORTAL_TOURS[this.tourName] ?? [];
    this.loadUserPrefs();
  }

  ngOnDestroy() {
    this.cleanupAudio();
  }

  // ─── Preferencias ──────────────────────────────────────────────────────────
  private async loadUserPrefs() {
    try {
      // Sustituir 'getUsername()' por como obtengas el usuario en Angular
      const username = this.getUsername();
      const data = await this.prefs.loadPrefs(username);
      if (data.avatar_model) {
        const id = data.avatar_model.replace('_', '');
        const found = AVATAR_LIST.find(a => a.id === id);
        if (found) this.selectedAvatar = found;
      }
      if (data.avatar_enabled === 'false') this.isVisible = false;
    } catch (e) {
      console.warn('[AvatarTour] Error cargando preferencias', e);
    }
  }

  // ─── Audio ─────────────────────────────────────────────────────────────────
  private cleanupAudio() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.ontimeupdate = null;
      this.audioEl.onended = null;
    }
    this.revokeAudio?.();
    this.revokeAudio = undefined;
  }

  async loadStepAudio() {
    if (!this.steps.length) return;
    const step = this.steps[this.currentStep];
    this.cleanupAudio();

    try {
      if (step.useAzureTTS) {
        const result = await this.tts.synthesizeSpeech(step.text);
        this.revokeAudio = result.revoke;
        this.audioEl = new Audio(result.audioUrl);
        this.audioEl.currentTime = step.startTime ?? 0;
        this.lipSyncData = result.lipSyncData;

        if (step.endTime) {
          this.audioEl.ontimeupdate = () => {
            if (this.audioEl!.currentTime >= step.endTime!) {
              this.audioEl!.pause();
              this.isSpeaking = false;
            }
          };
        }
        this.audioEl.onended = () => (this.isSpeaking = false);

        if (this.isTourActive) {
          await this.audioEl.play();
          this.isSpeaking = true;
        }
      } else {
        // Fallback: archivos estáticos
        this.audioEl = new Audio(step.audio!);
        this.audioEl.currentTime = step.startTime ?? 0;
        this.audioEl.onended = () => (this.isSpeaking = false);

        const res = await fetch(step.json!);
        const data = await res.json();
        this.lipSyncData = data.mouthCues;

        if (this.isTourActive) {
          await this.audioEl.play();
          this.isSpeaking = true;
        }
      }
    } catch (err) {
      console.error('[AvatarTour] Error cargando audio', err);
    }
  }

  // ─── Pregunta IA ───────────────────────────────────────────────────────────
  async onAskQuestion(question: string) {
    this.isThinking = true;
    this.aiResponse = '';
    this.audioEl?.pause();
    this.isSpeaking = false;

    try {
      const context = this.steps[this.currentStep]?.text ?? '';
      const answer = await this.openAi.ask(question, context);
      this.aiResponse = answer;
      this.isThinking = false;

      this.cleanupAudio();
      const result = await this.tts.synthesizeSpeech(answer);
      this.revokeAudio = result.revoke;
      this.audioEl = new Audio(result.audioUrl);
      this.lipSyncData = result.lipSyncData;
      this.audioEl.onended = () => (this.isSpeaking = false);
      await this.audioEl.play();
      this.isSpeaking = true;
    } catch (err: any) {
      this.isThinking = false;
      this.aiResponse = this.mapOpenAiError(err.message);
    }
  }

  // ─── Controles del tour ────────────────────────────────────────────────────
  startTour() {
    this.isTourActive = true;
    this.loadStepAudio();
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.isSpeaking = false;
      this.aiResponse = '';
      this.loadStepAudio();
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.isSpeaking = false;
      this.aiResponse = '';
      this.loadStepAudio();
    }
  }

  endTour() {
    this.cleanupAudio();
    this.isSpeaking = false;
    this.isTourActive = false;
    this.currentStep = 0;
    this.aiResponse = '';
  }

  closeAssistant() {
    this.endTour();
    this.isVisible = false;
  }

  changeAvatar(avatar: AvatarOption) {
    this.cleanupAudio();
    this.isSpeaking = false;
    this.lipSyncData = null;
    this.selectedAvatar = avatar;
    this.showAvatarSelector = false;
  }

  private mapOpenAiError(msg: string): string {
    if (msg.includes('401') || msg.includes('403')) return '⚠️ Error de autenticación.';
    if (msg.includes('404')) return '⚠️ Deployment no encontrado.';
    if (msg.includes('429')) return '⚠️ Límite de solicitudes alcanzado.';
    return '❌ Hubo un error al procesar tu pregunta.';
  }

  private getUsername(): string {
    // Implementar según el mecanismo de auth de tu app Angular
    // Ej: AuthService, JWT decode, sessionStorage, etc.
    return 'usuario';
  }

  readonly avatarList = AVATAR_LIST;
}
```

### avatar-tour.component.html (extracto)

```html
<!-- Botón flotante cuando está cerrado -->
<button *ngIf="!isVisible" (click)="isVisible = true" class="btn-reopen">
  🎧 Asistente
</button>

<div *ngIf="isVisible" class="avatar-container">
  <!-- Canvas 3D -->
  <app-avatar
    [avatarPath]="selectedAvatar.path"
    [audioElement]="audioEl"
    [lipSyncData]="lipSyncData"
  ></app-avatar>

  <!-- Selector de avatar -->
  <div class="avatar-selector">
    <button (click)="showAvatarSelector = !showAvatarSelector"
            [disabled]="isThinking || isSpeaking">
      {{ selectedAvatar.emoji }} {{ selectedAvatar.label }}
      {{ showAvatarSelector ? '▲' : '▼' }}
    </button>
    <div *ngIf="showAvatarSelector" class="avatar-dropdown">
      <button *ngFor="let av of avatarList" (click)="changeAvatar(av)"
              [class.active]="av.id === selectedAvatar.id">
        {{ av.emoji }} {{ av.label }}
        <span *ngIf="av.id === selectedAvatar.id">✓</span>
      </button>
    </div>
  </div>

  <!-- UI del tour -->
  <app-tour-ui
    [isTourActive]="isTourActive"
    [isSpeaking]="isSpeaking"
    [stepText]="steps[currentStep]?.text"
    [currentStep]="currentStep"
    [totalSteps]="steps.length"
    [aiResponse]="aiResponse"
    [isThinking]="isThinking"
    (start)="startTour()"
    (next)="nextStep()"
    (prev)="prevStep()"
    (end)="endTour()"
    (close)="closeAssistant()"
    (askQuestion)="onAskQuestion($event)"
  ></app-tour-ui>
</div>
```

---

## Paso 9 – Variables de entorno (`environment.ts`)

```typescript
export const environment = {
  production: false,
  // Azure Cognitive Services – Speech (TTS + visemas)
  azureSpeechKey:    'TU_SPEECH_KEY',
  azureSpeechRegion: 'eastus',          // ej: eastus, westeurope
  // Azure OpenAI (preguntas IA)
  azureOpenAiKey:        'TU_OPENAI_KEY',
  azureOpenAiEndpoint:   'TU_RECURSO.openai.azure.com',
  azureOpenAiDeployment: 'TU_DEPLOYMENT',
  // LMS Open edX (preferencias de usuario)
  lmsBaseUrl: 'https://lms.tudominio.edu',
};
```

> **Dónde obtener las credenciales de Azure Speech:**
> Azure Portal → tu recurso *Cognitive Services* (o *Speech*) → Keys and Endpoint.
> La región debe coincidir exactamente con la del recurso (ej. `eastus`, `eastus2`, `westeurope`).

---

## Paso 10 – Módulo (`asistente.module.ts`)

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AvatarTourComponent } from './components/avatar-tour/avatar-tour.component';
import { AvatarComponent } from './components/avatar/avatar.component';
import { TourUiComponent } from './components/tour-ui/tour-ui.component';

@NgModule({
  declarations: [AvatarTourComponent, AvatarComponent, TourUiComponent],
  imports: [CommonModule, FormsModule, HttpClientModule],
  exports: [AvatarTourComponent],
})
export class AsistenteModule {}
```

Usar en un template:
```html
<app-avatar-tour tourName="demo_tour"></app-avatar-tour>
```

---

## Diferencias importantes React → Angular

| Aspecto | React | Angular |
|---------|-------|---------|
| Loop de renderizado | `useFrame` (React Three Fiber) | `requestAnimationFrame` manual |
| Estado local | `useState` | propiedades de clase + `ChangeDetectionStrategy` |
| Efectos | `useEffect([dep])` | `ngOnChanges` + `ngOnInit` + `ngOnDestroy` |
| Refs a DOM | `useRef` | `@ViewChild` |
| Props/callbacks | props functions | `@Input()` / `@Output() EventEmitter` |
| HTTP | `fetch` | `HttpClient` + `firstValueFrom` |
| Memory leaks audio | ObjectURL revocado en cleanup de `useEffect` | `ngOnDestroy` + `cleanupAudio()` |
| 3D lib | React Three Fiber + `@react-three/drei` | Three.js puro |
| Síntesis de voz | `ttsServiceV3.js` (API Python + Rhubarb) | Azure Speech SDK (`microsoft-cognitiveservices-speech-sdk`) |
| Visemas | Formato Rhubarb (A-X + duración) | `synthesizer.visemeReceived` → IDs Azure 0-21 → ARKit A-X |
| Audio resultado TTS | Base64 → Blob → ObjectURL | `result.audioData` (ArrayBuffer) → Blob → ObjectURL |

---

## Assets requeridos (carpeta `public/assets/`)

```
/assets/avatar.glb
/assets/avatar-1.glb  ... avatar-6.glb
/assets/animacion.fbx          ← animación idle
/assets/explicacion.mp3        ← audio fallback paso 1
/assets/explicacion.json       ← lip-sync fallback paso 1
```

---

## Verificación

1. Servir la app Angular: `ng serve`
2. Comprobar que el canvas 3D renderiza el avatar con animación idle
3. Clicar "Iniciar recorrido" → el audio debe reproducirse y la boca moverse
4. Escribir una pregunta → respuesta de Azure OpenAI debe vocalizarse con lip-sync
5. Cambiar avatar → nuevo modelo carga sin detener la app
6. Cerrar widget → reaparece el botón flotante
7. Revisar consola por fugas de memoria (`URL.revokeObjectURL` debe llamarse al cambiar pasos)
