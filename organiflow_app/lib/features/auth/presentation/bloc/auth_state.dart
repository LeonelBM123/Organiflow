part of 'auth_bloc.dart';

sealed class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthNeedsTenantSelection extends AuthState {
  const AuthNeedsTenantSelection({required this.user, required this.tenants});

  final UserEntity user;
  final List<TenantEntity> tenants;

  @override
  List<Object?> get props => [user, tenants];
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated({
    required this.user,
    required this.tenantId,
    required this.tenantName,
    required this.role,
  });

  final UserEntity user;
  final String tenantId;
  final String tenantName;
  final String role;

  @override
  List<Object?> get props => [user, tenantId, tenantName, role];
}

class AuthUnauthenticated extends AuthState {}

class AuthError extends AuthState {
  const AuthError(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}
