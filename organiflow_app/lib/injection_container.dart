import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/network/api_client.dart';
import 'core/network/interceptors/auth_interceptor.dart';
import 'core/network/interceptors/error_interceptor.dart';
import 'features/admin/data/datasources/admin_remote_datasource.dart';
import 'features/admin/data/repositories/admin_repository_impl.dart';
import 'features/admin/domain/repositories/admin_repository.dart';
import 'features/admin/domain/usecases/add_department_member_usecase.dart';
import 'features/admin/domain/usecases/archive_workflow_usecase.dart';
import 'features/admin/domain/usecases/get_admin_users_usecase.dart';
import 'features/admin/domain/usecases/get_admin_workflows_usecase.dart';
import 'features/admin/domain/usecases/get_departments_usecase.dart';
import 'features/admin/domain/usecases/publish_workflow_usecase.dart';
import 'features/admin/domain/usecases/remove_department_member_usecase.dart';
import 'features/admin/domain/usecases/revert_workflow_to_draft_usecase.dart';
import 'features/admin/presentation/bloc/admin_departments_bloc.dart';
import 'features/admin/presentation/bloc/admin_workflows_bloc.dart';
import 'features/auth/data/datasources/auth_local_datasource.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/get_current_user_usecase.dart';
import 'features/auth/domain/usecases/login_usecase.dart';
import 'features/auth/domain/usecases/logout_usecase.dart';
import 'features/auth/domain/usecases/refresh_token_usecase.dart';
import 'features/auth/domain/usecases/select_tenant_usecase.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/notifications/data/datasources/notifications_local_datasource.dart';
import 'features/notifications/data/datasources/notifications_remote_datasource.dart';
import 'features/notifications/data/repositories/notifications_repository_impl.dart';
import 'features/notifications/domain/repositories/notifications_repository.dart';
import 'features/notifications/domain/usecases/get_notifications_usecase.dart';
import 'features/notifications/domain/usecases/mark_notification_read_usecase.dart';
import 'features/notifications/domain/usecases/send_push_token_usecase.dart';
import 'features/notifications/presentation/bloc/notifications_bloc.dart';
import 'features/requests/data/datasources/requests_remote_datasource.dart';
import 'features/requests/data/repositories/requests_repository_impl.dart';
import 'features/requests/domain/repositories/requests_repository.dart';
import 'features/requests/domain/usecases/get_my_executions_usecase.dart';
import 'features/requests/domain/usecases/get_published_workflows_usecase.dart';
import 'features/requests/domain/usecases/start_execution_usecase.dart';
import 'features/requests/presentation/bloc/requests_bloc.dart';
import 'features/tasks/data/datasources/tasks_remote_datasource.dart';
import 'features/tasks/data/repositories/tasks_repository_impl.dart';
import 'features/tasks/domain/repositories/tasks_repository.dart';
import 'features/tasks/domain/usecases/complete_task_usecase.dart';
import 'features/tasks/domain/usecases/escalate_task_usecase.dart';
import 'features/tasks/domain/usecases/get_my_tasks_usecase.dart';
import 'features/tasks/domain/usecases/start_task_usecase.dart';
import 'features/tasks/presentation/bloc/tasks_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  final sharedPreferences = await SharedPreferences.getInstance();
  const secureStorage = FlutterSecureStorage();
  final dio = Dio();

  sl
    ..registerLazySingleton(() => sharedPreferences)
    ..registerLazySingleton(() => secureStorage)
    ..registerLazySingleton(() => dio);

  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(secureStorage: sl(), sharedPreferences: sl()),
  );
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl(), localDataSource: sl()),
  );

  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => SelectTenantUseCase(sl()));
  sl.registerLazySingleton(() => RefreshTokenUseCase(sl()));
  sl.registerLazySingleton(() => LogoutUseCase(sl()));
  sl.registerLazySingleton(() => GetCurrentUserUseCase(sl()));
  sl.registerFactory(
    () => AuthBloc(
      loginUseCase: sl(),
      selectTenantUseCase: sl(),
      refreshTokenUseCase: sl(),
      logoutUseCase: sl(),
      getCurrentUserUseCase: sl(),
      sendPushTokenUseCase: sl(),
    ),
  );

  sl.registerLazySingleton<NotificationsLocalDataSource>(
    () => NotificationsLocalDataSourceImpl(sharedPreferences: sl()),
  );
  sl.registerLazySingleton<NotificationsRemoteDataSource>(
    () => NotificationsRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<NotificationsRepository>(
    () => NotificationsRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
    ),
  );
  sl.registerLazySingleton(() => GetNotificationsUseCase(sl()));
  sl.registerLazySingleton(() => MarkNotificationReadUseCase(sl()));
  sl.registerLazySingleton(() => SendPushTokenUseCase(sl()));
  sl.registerFactory(
    () => NotificationsBloc(
      getNotificationsUseCase: sl(),
      markNotificationReadUseCase: sl(),
      sendPushTokenUseCase: sl(),
    ),
  );

  sl.registerLazySingleton<RequestsRemoteDataSource>(
    () => RequestsRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<RequestsRepository>(
    () => RequestsRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton(() => GetMyExecutionsUseCase(sl()));
  sl.registerLazySingleton(() => GetPublishedWorkflowsUseCase(sl()));
  sl.registerLazySingleton(() => StartExecutionUseCase(sl()));
  sl.registerFactory(
    () => RequestsBloc(
      getMyExecutionsUseCase: sl(),
      getPublishedWorkflowsUseCase: sl(),
      startExecutionUseCase: sl(),
    ),
  );

  sl.registerLazySingleton<TasksRemoteDataSource>(
    () => TasksRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<TasksRepository>(
    () => TasksRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton(() => GetMyTasksUseCase(sl()));
  sl.registerLazySingleton(() => StartTaskUseCase(sl()));
  sl.registerLazySingleton(() => CompleteTaskUseCase(sl()));
  sl.registerLazySingleton(() => EscalateTaskUseCase(sl()));
  sl.registerFactory(
    () => TasksBloc(
      getMyTasksUseCase: sl(),
      startTaskUseCase: sl(),
      completeTaskUseCase: sl(),
      escalateTaskUseCase: sl(),
    ),
  );

  sl.registerLazySingleton<AdminRemoteDataSource>(
    () => AdminRemoteDataSourceImpl(apiClient: sl()),
  );
  sl.registerLazySingleton<AdminRepository>(
    () => AdminRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton(() => GetAdminWorkflowsUseCase(sl()));
  sl.registerLazySingleton(() => PublishWorkflowUseCase(sl()));
  sl.registerLazySingleton(() => ArchiveWorkflowUseCase(sl()));
  sl.registerLazySingleton(() => RevertWorkflowToDraftUseCase(sl()));
  sl.registerFactory(
    () => AdminWorkflowsBloc(
      getAdminWorkflowsUseCase: sl(),
      publishWorkflowUseCase: sl(),
      archiveWorkflowUseCase: sl(),
      revertWorkflowToDraftUseCase: sl(),
    ),
  );
  sl.registerLazySingleton(() => GetDepartmentsUseCase(sl()));
  sl.registerLazySingleton(() => GetAdminUsersUseCase(sl()));
  sl.registerLazySingleton(() => AddDepartmentMemberUseCase(sl()));
  sl.registerLazySingleton(() => RemoveDepartmentMemberUseCase(sl()));
  sl.registerFactory(
    () => AdminDepartmentsBloc(
      getDepartmentsUseCase: sl(),
      getAdminUsersUseCase: sl(),
      addDepartmentMemberUseCase: sl(),
      removeDepartmentMemberUseCase: sl(),
    ),
  );

  sl.registerLazySingleton(
    () => ApiClient(
      dio: sl(),
      interceptors: [
        AuthInterceptor(localDataSource: sl()),
        ErrorInterceptor(),
      ],
    ),
  );
}
