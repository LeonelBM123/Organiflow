import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../requests/domain/entities/workflow_summary_entity.dart';
import '../entities/admin_user_entity.dart';
import '../entities/department_entity.dart';

abstract class AdminRepository {
  Future<Either<Failure, List<WorkflowSummaryEntity>>> getWorkflows();
  Future<Either<Failure, Unit>> publishWorkflow(String id);
  Future<Either<Failure, Unit>> archiveWorkflow(String id);
  Future<Either<Failure, Unit>> revertWorkflowToDraft(String id);
  Future<Either<Failure, List<DepartmentEntity>>> getDepartments();
  Future<Either<Failure, List<AdminUserEntity>>> getUsers();
  Future<Either<Failure, DepartmentEntity>> addDepartmentMember(
    String departmentId,
    String userId,
  );
  Future<Either<Failure, DepartmentEntity>> removeDepartmentMember(
    String departmentId,
    String userId,
  );
}
