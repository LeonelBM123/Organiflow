import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/services/notification_bootstrap_service.dart';
import '../../domain/entities/tenant_entity.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/usecases/get_current_user_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/refresh_token_usecase.dart';
import '../../domain/usecases/select_tenant_usecase.dart';
import '../../../notifications/domain/usecases/send_push_token_usecase.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc({
    required LoginUseCase loginUseCase,
    required SelectTenantUseCase selectTenantUseCase,
    required RefreshTokenUseCase refreshTokenUseCase,
    required LogoutUseCase logoutUseCase,
    required GetCurrentUserUseCase getCurrentUserUseCase,
    required SendPushTokenUseCase sendPushTokenUseCase,
  }) : _loginUseCase = loginUseCase,
       _selectTenantUseCase = selectTenantUseCase,
       _refreshTokenUseCase = refreshTokenUseCase,
       _logoutUseCase = logoutUseCase,
       _getCurrentUserUseCase = getCurrentUserUseCase,
       _sendPushTokenUseCase = sendPushTokenUseCase,
       super(AuthInitial()) {
    on<LoginSubmitted>(_onLoginSubmitted);
    on<TenantSelected>(_onTenantSelected);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthSessionRestored>(_onSessionRestored);
  }

  final LoginUseCase _loginUseCase;
  final SelectTenantUseCase _selectTenantUseCase;
  final RefreshTokenUseCase _refreshTokenUseCase;
  final LogoutUseCase _logoutUseCase;
  final GetCurrentUserUseCase _getCurrentUserUseCase;
  final SendPushTokenUseCase _sendPushTokenUseCase;

  Future<void> _onLoginSubmitted(
    LoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final result = await _loginUseCase(
      LoginParams(email: event.email, password: event.password),
    );

    await result.fold((failure) async {
      emit(AuthError(failure.message));
    }, (response) async {
      final hasDirectSession =
          response.accessToken.isNotEmpty &&
          (response.tenantId?.isNotEmpty ?? false);

      if (hasDirectSession) {
        await _registerDeviceTokenSafely();
        emit(
          AuthAuthenticated(
            user: response.user,
            tenantId: response.tenantId!,
            tenantName: response.tenants.length == 1
                ? response.tenants.first.name
                : response.tenantId!,
            role: response.role ?? '',
          ),
        );
        return;
      }

      emit(
        AuthNeedsTenantSelection(
          user: response.user,
          tenants: response.tenants,
        ),
      );
    });
  }

  Future<void> _onTenantSelected(
    TenantSelected event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final refreshed = await _refreshTokenUseCase();
    final tenantResult = await _selectTenantUseCase(event.tenant);

    if (refreshed.isLeft()) {
      emit(const AuthError('No se pudo refrescar la sesion'));
      return;
    }

    tenantResult.fold((failure) => emit(AuthError(failure.message)), (_) {
      final previous = state;
      final user = previous is AuthNeedsTenantSelection
          ? previous.user
          : const UserEntity(
              id: 'usr-1',
              name: 'Usuario',
              email: 'user@organiflow.com',
            );
      _registerDeviceTokenSafely();
      emit(
        AuthAuthenticated(
          user: user,
          tenantId: event.tenant.id,
          tenantName: event.tenant.name,
          role: event.tenant.role,
        ),
      );
    });
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _logoutUseCase();
    emit(AuthUnauthenticated());
  }

  Future<void> _onSessionRestored(
    AuthSessionRestored event,
    Emitter<AuthState> emit,
  ) async {
    final result = await _getCurrentUserUseCase();
    result.fold(
      (_) => emit(AuthUnauthenticated()),
      (user) => emit(user == null ? AuthUnauthenticated() : AuthInitial()),
    );
  }

  Future<void> _registerDeviceTokenSafely() async {
    try {
      final token = await NotificationBootstrapService.getPushToken();
      if (token == null || token.isEmpty) {
        return;
      }
      await _sendPushTokenUseCase(token);
    } catch (_) {
      // Push registration should not block authentication.
    }
  }
}
