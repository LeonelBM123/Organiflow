export const environment = {
    production: false,
    apiUrl: 'http://localhost:8001',

    // Claude API — NUNCA poner la key aquí.
    // Toda la IA se procesa en el backend (Spring Boot).
    // El frontend solo envía el texto transcrito a /api/ai/*
};