part of 'auth_bloc.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class LoginSubmitted extends AuthEvent {
  const LoginSubmitted({required this.email, required this.password});

  final String email;
  final String password;

  @override
  List<Object?> get props => [email, password];
}

class TenantSelected extends AuthEvent {
  const TenantSelected(this.tenant);

  final TenantEntity tenant;

  @override
  List<Object?> get props => [tenant];
}

class AuthLogoutRequested extends AuthEvent {}

class AuthSessionRestored extends AuthEvent {}
