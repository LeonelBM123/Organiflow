part of 'admin_workflows_bloc.dart';

sealed class AdminWorkflowsEvent extends Equatable {
  const AdminWorkflowsEvent();

  @override
  List<Object?> get props => [];
}

class AdminWorkflowsRequested extends AdminWorkflowsEvent {}

class AdminWorkflowPublished extends AdminWorkflowsEvent {
  const AdminWorkflowPublished(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class AdminWorkflowArchived extends AdminWorkflowsEvent {
  const AdminWorkflowArchived(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class AdminWorkflowReverted extends AdminWorkflowsEvent {
  const AdminWorkflowReverted(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class AdminWorkflowsMessageCleared extends AdminWorkflowsEvent {}
