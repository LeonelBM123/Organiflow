part of 'admin_departments_bloc.dart';

sealed class AdminDepartmentsEvent extends Equatable {
  const AdminDepartmentsEvent();

  @override
  List<Object?> get props => [];
}

class AdminDepartmentsRequested extends AdminDepartmentsEvent {}

class DepartmentMemberAdded extends AdminDepartmentsEvent {
  const DepartmentMemberAdded({
    required this.departmentId,
    required this.userId,
  });

  final String departmentId;
  final String userId;

  @override
  List<Object?> get props => [departmentId, userId];
}

class DepartmentMemberRemoved extends AdminDepartmentsEvent {
  const DepartmentMemberRemoved({
    required this.departmentId,
    required this.userId,
  });

  final String departmentId;
  final String userId;

  @override
  List<Object?> get props => [departmentId, userId];
}

class AdminDepartmentsMessageCleared extends AdminDepartmentsEvent {}
