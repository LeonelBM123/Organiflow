import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/task_entity.dart';
import '../repositories/tasks_repository.dart';

class StartTaskUseCase {
  const StartTaskUseCase(this.repository);

  final TasksRepository repository;

  Future<Either<Failure, TaskEntity>> call(String id) {
    return repository.startTask(id);
  }
}
