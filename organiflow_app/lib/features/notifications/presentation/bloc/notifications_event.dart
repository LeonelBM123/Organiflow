part of 'notifications_bloc.dart';

sealed class NotificationsEvent extends Equatable {
  const NotificationsEvent();

  @override
  List<Object?> get props => [];
}

class NotificationsRequested extends NotificationsEvent {}

class NotificationsSyncRequested extends NotificationsEvent {}

class NotificationReadRequested extends NotificationsEvent {
  const NotificationReadRequested(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}
