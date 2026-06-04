part of 'tasks_bloc.dart';

sealed class TasksEvent extends Equatable {
  const TasksEvent();

  @override
  List<Object?> get props => [];
}

class TasksRequested extends TasksEvent {}

class TaskStarted extends TasksEvent {
  const TaskStarted(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class TaskCompleted extends TasksEvent {
  const TaskCompleted({required this.id, required this.formData});

  final String id;
  final Map<String, dynamic> formData;

  @override
  List<Object?> get props => [id, formData];
}

class TaskEscalated extends TasksEvent {
  const TaskEscalated(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class TasksMessageCleared extends TasksEvent {}
