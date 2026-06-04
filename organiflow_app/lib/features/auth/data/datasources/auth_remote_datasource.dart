import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import 'package:dio/dio.dart';

import '../models/auth_response_model.dart';
import '../models/login_request_model.dart';
import '../models/login_response_model.dart';
import '../models/tenant_selection_request_model.dart';

abstract class AuthRemoteDataSource {
  Future<LoginResponseModel> login(LoginRequestModel request);
  Future<AuthResponseModel> selectTenant({
    required String email,
    required String tenantId,
  });
  Future<AuthResponseModel> refreshToken(String refreshToken);
  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<LoginResponseModel> login(LoginRequestModel request) async {
    final response = await _apiClient.post(
      '${ApiConstants.auth}/login',
      data: request.toJson(),
    );
    return LoginResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseModel> refreshToken(String refreshToken) async {
    final response = await _apiClient.postWithOptions(
      '${ApiConstants.auth}/refresh',
      data: const <String, dynamic>{},
      options: Options(headers: {'X-Refresh-Token': refreshToken}),
    );
    return AuthResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseModel> selectTenant({
    required String email,
    required String tenantId,
  }) async {
    final response = await _apiClient.post(
      '${ApiConstants.auth}/select-tenant',
      data: TenantSelectionRequestModel(
        email: email,
        tenantId: tenantId,
      ).toJson(),
    );
    return AuthResponseModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> logout() async {
    await _apiClient.post(
      '${ApiConstants.auth}/logout',
      data: const <String, dynamic>{},
    );
  }
}
