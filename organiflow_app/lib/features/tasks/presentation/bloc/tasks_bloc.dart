import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/task_entity.dart';
import '../../domain/usecases/complete_task_usecase.dart';
import '../../domain/usecases/escalate_task_usecase.dart';
import '../../domain/usecases/get_my_tasks_usecase.dart';
import '../../domain/usecases/start_task_usecase.dart';

part 'tasks_event.dart';
part 'tasks_state.dart';

class TasksBloc extends Bloc<TasksEvent, TasksState> {
  TasksBloc({
    required GetMyTasksUseCase getMyTasksUseCase,
    required StartTaskUseCase startTaskUseCase,
    required CompleteTaskUseCase completeTaskUseCase,
    required EscalateTaskUseCase escalateTaskUseCase,
  }) : _getMyTasksUseCase = getMyTasksUseCase,
       _startTaskUseCase = startTaskUseCase,
       _completeTaskUseCase = completeTaskUseCase,
       _escalateTaskUseCase = escalateTaskUseCase,
       super(const TasksState()) {
    on<TasksRequested>(_onTasksRequested);
    on<TaskStarted>(_onTaskStarted);
    on<TaskCompleted>(_onTaskCompleted);
    on<TaskEscalated>(_onTaskEscalated);
    on<TasksMessageCleared>(_onMessageCleared);
  }

  final GetMyTasksUseCase _getMyTasksUseCase;
  final StartTaskUseCase _startTaskUseCase;
  final CompleteTaskUseCase _completeTaskUseCase;
  final EscalateTaskUseCase _escalateTaskUseCase;

  Future<void> _onTasksRequested(
    TasksRequested event,
    Emitter<TasksState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true, clearSuccess: true));
    final result = await _getMyTasksUseCase();
    result.fold(
      (failure) =>
          emit(state.copyWith(isLoading: false, errorMessage: failure.message)),
      (tasks) => emit(
        state.copyWith(isLoading: false, tasks: tasks, clearError: true),
      ),
    );
  }

  Future<void> _onTaskStarted(
    TaskStarted event,
    Emitter<TasksState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _startTaskUseCase(event.id);
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (_) {
        emit(
          state.copyWith(isSubmitting: false, successMessage: 'Tarea iniciada'),
        );
        add(TasksRequested());
      },
    );
  }

  Future<void> _onTaskCompleted(
    TaskCompleted event,
    Emitter<TasksState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _completeTaskUseCase(event.id, event.formData);
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (_) {
        emit(
          state.copyWith(
            isSubmitting: false,
            successMessage: 'Tarea completada',
          ),
        );
        add(TasksRequested());
      },
    );
  }

  Future<void> _onTaskEscalated(
    TaskEscalated event,
    Emitter<TasksState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _escalateTaskUseCase(event.id);
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (_) {
        emit(
          state.copyWith(isSubmitting: false, successMessage: 'Tarea escalada'),
        );
        add(TasksRequested());
      },
    );
  }

  void _onMessageCleared(TasksMessageCleared event, Emitter<TasksState> emit) {
    emit(state.copyWith(clearError: true, clearSuccess: true));
  }
}
