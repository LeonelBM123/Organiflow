package com.sw.organiflow.modules.workflow.models;
import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormField {
    private String name;
    private String label;
    private String type;        // text|number|select|multiselect|date|file|boolean|textarea
    private boolean required;
    private List<String> options;
    private Map<String, Object> validationRules;
    private Map<String, Object> visibilityConditions;
    private Integer sortOrder;
}