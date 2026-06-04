part of 'requests_bloc.dart';

sealed class RequestsEvent extends Equatable {
  const RequestsEvent();

  @override
  List<Object?> get props => [];
}

class RequestsOverviewRequested extends RequestsEvent {}

class PublishedWorkflowsRequested extends RequestsEvent {}

class ExecutionStarted extends RequestsEvent {
  const ExecutionStarted(this.workflowId);

  final String workflowId;

  @override
  List<Object?> get props => [workflowId];
}

class RequestsMessageCleared extends RequestsEvent {}
