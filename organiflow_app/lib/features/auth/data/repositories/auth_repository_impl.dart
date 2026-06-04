import 'package:dartz/dartz.dart';

import '../../../../core/errors/error_handler.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/tenant_entity.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/login_request_model.dart';
import '../models/login_response_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required AuthLocalDataSource localDataSource,
  }) : _remoteDataSource = remoteDataSource,
       _localDataSource = localDataSource;

  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;

  @override
  Future<Either<Failure, UserEntity?>> getCurrentUser() async {
    final name = await _localDataSource.getUserName();
    final email = await _localDataSource.getUserEmail();
    if (name == null || email == null) {
      return const Right(null);
    }
    return Right(UserEntity(id: 'cached-user', name: name, email: email));
  }

  @override
  Future<Either<Failure, LoginResponseModel>> login(
    String email,
    String password,
  ) async {
    try {
      final response = await _remoteDataSource.login(
        LoginRequestModel(email: email, password: password),
      );
      await _localDataSource.cacheSession(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userName: response.user.name,
        userEmail: response.user.email,
      );
      final directTenantId = response.tenantId;
      final directRole = response.role;
      if (directTenantId != null &&
          directTenantId.isNotEmpty &&
          directRole != null &&
          directRole.isNotEmpty) {
        final tenantName = response.tenants.length == 1
            ? response.tenants.first.name
            : directTenantId;
        await _localDataSource.cacheSelectedTenant(
          tenantId: directTenantId,
          tenantName: tenantName,
          role: directRole,
        );
      }
      return Right(response);
    } catch (error) {
      return Left(AuthFailure(ErrorHandler.handleError(error)));
    }
  }

  @override
  Future<Either<Failure, Unit>> logout() async {
    try {
      await _remoteDataSource.logout();
    } catch (_) {
      // Local cleanup is still required even if the backend logout fails.
    }
    await _localDataSource.clearAll();
    return const Right(unit);
  }

  @override
  Future<Either<Failure, String>> refreshToken() async {
    try {
      final refresh = await _localDataSource.getRefreshToken();
      if (refresh == null || refresh.isEmpty) {
        return const Left(AuthFailure('No hay refresh token disponible'));
      }
      final response = await _remoteDataSource.refreshToken(refresh);
      final name = await _localDataSource.getUserName() ?? 'Usuario';
      final email =
          await _localDataSource.getUserEmail() ?? 'usuario@organiflow.com';
      await _localDataSource.cacheSession(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userName: response.name.isNotEmpty ? response.name : name,
        userEmail: response.email.isNotEmpty ? response.email : email,
      );
      return Right(response.accessToken);
    } catch (error) {
      return Left(AuthFailure(ErrorHandler.handleError(error)));
    }
  }

  @override
  Future<Either<Failure, String>> selectTenant(TenantEntity tenant) async {
    try {
      final email = await _localDataSource.getUserEmail();
      if (email == null || email.isEmpty) {
        return const Left(AuthFailure('No se encontro el correo del usuario'));
      }
      final response = await _remoteDataSource.selectTenant(
        email: email,
        tenantId: tenant.id,
      );
      await _localDataSource.cacheSession(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userName: response.name,
        userEmail: response.email,
      );
      await _localDataSource.cacheSelectedTenant(
        tenantId: response.tenantId,
        tenantName: tenant.name,
        role: response.role,
      );
      return Right(response.accessToken);
    } catch (error) {
      return Left(AuthFailure(ErrorHandler.handleError(error)));
    }
  }

  @override
  Future<String?> getCurrentRole() => _localDataSource.getUserRole();

  @override
  Future<String?> getCurrentTenantId() => _localDataSource.getTenantId();

  @override
  Future<String?> getCurrentTenantName() => _localDataSource.getTenantName();
}
