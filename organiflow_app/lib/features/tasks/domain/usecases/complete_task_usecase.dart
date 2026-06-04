import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/task_entity.dart';
import '../repositories/tasks_repository.dart';

class CompleteTaskUseCase {
  const CompleteTaskUseCase(this.repository);

  final TasksRepository repository;

  Future<Either<Failure, TaskEntity>> call(
    String id,
    Map<String, dynamic> formData,
  ) {
    return repository.completeTask(id, formData);
  }
}
