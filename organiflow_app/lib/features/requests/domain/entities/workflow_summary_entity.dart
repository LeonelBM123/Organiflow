import 'package:equatable/equatable.dart';

class WorkflowSummaryEntity extends Equatable {
  const WorkflowSummaryEntity({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    required this.currentVersion,
    this.totalNodes,
    this.totalLanes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String status;
  final int currentVersion;
  final int? totalNodes;
  final int? totalLanes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => [
    id,
    name,
    description,
    status,
    currentVersion,
    totalNodes,
    totalLanes,
    createdAt,
    updatedAt,
  ];
}
