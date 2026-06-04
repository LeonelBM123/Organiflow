import 'package:dio/dio.dart';

class ErrorHandler {
  static String handleError(Object error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          return 'Tiempo de conexion agotado';
        case DioExceptionType.receiveTimeout:
          return 'Tiempo de respuesta agotado';
        case DioExceptionType.badResponse:
          return _handleBadResponse(
            error.response?.statusCode,
            error.response?.data,
          );
        case DioExceptionType.connectionError:
          return 'No se pudo conectar al servidor';
        default:
          return 'Error de red inesperado';
      }
    }
    return 'Error inesperado';
  }

  static String _handleBadResponse(int? statusCode, dynamic data) {
    final backendMessage = _extractBackendMessage(data);
    if (backendMessage != null && backendMessage.isNotEmpty) {
      return backendMessage;
    }

    switch (statusCode) {
      case 400:
        return 'Solicitud invalida';
      case 401:
        return 'No autorizado';
      case 403:
        return 'Acceso prohibido';
      case 404:
        return 'Recurso no encontrado';
      case 500:
        return 'Error interno del servidor';
      default:
        return 'Error del servidor';
    }
  }

  static String? _extractBackendMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
      final error = data['error'];
      if (error is String && error.trim().isNotEmpty) {
        return error.trim();
      }
    }
    return null;
  }
}
