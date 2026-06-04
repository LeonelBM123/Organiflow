import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/services/notification_bootstrap_service.dart';
import '../../domain/entities/notification_entity.dart';
import '../../domain/usecases/get_notifications_usecase.dart';
import '../../domain/usecases/mark_notification_read_usecase.dart';
import '../../domain/usecases/send_push_token_usecase.dart';

part 'notifications_event.dart';
part 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  NotificationsBloc({
    required GetNotificationsUseCase getNotificationsUseCase,
    required MarkNotificationReadUseCase markNotificationReadUseCase,
    required SendPushTokenUseCase sendPushTokenUseCase,
  }) : _getNotificationsUseCase = getNotificationsUseCase,
       _markNotificationReadUseCase = markNotificationReadUseCase,
       _sendPushTokenUseCase = sendPushTokenUseCase,
       super(NotificationsInitial()) {
    on<NotificationsRequested>(_onRequested);
    on<NotificationReadRequested>(_onReadRequested);
    on<NotificationsSyncRequested>(_onSyncRequested);

    _foregroundSubscription = NotificationBootstrapService.foregroundMessages
        .listen((_) => add(NotificationsSyncRequested()));
  }

  final GetNotificationsUseCase _getNotificationsUseCase;
  final MarkNotificationReadUseCase _markNotificationReadUseCase;
  final SendPushTokenUseCase _sendPushTokenUseCase;
  late final StreamSubscription<Map<String, dynamic>> _foregroundSubscription;

  Future<void> _onRequested(
    NotificationsRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(NotificationsLoading());
    await _registerDeviceTokenSafely();
    final result = await _getNotificationsUseCase();
    result.fold(
      (failure) => emit(NotificationsError(failure.message)),
      (notifications) => emit(NotificationsLoaded(notifications)),
    );
  }

  Future<void> _onSyncRequested(
    NotificationsSyncRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    final current = state;
    final result = await _getNotificationsUseCase();
    result.fold(
      (failure) {
        if (current is! NotificationsLoaded) {
          emit(NotificationsError(failure.message));
        }
      },
      (notifications) => emit(NotificationsLoaded(notifications)),
    );
  }

  Future<void> _onReadRequested(
    NotificationReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    final current = state;
    if (current is! NotificationsLoaded) {
      return;
    }

    await _markNotificationReadUseCase(event.id);
    final updated = current.notifications
        .map(
          (notification) => notification.id == event.id
              ? NotificationEntity(
                  id: notification.id,
                  title: notification.title,
                  body: notification.body,
                  type: notification.type,
                  createdAt: notification.createdAt,
                  isRead: true,
                  priority: notification.priority,
                  entityType: notification.entityType,
                  entityId: notification.entityId,
                  metadata: notification.metadata,
                )
              : notification,
        )
        .toList();
    emit(NotificationsLoaded(updated));
  }

  Future<void> _registerDeviceToken() async {
    final token = await NotificationBootstrapService.getPushToken();
    if (token == null || token.isEmpty) {
      return;
    }
    await _sendPushTokenUseCase(token);
  }

  Future<void> _registerDeviceTokenSafely() async {
    try {
      await _registerDeviceToken();
    } catch (_) {
      // Token registration must not block the notification inbox.
    }
  }

  @override
  Future<void> close() async {
    await _foregroundSubscription.cancel();
    return super.close();
  }
}
