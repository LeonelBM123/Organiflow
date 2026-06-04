import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/task_entity.dart';
import '../repositories/tasks_repository.dart';

class GetMyTasksUseCase {
  const GetMyTasksUseCase(this.repository);

  final TasksRepository repository;

  Future<Either<Failure, List<TaskEntity>>> call() {
    return repository.getMyTasks();
  }
}
