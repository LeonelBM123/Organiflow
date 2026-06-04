import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/task_entity.dart';
import '../repositories/tasks_repository.dart';

class EscalateTaskUseCase {
  const EscalateTaskUseCase(this.repository);

  final TasksRepository repository;

  Future<Either<Failure, TaskEntity>> call(String id) {
    return repository.escalateTask(id);
  }
}
