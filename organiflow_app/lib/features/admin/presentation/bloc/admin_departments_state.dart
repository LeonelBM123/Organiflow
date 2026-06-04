part of 'admin_departments_bloc.dart';

class AdminDepartmentsState extends Equatable {
  const AdminDepartmentsState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.departments = const [],
    this.users = const [],
    this.errorMessage,
    this.successMessage,
  });

  final bool isLoading;
  final bool isSubmitting;
  final List<DepartmentEntity> departments;
  final List<AdminUserEntity> users;
  final String? errorMessage;
  final String? successMessage;

  AdminDepartmentsState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<DepartmentEntity>? departments,
    List<AdminUserEntity>? users,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return AdminDepartmentsState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      departments: departments ?? this.departments,
      users: users ?? this.users,
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
    departments,
    users,
    errorMessage,
    successMessage,
  ];
}
