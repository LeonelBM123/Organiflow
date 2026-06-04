import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUserUseCase {
  const GetCurrentUserUseCase(this.repository);

  final AuthRepository repository;

  Future<Either<Failure, UserEntity?>> call() => repository.getCurrentUser();
}
