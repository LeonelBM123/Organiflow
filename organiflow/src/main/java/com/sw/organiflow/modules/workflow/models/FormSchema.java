package com.sw.organiflow.modules.workflow.models;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormSchema {
    private String name;
    private List<FormField> fields;
}