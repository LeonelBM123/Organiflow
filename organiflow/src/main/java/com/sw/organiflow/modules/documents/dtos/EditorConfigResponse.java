package com.sw.organiflow.modules.documents.dtos;

import java.util.Map;

/**
 * Respuesta para montar el editor de OnlyOffice en el navegador.
 *
 * @param documentServerUrl base del Document Server (para cargar api.js)
 * @param config            configuracion que el front pasa a {@code new DocsAPI.DocEditor(...)},
 *                          ya incluye el campo {@code token} (JWT firmado con el secreto del DS)
 */
public record EditorConfigResponse(
        String documentServerUrl,
        Map<String, Object> config
) {}
