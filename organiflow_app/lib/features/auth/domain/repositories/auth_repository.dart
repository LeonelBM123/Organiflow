import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/tenant_entity.dart';
import '../entities/user_entity.dart';
import '../../data/models/login_response_model.dart';

abstract class AuthRepository {
  Future<Either<Failure, LoginResponseModel>> login(
    String email,
    String password,
  );
  Future<Either<Failure, UserEntity?>> getCurrentUser();
  Future<Either<Failure, String>> selectTenant(TenantEntity tenant);
  Future<Either<Failure, String>> refreshToken();
  Future<Either<Failure, Unit>> logout();
  Future<String?> getCurrentTenantName();
  Future<String?> getCurrentRole();
  Future<String?> getCurrentTenantId();
}
