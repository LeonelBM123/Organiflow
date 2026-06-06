# Fix: `ng build` y el Azure Speech SDK

## Síntoma
`ng build` fallaba con errores de bundling como:

```
X [ERROR] Could not resolve "events" | "url" | "assert" | "util"
X [ERROR] Could not resolve "http" | "https" | "net" | "tls"
   node_modules/microsoft-cognitiveservices-speech-sdk/...
```

## Causa
El entry principal del paquete `microsoft-cognitiveservices-speech-sdk` (`distrib/lib`)
arrastra una pila de red **solo-Node** (`https-proxy-agent`, `agent-base`, y por debajo
`http`, `https`, `net`, `tls`, `events`, `url`, `assert`, `util`). El bundler de navegador
(esbuild, vía `@angular/build`) no provee esos módulos built-in de Node, así que el build
completo se rompe. Estos módulos solo se usan en la ruta de Node del SDK (proxy, websocket
de Node), nunca en el navegador.

> Parchear paquete por paquete (overrides, externals, polyfills) es "whack-a-mole": al tapar
> uno aparece el siguiente. No es la vía correcta.

## Solución (definitiva, sin tooling extra)
El SDK ya incluye un **bundle de navegador pre-empaquetado y sin dependencias de Node** en
`distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js`.

Se introdujo un wrapper —
[`src/app/features/ai/services/azure-speech-sdk.ts`](src/app/features/ai/services/azure-speech-sdk.ts)
— que combina:

- **Tipos** del paquete raíz con `import type` (se borra en compilación, nunca llega al
  bundler, por lo que NO arrastra las deps de Node), y
- **Runtime** del bundle de navegador (limpio).

```ts
import type * as SpeechSdkTypes from 'microsoft-cognitiveservices-speech-sdk';

let cached: typeof SpeechSdkTypes | null = null;

export async function loadSpeechSdk(): Promise<typeof SpeechSdkTypes> {
  if (cached) return cached;
  // @ts-ignore — .bundle.d.ts inválido; se normaliza y castea.
  const mod = (await import('microsoft-cognitiveservices-speech-sdk/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js')) as Record<string, unknown>;
  cached = (mod['default'] ?? mod) as unknown as typeof SpeechSdkTypes;
  return cached;
}
```
Y el consumidor: `const sdk = await loadSpeechSdk();` dentro del método async (antes era
`import { sdk }`).

> ⚠️ **No** usar `import * as` ni imports nombrados ESTÁTICOS del bundle. Es CJS con
> `__esModule: true` sin export `default`; el interop CJS estático de esbuild/Vite reescribe
> los imports a un `default` y **rompe en `ng serve`** (Vite) con *"does not provide an export
> named 'default'"* → pantalla en blanco tras el login (el SDK se cargaba al montar el layout
> vía el avatar). El **`import()` dinámico** evita ese interop y además difiere la carga: el SDK
> solo se baja cuando se usa el TTS, nunca bloquea el arranque. Tras cambiarlo, borrá
> `.angular/cache` y reiniciá `ng serve`.

Y el consumidor usa el wrapper en lugar del paquete directo:

```ts
// antes:  import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { sdk } from './azure-speech-sdk';
```

> Nota: como `sdk` pasó a ser un valor (no un namespace), en posición de **tipo** se deriva
> del valor: `InstanceType<typeof sdk.AudioConfig>` en vez de `sdk.AudioConfig`.

## Resultado
`ng build` compila sin errores. El TTS del avatar sigue funcionando con tipos completos.

## Si el SDK se actualiza
Verificar que siga existiendo `distrib/browser/...bundle.js`. Si Microsoft cambia la ruta del
bundle de navegador, actualizar el `import` del wrapper.
