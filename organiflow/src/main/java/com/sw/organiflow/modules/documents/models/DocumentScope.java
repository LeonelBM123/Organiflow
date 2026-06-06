package com.sw.organiflow.modules.documents.models;

/**
 * Indica si el documento es una plantilla definida por el admin al configurar el nodo
 * ({@code TEMPLATE}) o un archivo subido por un funcionario durante la ejecucion de una
 * tarea ({@code RUNTIME}).
 */
public enum DocumentScope {
    TEMPLATE,
    RUNTIME
}
