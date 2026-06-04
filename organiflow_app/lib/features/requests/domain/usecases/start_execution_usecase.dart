import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/requests_repository.dart';

class StartExecutionUseCase {
  const StartExecutionUseCase(this.repository);

  final RequestsRepository repository;

  Future<Either<Failure, Unit>> call(String workflowId) {
    return repository.startExecution(workflowId);
  }
}
