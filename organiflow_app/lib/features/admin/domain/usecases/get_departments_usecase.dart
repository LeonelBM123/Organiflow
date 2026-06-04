import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/department_entity.dart';
import '../repositories/admin_repository.dart';

class GetDepartmentsUseCase {
  const GetDepartmentsUseCase(this.repository);

  final AdminRepository repository;

  Future<Either<Failure, List<DepartmentEntity>>> call() {
    return repository.getDepartments();
  }
}
