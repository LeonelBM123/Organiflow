package com.sw.organiflow.modules.workflow.models;

import com.sw.organiflow.shared.enums.NodeType;
import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowNode {

    private String id;              // local, para Syncfusion
    private String laneId;          // referencia al lane
    private String name;
    private NodeType type;

    // Syncfusion
    private Map<String, String> shape;
    private Double offsetX;
    private Double offsetY;
    private Double width;
    private Double height;
    private List<Map<String, Object>> annotations;
    private List<Map<String, Object>> ports;

    // Responsable — asignación por departamento (obligatorio) y usuario (opcional override)
    private String departmentId;        // departamento responsable del nodo
    private String assignedUserId;      // opcional: asignación fija a un usuario específico del dept

    // Timeout en horas — para el escalado automático
    private Integer timeoutHours;

    // Solo en TASK e ITERATOR
    private FormSchema formSchema;

    // Solo en nodos con IA
    private AiConfig aiConfig;
}
