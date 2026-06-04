import 'package:dio/dio.dart';

import '../../../features/auth/data/datasources/auth_local_datasource.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor({required AuthLocalDataSource localDataSource})
    : _localDataSource = localDataSource;

  final AuthLocalDataSource _localDataSource;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final accessToken = await _localDataSource.getAccessToken();

    if ((options.headers['Authorization'] == null) &&
        accessToken != null &&
        accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    handler.next(options);
  }
}
