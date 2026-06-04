import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  const Failure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}

class ServerFailure extends Failure {
  const ServerFailure([super.message = 'Error del servidor']);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Error de cache']);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'Sin conexion']);
}

class AuthFailure extends Failure {
  const AuthFailure([super.message = 'Error de autenticacion']);
}
