import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/network/dio_provider.dart';
import '../../../core/network/token_storage.dart';
import 'models/login_response.dart';

part 'auth_repository.g.dart';

class AuthRepository {
  final Dio _dio;
  final TokenStorage _storage;

  AuthRepository(this._dio, this._storage);

  Future<LoginResponse> login(String email, String password) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'correo': email, 'password': password},
    );

    final loginResponse = LoginResponse.fromJson(response.data);
    final token = loginResponse.accessToken;
    if (token != null) await _storage.saveToken(token);
    return loginResponse;
  }
}

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(tokenStorageProvider),
  );
}
