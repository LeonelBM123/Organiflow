import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/tenant_entity.dart';
import '../repositories/auth_repository.dart';

class SelectTenantUseCase {
  const SelectTenantUseCase(this.repository);

  final AuthRepository repository;

  Future<Either<Failure, String>> call(TenantEntity tenant) {
    return repository.selectTenant(tenant);
  }
}
