import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/admin_user_entity.dart';
import '../../domain/entities/department_entity.dart';
import '../../domain/usecases/add_department_member_usecase.dart';
import '../../domain/usecases/get_admin_users_usecase.dart';
import '../../domain/usecases/get_departments_usecase.dart';
import '../../domain/usecases/remove_department_member_usecase.dart';

part 'admin_departments_event.dart';
part 'admin_departments_state.dart';

class AdminDepartmentsBloc
    extends Bloc<AdminDepartmentsEvent, AdminDepartmentsState> {
  AdminDepartmentsBloc({
    required GetDepartmentsUseCase getDepartmentsUseCase,
    required GetAdminUsersUseCase getAdminUsersUseCase,
    required AddDepartmentMemberUseCase addDepartmentMemberUseCase,
    required RemoveDepartmentMemberUseCase removeDepartmentMemberUseCase,
  }) : _getDepartmentsUseCase = getDepartmentsUseCase,
       _getAdminUsersUseCase = getAdminUsersUseCase,
       _addDepartmentMemberUseCase = addDepartmentMemberUseCase,
       _removeDepartmentMemberUseCase = removeDepartmentMemberUseCase,
       super(const AdminDepartmentsState()) {
    on<AdminDepartmentsRequested>(_onRequested);
    on<DepartmentMemberAdded>(_onMemberAdded);
    on<DepartmentMemberRemoved>(_onMemberRemoved);
    on<AdminDepartmentsMessageCleared>(_onMessageCleared);
  }

  final GetDepartmentsUseCase _getDepartmentsUseCase;
  final GetAdminUsersUseCase _getAdminUsersUseCase;
  final AddDepartmentMemberUseCase _addDepartmentMemberUseCase;
  final RemoveDepartmentMemberUseCase _removeDepartmentMemberUseCase;

  Future<void> _onRequested(
    AdminDepartmentsRequested event,
    Emitter<AdminDepartmentsState> emit,
  ) async {
    emit(state.copyWith(isLoading: true, clearError: true, clearSuccess: true));
    final departmentsResult = await _getDepartmentsUseCase();
    final usersResult = await _getAdminUsersUseCase();

    if (departmentsResult.isLeft()) {
      emit(
        state.copyWith(
          isLoading: false,
          errorMessage: departmentsResult
              .swap()
              .getOrElse(() => throw StateError(''))
              .message,
        ),
      );
      return;
    }

    if (usersResult.isLeft()) {
      emit(
        state.copyWith(
          isLoading: false,
          errorMessage: usersResult
              .swap()
              .getOrElse(() => throw StateError(''))
              .message,
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        isLoading: false,
        departments: departmentsResult.getOrElse(() => const []),
        users: usersResult.getOrElse(() => const []),
        clearError: true,
      ),
    );
  }

  Future<void> _onMemberAdded(
    DepartmentMemberAdded event,
    Emitter<AdminDepartmentsState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _addDepartmentMemberUseCase(
      event.departmentId,
      event.userId,
    );
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (department) {
        final updated = state.departments
            .map((item) => item.id == department.id ? department : item)
            .toList();
        emit(
          state.copyWith(
            isSubmitting: false,
            departments: updated,
            successMessage: 'Usuario agregado al departamento',
          ),
        );
      },
    );
  }

  Future<void> _onMemberRemoved(
    DepartmentMemberRemoved event,
    Emitter<AdminDepartmentsState> emit,
  ) async {
    emit(
      state.copyWith(isSubmitting: true, clearError: true, clearSuccess: true),
    );
    final result = await _removeDepartmentMemberUseCase(
      event.departmentId,
      event.userId,
    );
    result.fold(
      (failure) => emit(
        state.copyWith(isSubmitting: false, errorMessage: failure.message),
      ),
      (department) {
        final updated = state.departments
            .map((item) => item.id == department.id ? department : item)
            .toList();
        emit(
          state.copyWith(
            isSubmitting: false,
            departments: updated,
            successMessage: 'Usuario removido del departamento',
          ),
        );
      },
    );
  }

  void _onMessageCleared(
    AdminDepartmentsMessageCleared event,
    Emitter<AdminDepartmentsState> emit,
  ) {
    emit(state.copyWith(clearError: true, clearSuccess: true));
  }
}
