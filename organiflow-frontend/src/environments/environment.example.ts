// Plantilla de entorno de desarrollo.
// Copiar este archivo a `environment.ts` y rellenar con las claves reales.
// `environment.ts` está en .gitignore y NUNCA debe commitearse con secretos.
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8001',
    iaApiUrl: 'http://127.0.0.1:8000',

    // OnlyOffice Document Server — base accesible desde el navegador (carga api.js).
    // Debe coincidir con app.onlyoffice.url del backend.
    onlyOfficeUrl: 'http://localhost:8082',

    // Azure Cognitive Services — Speech (TTS + visemas lip-sync)
    azureSpeechKey: 'YOUR_AZURE_SPEECH_KEY',
    azureSpeechRegion: 'eastus',

    // OpenRouter — modelo de lenguaje para respuestas del asistente
    openRouterApiKey: 'YOUR_OPENROUTER_API_KEY',
    openRouterModel: 'anthropic/claude-haiku-4-5',  // cualquier modelo de openrouter.ai/models
};
