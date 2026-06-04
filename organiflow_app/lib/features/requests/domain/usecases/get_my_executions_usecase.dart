import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/execution_summary_entity.dart';
import '../repositories/requests_repository.dart';

class GetMyExecutionsUseCase {
  const GetMyExecutionsUseCase(this.repository);

  final RequestsRepository repository;

  Future<Either<Failure, List<ExecutionSummaryEntity>>> call() {
    return repository.getMyExecutions();
  }
}
