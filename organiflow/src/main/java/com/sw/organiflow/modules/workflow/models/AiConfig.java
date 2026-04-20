package com.sw.organiflow.modules.workflow.models;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConfig {
    private String prompt;
    private String model;
    private boolean autoExecute;
}