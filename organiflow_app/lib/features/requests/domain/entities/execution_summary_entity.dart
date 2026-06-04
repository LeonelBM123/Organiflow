import 'package:equatable/equatable.dart';

class ExecutionSummaryEntity extends Equatable {
  const ExecutionSummaryEntity({
    required this.id,
    required this.workflowId,
    required this.workflowName,
    required this.workflowVersion,
    required this.initiatedByUserId,
    required this.status,
    required this.currentNodeIds,
    this.startedAt,
    this.completedAt,
    this.createdAt,
  });

  final String id;
  final String workflowId;
  final String workflowName;
  final int workflowVersion;
  final String initiatedByUserId;
  final String status;
  final List<String> currentNodeIds;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? createdAt;

  bool get isHistorical =>
      const {'COMPLETED', 'FAILED', 'CANCELED'}.contains(status);

  @override
  List<Object?> get props => [
    id,
    workflowId,
    workflowName,
    workflowVersion,
    initiatedByUserId,
    status,
    currentNodeIds,
    startedAt,
    completedAt,
    createdAt,
  ];
}
