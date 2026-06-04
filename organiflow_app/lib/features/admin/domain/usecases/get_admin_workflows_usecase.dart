import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../requests/domain/entities/workflow_summary_entity.dart';
import '../repositories/admin_repository.dart';

class GetAdminWorkflowsUseCase {
  const GetAdminWorkflowsUseCase(this.repository);

  final AdminRepository repository;

  Future<Either<Failure, List<WorkflowSummaryEntity>>> call() {
    return repository.getWorkflows();
  }
}
