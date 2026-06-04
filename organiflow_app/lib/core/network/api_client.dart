import 'package:dio/dio.dart';

import '../constants/api_constants.dart';

class ApiClient {
  ApiClient({required Dio dio, List<Interceptor> interceptors = const []})
    : _dio = dio {
    _dio.options = BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    );
    _dio.interceptors.addAll(interceptors);
  }

  final Dio _dio;

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response<dynamic>> post(String path, {Map<String, dynamic>? data}) {
    return _dio.post(path, data: data);
  }

  Future<Response<dynamic>> postWithOptions(
    String path, {
    Map<String, dynamic>? data,
    Options? options,
  }) {
    return _dio.post(path, data: data, options: options);
  }

  Future<Response<dynamic>> put(String path, {Map<String, dynamic>? data}) {
    return _dio.put(path, data: data);
  }

  Future<Response<dynamic>> delete(String path) {
    return _dio.delete(path);
  }

  Future<Response<dynamic>> deleteWithData(
    String path, {
    Map<String, dynamic>? data,
  }) {
    return _dio.delete(path, data: data);
  }
}
