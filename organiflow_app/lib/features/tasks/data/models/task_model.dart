import '../../domain/entities/task_entity.dart';
import 'form_schema_model.dart';

class TaskModel extends TaskEntity {
  const TaskModel({
    required super.id,
    required super.executionId,
    required super.workflowId,
    required super.nodeId,
    required super.nodeName,
    required super.status,
    super.assignedRole,
    super.departmentId,
    super.formSchema,
    super.formData,
    super.dueAt,
    super.completedAt,
    super.createdAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as String,
      executionId: json['executionId'] as String? ?? '',
      workflowId: json['workflowId'] as String? ?? '',
      nodeId: json['nodeId'] as String? ?? '',
      nodeName: json['nodeName'] as String? ?? '',
      status: json['status'] as String? ?? '',
      assignedRole: json['assignedRole'] as String?,
      departmentId: json['departmentId'] as String?,
      formSchema: json['formSchema'] != null
          ? FormSchemaModel.fromJson(json['formSchema'] as Map<String, dynamic>)
          : null,
      formData: json['formData'] as Map<String, dynamic>?,
      dueAt: json['dueAt'] != null
          ? DateTime.tryParse(json['dueAt'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
