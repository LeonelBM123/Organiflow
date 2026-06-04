import 'package:equatable/equatable.dart';

import 'form_schema_entity.dart';

class TaskEntity extends Equatable {
  const TaskEntity({
    required this.id,
    required this.executionId,
    required this.workflowId,
    required this.nodeId,
    required this.nodeName,
    required this.status,
    this.assignedRole,
    this.departmentId,
    this.formSchema,
    this.formData,
    this.dueAt,
    this.completedAt,
    this.createdAt,
  });

  final String id;
  final String executionId;
  final String workflowId;
  final String nodeId;
  final String nodeName;
  final String status;
  final String? assignedRole;
  final String? departmentId;
  final FormSchemaEntity? formSchema;
  final Map<String, dynamic>? formData;
  final DateTime? dueAt;
  final DateTime? completedAt;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
    id,
    executionId,
    workflowId,
    nodeId,
    nodeName,
    status,
    assignedRole,
    departmentId,
    formSchema,
    formData,
    dueAt,
    completedAt,
    createdAt,
  ];
}
