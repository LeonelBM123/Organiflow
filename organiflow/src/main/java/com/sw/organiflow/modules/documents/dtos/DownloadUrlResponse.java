package com.sw.organiflow.modules.documents.dtos;

/** URL prefirmada de descarga/visualizacion temporal. */
public record DownloadUrlResponse(
        String url,
        String mimeType,
        String originalName
) {}
