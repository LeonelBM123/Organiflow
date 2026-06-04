import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/execution_summary_entity.dart';
import '../../domain/entities/workflow_summary_entity.dart';
import '../../domain/repositories/requests_repository.dart';
import '../datasources/requests_remote_datasource.dart';

class RequestsRepositoryImpl implements RequestsRepository {
  RequestsRepositoryImpl({required RequestsRemoteDataSource remoteDataSource})
    : _remoteDataSource = remoteDataSource;

  final RequestsRemoteDataSource _remoteDataSource;

  @override
  Future<Either<Failure, List<ExecutionSummaryEntity>>>
  getMyExecutions() async {
    try {
      final executions = await _remoteDataSource.getMyExecutions();
      return Right(executions);
    } catch (_) {
      return const Left(ServerFailure('No se pudieron cargar tus solicitudes'));
    }
  }

  @override
  Future<Either<Failure, List<WorkflowSummaryEntity>>>
  getPublishedWorkflows() async {
    try {
      final workflows = await _remoteDataSource.getPublishedWorkflows();
      return Right(workflows);
    } catch (_) {
      return const Left(
        ServerFailure('No se pudieron cargar los workflows publicados'),
      );
    }
  }

  @override
  Future<Either<Failure, Unit>> startExecution(String workflowId) async {
    try {
      await _remoteDataSource.startExecution(workflowId);
      return const Right(unit);
    } catch (_) {
      return const Left(ServerFailure('No se pudo iniciar la solicitud'));
    }
  }
}
