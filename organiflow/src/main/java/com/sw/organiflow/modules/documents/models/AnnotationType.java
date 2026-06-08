package com.sw.organiflow.modules.documents.models;

/**
 * Tipo de anotación sobre un documento.
 *
 * <ul>
 *   <li>{@link #DRAWING} — trazo de dibujo libre (markup) sobre PDF o imagen. Requiere
 *       permiso {@code canEdit}.</li>
 *   <li>{@link #TEXT} — texto colocado en una posición del PDF o imagen (markup). Requiere
 *       permiso {@code canEdit}.</li>
 *   <li>{@link #COMMENT} — comentario en el hilo lateral (PDF, imagen o video). Requiere
 *       permiso {@code canComment}.</li>
 * </ul>
 */
public enum AnnotationType {
    DRAWING,
    TEXT,
    COMMENT
}
