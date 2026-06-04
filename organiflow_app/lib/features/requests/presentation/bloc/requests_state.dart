part of 'requests_bloc.dart';

class RequestsState extends Equatable {
  const RequestsState({
    this.isLoadingOverview = false,
    this.isLoadingCatalog = false,
    this.isStarting = false,
    this.myRequests = const [],
    this.history = const [],
    this.publishedWorkflows = const [],
    this.errorMessage,
    this.successMessage,
  });

  final bool isLoadingOverview;
  final bool isLoadingCatalog;
  final bool isStarting;
  final List<ExecutionSummaryEntity> myRequests;
  final List<ExecutionSummaryEntity> history;
  final List<WorkflowSummaryEntity> publishedWorkflows;
  final String? errorMessage;
  final String? successMessage;

  RequestsState copyWith({
    bool? isLoadingOverview,
    bool? isLoadingCatalog,
    bool? isStarting,
    List<ExecutionSummaryEntity>? myRequests,
    List<ExecutionSummaryEntity>? history,
    List<WorkflowSummaryEntity>? publishedWorkflows,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return RequestsState(
      isLoadingOverview: isLoadingOverview ?? this.isLoadingOverview,
      isLoadingCatalog: isLoadingCatalog ?? this.isLoadingCatalog,
      isStarting: isStarting ?? this.isStarting,
      myRequests: myRequests ?? this.myRequests,
      history: history ?? this.history,
      publishedWorkflows: publishedWorkflows ?? this.publishedWorkflows,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      successMessage: clearSuccess
          ? null
          : successMessage ?? this.successMessage,
    );
  }

  @override
  List<Object?> get props => [
    isLoadingOverview,
    isLoadingCatalog,
    isStarting,
    myRequests,
    history,
    publishedWorkflows,
    errorMessage,
    successMessage,
  ];
}
