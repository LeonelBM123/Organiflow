import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/admin_user_entity.dart';
import '../repositories/admin_repository.dart';

class GetAdminUsersUseCase {
  const GetAdminUsersUseCase(this.repository);

  final AdminRepository repository;

  Future<Either<Failure, List<AdminUserEntity>>> call() {
    return repository.getUsers();
  }
}
