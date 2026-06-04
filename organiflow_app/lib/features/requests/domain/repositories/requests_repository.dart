import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/execution_summary_entity.dart';
import '../entities/workflow_summary_entity.dart';

abstract class RequestsRepository {
  Future<Either<Failure, List<ExecutionSummaryEntity>>> getMyExecutions();
  Future<Either<Failure, List<WorkflowSummaryEntity>>> getPublishedWorkflows();
  Future<Either<Failure, Unit>> startExecution(String workflowId);
}
