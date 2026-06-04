import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../requests/domain/entities/workflow_summary_entity.dart';
import '../../domain/entities/admin_user_entity.dart';
import '../../domain/entities/department_entity.dart';
import '../../domain/repositories/admin_repository.dart';
import '../datasources/admin_remote_datasource.dart';

class AdminRepositoryImpl implements AdminRepository {
  AdminRepositoryImpl({required AdminRemoteDataSource remoteDataSource})
    : _remoteDataSource = remoteDataSource;

  final AdminRemoteDataSource _remoteDataSource;

  @override
  Future<Either<Failure, DepartmentEntity>> addDepartmentMember(
    String departmentId,
    String userId,
  ) async {
    try {
      final department = await _remoteDataSource.addDepartmentMember(
        departmentId,
        userId,
      );
      return Right(department);
    } catch (_) {
      return const Left(
        ServerFailure('No se pudo agregar el usuario al departamento'),
      );
    }
  }

  @override
  Future<Either<Failure, Unit>> archiveWorkflow(String id) async {
    try {
      await _remoteDataSource.archiveWorkflow(id);
      return const Right(unit);
    } catch (_) {
      return const Left(ServerFailure('No se pudo archivar el workflow'));
    }
  }

  @override
  Future<Either<Failure, List<DepartmentEntity>>> getDepartments() async {
    try {
      final departments = await _remoteDataSource.getDepartments();
      return Right(departments);
    } catch (_) {
      return const Left(
        ServerFailure('No se pudieron cargar los departamentos'),
      );
    }
  }

  @override
  Future<Either<Failure, List<AdminUserEntity>>> getUsers() async {
    try {
      final users = await _remoteDataSource.getUsers();
      return Right(users);
    } catch (_) {
      return const Left(ServerFailure('No se pudieron cargar los usuarios'));
    }
  }

  @override
  Future<Either<Failure, List<WorkflowSummaryEntity>>> getWorkflows() async {
    try {
      final workflows = await _remoteDataSource.getWorkflows();
      return Right(workflows);
    } catch (_) {
      return const Left(ServerFailure('No se pudieron cargar los workflows'));
    }
  }

  @override
  Future<Either<Failure, Unit>> publishWorkflow(String id) async {
    try {
      await _remoteDataSource.publishWorkflow(id);
      return const Right(unit);
    } catch (_) {
      return const Left(ServerFailure('No se pudo publicar el workflow'));
    }
  }

  @override
  Future<Either<Failure, DepartmentEntity>> removeDepartmentMember(
    String departmentId,
    String userId,
  ) async {
    try {
      final department = await _remoteDataSource.removeDepartmentMember(
        departmentId,
        userId,
      );
      return Right(department);
    } catch (_) {
      return const Left(
        ServerFailure('No se pudo remover el usuario del departamento'),
      );
    }
  }

  @override
  Future<Either<Failure, Unit>> revertWorkflowToDraft(String id) async {
    try {
      await _remoteDataSource.revertWorkflowToDraft(id);
      return const Right(unit);
    } catch (_) {
      return const Left(
        ServerFailure('No se pudo revertir el workflow a borrador'),
      );
    }
  }
}
