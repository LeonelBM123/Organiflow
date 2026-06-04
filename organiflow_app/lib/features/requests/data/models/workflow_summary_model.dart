import '../../domain/entities/workflow_summary_entity.dart';

class WorkflowSummaryModel extends WorkflowSummaryEntity {
  const WorkflowSummaryModel({
    required super.id,
    required super.name,
    super.description,
    required super.status,
    required super.currentVersion,
    super.totalNodes,
    super.totalLanes,
    super.createdAt,
    super.updatedAt,
  });

  factory WorkflowSummaryModel.fromJson(Map<String, dynamic> json) {
    return WorkflowSummaryModel(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      status: json['status'] as String? ?? '',
      currentVersion: json['currentVersion'] as int? ?? 0,
      totalNodes: json['totalNodes'] as int?,
      totalLanes: json['totalLanes'] as int?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }
}
