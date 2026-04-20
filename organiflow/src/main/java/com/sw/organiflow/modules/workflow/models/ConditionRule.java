package com.sw.organiflow.modules.workflow.models;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConditionRule {
    private String field;       // campo del global_context a evaluar
    private String operator;    // == | != | > | < | >= | <= | contains
    private Object value;       // valor a comparar
}