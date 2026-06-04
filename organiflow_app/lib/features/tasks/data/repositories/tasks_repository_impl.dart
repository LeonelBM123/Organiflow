import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/task_entity.dart';
import '../../domain/repositories/tasks_repository.dart';
import '../datasources/tasks_remote_datasource.dart';

class TasksRepositoryImpl implements TasksRepository {
  TasksRepositoryImpl({required TasksRemoteDataSource remoteDataSource})
    : _remoteDataSource = remoteDataSource;

  final TasksRemoteDataSource _remoteDataSource;

  @override
  Future<Either<Failure, TaskEntity>> completeTask(
    String id,
    Map<String, dynamic> formData,
  ) async {
    try {
      final task = await _remoteDataSource.completeTask(id, formData);
      return Right(task);
    } catch (_) {
      return const Left(ServerFailure('No se pudo completar la tarea'));
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> escalateTask(String id) async {
    try {
      final task = await _remoteDataSource.escalateTask(id);
      return Right(task);
    } catch (_) {
      return const Left(ServerFailure('No se pudo escalar la tarea'));
    }
  }

  @override
  Future<Either<Failure, List<TaskEntity>>> getMyTasks() async {
    try {
      final tasks = await _remoteDataSource.getMyTasks();
      return Right(tasks);
    } catch (_) {
      return const Left(
        ServerFailure('No se pudieron cargar los formularios pendientes'),
      );
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> startTask(String id) async {
    try {
      final task = await _remoteDataSource.startTask(id);
      return Right(task);
    } catch (_) {
      return const Left(ServerFailure('No se pudo iniciar la tarea'));
    }
  }
}
