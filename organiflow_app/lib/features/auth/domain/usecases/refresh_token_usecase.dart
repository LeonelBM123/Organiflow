import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/auth_repository.dart';

class RefreshTokenUseCase {
  const RefreshTokenUseCase(this.repository);

  final AuthRepository repository;

  Future<Either<Failure, String>> call() => repository.refreshToken();
}
