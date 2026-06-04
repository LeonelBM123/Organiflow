import '../../domain/entities/execution_summary_entity.dart';

class ExecutionSummaryModel extends ExecutionSummaryEntity {
  const ExecutionSummaryModel({
    required super.id,
    required super.workflowId,
    required super.workflowName,
    required super.workflowVersion,
    required super.initiatedByUserId,
    required super.status,
    required super.currentNodeIds,
    super.startedAt,
    super.completedAt,
    super.createdAt,
  });

  factory ExecutionSummaryModel.fromJson(Map<String, dynamic> json) {
    return ExecutionSummaryModel(
      id: json['id'] as String,
      workflowId: json['workflowId'] as String? ?? '',
      workflowName: json['workflowName'] as String? ?? '',
      workflowVersion: json['workflowVersion'] as int? ?? 0,
      initiatedByUserId: json['initiatedByUserId'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currentNodeIds: (json['currentNodeIds'] as List<dynamic>? ?? const [])
          .map((item) => item as String)
          .toList(),
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'] as String)
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
