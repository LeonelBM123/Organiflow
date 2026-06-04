import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/workflow_summary_entity.dart';
import '../repositories/requests_repository.dart';

class GetPublishedWorkflowsUseCase {
  const GetPublishedWorkflowsUseCase(this.repository);

  final RequestsRepository repository;

  Future<Either<Failure, List<WorkflowSummaryEntity>>> call() {
    return repository.getPublishedWorkflows();
  }
}
