package com.sw.organiflow.modules.documents.models;

/**
 * Categoria funcional del documento, derivada de su MIME type. Determina como se trata el
 * archivo en el frontend: los Office son co-editables (OnlyOffice, fase 2), el PDF se visualiza
 * con anotaciones (fase 3) y las imagenes/videos se visualizan con permisos.
 */
public enum DocumentCategory {
    OFFICE_WORD,
    OFFICE_CELL,
    OFFICE_SLIDE,
    PDF,
    IMAGE,
    VIDEO,
    OTHER;

    /**
     * Mapea un MIME type a su categoria. Tolerante: lo desconocido cae en {@link #OTHER}.
     */
    public static DocumentCategory fromMime(String mime) {
        if (mime == null || mime.isBlank()) {
            return OTHER;
        }
        String m = mime.toLowerCase();
        return switch (m) {
            case "application/msword",
                 "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    -> OFFICE_WORD;
            case "application/vnd.ms-excel",
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    -> OFFICE_CELL;
            case "application/vnd.ms-powerpoint",
                 "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    -> OFFICE_SLIDE;
            case "application/pdf" -> PDF;
            default -> {
                if (m.startsWith("image/")) yield IMAGE;
                if (m.startsWith("video/")) yield VIDEO;
                yield OTHER;
            }
        };
    }

    public boolean isOffice() {
        return this == OFFICE_WORD || this == OFFICE_CELL || this == OFFICE_SLIDE;
    }
}
