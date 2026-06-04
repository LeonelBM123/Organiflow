part of 'admin_workflows_bloc.dart';

class AdminWorkflowsState extends Equatable {
  const AdminWorkflowsState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.workflows = const [],
    this.errorMessage,
    this.successMessage,
  });

  final bool isLoading;
  final bool isSubmitting;
  final List<WorkflowSummaryEntity> workflows;
  final String? errorMessage;
  final String? successMessage;

  AdminWorkflowsState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<WorkflowSummaryEntity>? workflows,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return AdminWorkflowsState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      workflows: workflows ?? this.workflows,
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
    workflows,
    errorMessage,
    successMessage,
  ];
}
