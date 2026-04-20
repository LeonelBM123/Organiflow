package com.sw.organiflow.modules.workflow.models;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowLane {
    private String id;
    private String name;
    private String role;        // admin | officer | user
    private Integer height;     // Syncfusion
    private String color;       // Syncfusion
    private Integer sortOrder;
}
