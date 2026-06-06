package com.sw.organiflow.modules.documents.models;

/**
 * Ciclo de vida del documento. {@code PENDING_UPLOAD} se crea al emitir la URL prefirmada;
 * pasa a {@code READY} cuando el cliente confirma que subio el archivo a S3.
 */
public enum DocumentStatus {
    PENDING_UPLOAD,
    READY
}
