import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../requests/domain/entities/workflow_summary_entity.dart';
import '../../domain/usecases/archive_workflow_usecase.dart';
import '../../domain/usecases/get_admin_workflows_usecase.dart';
import '../../domain/usecases/publish_workflow_usecase.dart';
import '../../domain/usecases/revert_workflow_to_draft_usecase.dart';

part 'admin_workflows_event.dart';
part 'admin_workflows_state.dart';

class AdminWorkflowsBloc
    extends Bloc<AdminWorkflowsEvent, AdminWorkflowsState> {
  AdminWorkflowsBloc({
    required GetAdminWorkflowsUseCase getAdminWorkflowsUseCase,
    required PublishWorkflowUseCase publishWorkflowUseCase,
    required ArchiveWorkflowUseCase archiveWorkflowUseCase,
    required RevertWorkflowToDraftUseCase revertWorkflowToDraftUseCase,
  }) : _getAdminWorkflowsUseCase = getAdminWorkflowsUseCase,
       _publishWorkflowUseCase = publishWorkflowUseCase,
       _archiveWorkflowUseCase = archiveWorkflowUseCase,
       _revertWorkflowToDraftUseCase = revertWorkflowToDraftUseCase,
       super(const AdminWorkflowsState()) {
    on<AdminWorkflowsRequested>(_onRequested);
    on<AdminWorkflowPublished>(_onPublished);
    on<AdminWorkflowArchived>(_onArchived);
    on<AdminWorkflowReverted>(_onReverted);
    on<AdminWorkflowsMessageCleared>(_onMessageCleared);
  }

  final GetAdminWorkflowsUseCase _getAdminWorkflowsUseCase;
  final PublishWorkflowUseCase _publishWorkflowUseCase;
  final ArchiveWorkflowUseCase _archiveWorkflowUseCase;
  final RevertWorkflowToDraftUseCase _revertWorkflowToDraftUseCase;

  Future<void> _onRequested(
    AdminWorkflowsRequested event,
    Emitter<AdminWorkflowsState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true, clearSuccess: true));
    final result = await _getAdminWorkflowsUseCase();
    result.fold(
      (failure) =>
          emit(state.copyWith(isLoading: false, errorMessage: failure.message)),
      (workflows) => emit(
        state.copyWith(
          isLoading: false,
          workflows: workflows,
          clearError: true,
        ),
      ),
    );
  }

  Future<void> _onPublished(
    AdminWorkflowPublished event,
    Emitter<AdminWorkflowsState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _publishWorkflowUseCase(event.id);
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (_) {
        emit(
          state.copyWith(
            isSubmitting: false,
            successMessage: 'Workflow publicado',
          ),
        );
        add(AdminWorkflowsRequested());
      },
    );
  }

  Future<void> _onArchived(
    AdminWorkflowArchived event,
    Emitter<AdminWorkflowsState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _archiveWorkflowUseCase(event.id);
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (_) {
        emit(
          state.copyWith(
            isSubmitting: false,
            successMessage: 'Workflow archivado',
          ),
        );
        add(AdminWorkflowsRequested());
      },
    );
  }

  Future<void> _onReverted(
    AdminWorkflowReverted event,
    Emitter<AdminWorkflowsState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _revertWorkflowToDraftUseCase(event.id);
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (_) {
        emit(
          state.copyWith(
            isSubmitting: false,
            successMessage: 'Workflow revertido a borrador',
          ),
        );
        add(AdminWorkflowsRequested());
      },
    );
  }

  void _onMessageCleared(
    AdminWorkflowsMessageCleared event,
    Emitter<AdminWorkflowsState> emit,
  ) {
    emit(state.copyWith(clearError: true, clearSuccess: true));
  }
}
