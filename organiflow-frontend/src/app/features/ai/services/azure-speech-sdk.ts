// ─────────────────────────────────────────────────────────────────────────────
// Wrapper del Azure Speech SDK para builds de NAVEGADOR.
//
// Problema: el entry principal del paquete (`distrib/lib`) arrastra una pila de red
// solo-Node (https-proxy-agent, agent-base, http, https, net, tls, …) que el bundler
// del navegador no puede resolver → el build falla.
//
// Solución: el SDK incluye un bundle de navegador ya empaquetado y SIN deps de Node
// en `distrib/browser/...bundle.js`. Pero ese bundle es CommonJS (`__esModule: true`,
// sin export `default`), y el interop CJS estático de esbuild/Vite lo rompe en `ng serve`
// ("does not provide an export named 'default'").
//
// Por eso se carga con un **import() dinámico** (perezoso) y se normaliza el namespace
// (`default ?? mod`). Beneficio extra: el SDK no se carga al arrancar la app —solo cuando
// se usa el TTS— así que nunca bloquea el layout/login.
//
// Los tipos vienen del paquete raíz con `import type` (se borra en compilación, no llega
// al bundler). El `.bundle.d.ts` está malformado, por eso se castea.
//
// Ver organiflow-frontend/SPEECH_SDK_BUILD_FIX.md
// ─────────────────────────────────────────────────────────────────────────────

import type * as SpeechSdkTypes from 'microsoft-cognitiveservices-speech-sdk';

let cached: typeof SpeechSdkTypes | null = null;

/** Carga perezosa del runtime de navegador del Azure Speech SDK (sin deps de Node). */
export async function loadSpeechSdk(): Promise<typeof SpeechSdkTypes> {
  if (cached) return cached;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — el .bundle.d.ts es inválido; el runtime se normaliza y castea abajo.
  const mod = (await import('microsoft-cognitiveservices-speech-sdk/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js')) as Record<string, unknown>;

  cached = (mod['default'] ?? mod) as unknown as typeof SpeechSdkTypes;
  return cached;
}
