import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/department_entity.dart';
import '../repositories/admin_repository.dart';

class AddDepartmentMemberUseCase {
  const AddDepartmentMemberUseCase(this.repository);

  final AdminRepository repository;

  Future<Either<Failure, DepartmentEntity>> call(
    String departmentId,
    String userId,
  ) {
    return repository.addDepartmentMember(departmentId, userId);
  }
}
