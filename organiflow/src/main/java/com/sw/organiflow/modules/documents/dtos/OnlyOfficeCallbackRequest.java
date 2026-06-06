package com.sw.organiflow.modules.documents.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Payload del callback del Document Server de OnlyOffice.
 *
 * <p>{@code status}: 1=editando, 2=listo para guardar, 3=error al guardar, 4=cerrado sin cambios,
 * 6=force-save, 7=error de force-save. En 2 y 6 hay que descargar {@code url} y versionar.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OnlyOfficeCallbackRequest(
        int status,
        String key,
        String url,
        List<String> users,
        String token
) {}
