import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/task_entity.dart';

abstract class TasksRepository {
  Future<Either<Failure, List<TaskEntity>>> getMyTasks();
  Future<Either<Failure, TaskEntity>> startTask(String id);
  Future<Either<Failure, TaskEntity>> completeTask(
    String id,
    Map<String, dynamic> formData,
  );
  Future<Either<Failure, TaskEntity>> escalateTask(String id);
}
