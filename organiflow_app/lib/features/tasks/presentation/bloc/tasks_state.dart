part of 'tasks_bloc.dart';

class TasksState extends Equatable {
  const TasksState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.tasks = const [],
    this.errorMessage,
    this.successMessage,
  });

  final bool isLoading;
  final bool isSubmitting;
  final List<TaskEntity> tasks;
  final String? errorMessage;
  final String? successMessage;

  List<TaskEntity> get pendingTasks => tasks
      .where((task) => const {'PENDING', 'IN_PROGRESS'}.contains(task.status))
      .toList();

  List<TaskEntity> get historicalTasks => tasks
      .where(
        (task) => const {'DONE', 'SKIPPED', 'ESCALATED'}.contains(task.status),
      )
      .toList();

  TasksState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<TaskEntity>? tasks,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return TasksState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      tasks: tasks ?? this.tasks,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      successMessage: clearSuccess
          ? null
          : successMessage ?? this.successMessage,
    );
  }

  @override
  List<Object?> get props => [
    isLoading,
    isSubmitting,
    tasks,
    errorMessage,
    successMessage,
  ];
}
