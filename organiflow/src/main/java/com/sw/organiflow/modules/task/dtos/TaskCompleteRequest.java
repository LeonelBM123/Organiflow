package com.sw.organiflow.modules.task.dtos;

import lombok.Data;

import java.util.Map;

@Data
public class TaskCompleteRequest {

    private Map<String, Object> formData;
}
