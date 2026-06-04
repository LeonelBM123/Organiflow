import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/execution_summary_entity.dart';
import '../../domain/entities/workflow_summary_entity.dart';
import '../../domain/usecases/get_my_executions_usecase.dart';
import '../../domain/usecases/get_published_workflows_usecase.dart';
import '../../domain/usecases/start_execution_usecase.dart';

part 'requests_event.dart';
part 'requests_state.dart';

class RequestsBloc extends Bloc<RequestsEvent, RequestsState> {
  RequestsBloc({
    required GetMyExecutionsUseCase getMyExecutionsUseCase,
    required GetPublishedWorkflowsUseCase getPublishedWorkflowsUseCase,
    required StartExecutionUseCase startExecutionUseCase,
  }) : _getMyExecutionsUseCase = getMyExecutionsUseCase,
       _getPublishedWorkflowsUseCase = getPublishedWorkflowsUseCase,
       _startExecutionUseCase = startExecutionUseCase,
       super(const RequestsState()) {
    on<RequestsOverviewRequested>(_onOverviewRequested);
    on<PublishedWorkflowsRequested>(_onPublishedWorkflowsRequested);
    on<ExecutionStarted>(_onExecutionStarted);
    on<RequestsMessageCleared>(_onMessageCleared);
  }

  final GetMyExecutionsUseCase _getMyExecutionsUseCase;
  final GetPublishedWorkflowsUseCase _getPublishedWorkflowsUseCase;
  final StartExecutionUseCase _startExecutionUseCase;

  Future<void> _onOverviewRequested(
    RequestsOverviewRequested event,
    Emitter<RequestsState> emit,
  ) async {
    emit(
      state.copyWith(
        isLoadingOverview: true,
        clearError: true,
        clearSuccess: true,
      ),
    );
    final result = await _getMyExecutionsUseCase();
    result.fold(
      (failure) => emit(
        state.copyWith(
          isLoadingOverview: false,
          errorMessage: failure.message,
          clearSuccess: true,
        ),
      ),
      (executions) {
        final active = executions.where((item) => !item.isHistorical).toList();
        final history = executions.where((item) => item.isHistorical).toList();
        emit(
          state.copyWith(
            isLoadingOverview: false,
            myRequests: active,
            history: history,
            clearError: true,
          ),
        );
      },
    );
  }

  Future<void> _onPublishedWorkflowsRequested(
    PublishedWorkflowsRequested event,
    Emitter<RequestsState> emit,
  ) async {
    emit(state.copyWith(isLoadingCatalog: true, clearError: true));
    final result = await _getPublishedWorkflowsUseCase();
    result.fold(
      (failure) => emit(
        state.copyWith(isLoadingCatalog: false, errorMessage: failure.message),
      ),
      (workflows) => emit(
        state.copyWith(
          isLoadingCatalog: false,
          publishedWorkflows: workflows,
          clearError: true,
        ),
      ),
    );
  }

  Future<void> _onExecutionStarted(
    ExecutionStarted event,
    Emitter<RequestsState> emit,
  ) async {
    emit(
      state.copyWith(isStarting: true, clearError: true, clearSuccess: true),
    );
    final result = await _startExecutionUseCase(event.workflowId);
    result.fold(
      (failure) => emit(
        state.copyWith(isStarting: false, errorMessage: failure.message),
      ),
      (_) async {
        emit(
          state.copyWith(
            isStarting: false,
            successMessage: 'Solicitud iniciada correctamente',
            clearError: true,
          ),
        );
        add(RequestsOverviewRequested());
      },
    );
  }

  void _onMessageCleared(
    RequestsMessageCleared event,
    Emitter<RequestsState> emit,
  ) {
    emit(state.copyWith(clearError: true, clearSuccess: true));
  }
}
