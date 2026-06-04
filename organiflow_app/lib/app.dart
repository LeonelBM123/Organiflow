import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'core/services/notification_bootstrap_service.dart';
import 'design/theme/app_theme.dart';
import 'features/admin/presentation/bloc/admin_departments_bloc.dart';
import 'features/admin/presentation/bloc/admin_workflows_bloc.dart';
import 'features/admin/presentation/pages/admin_departments_page.dart';
import 'features/admin/presentation/pages/admin_workflows_page.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/tenant_selection_page.dart';
import 'features/notifications/presentation/bloc/notifications_bloc.dart';
import 'features/notifications/presentation/pages/notifications_page.dart';
import 'features/notifications/presentation/pages/home_page.dart';
import 'features/requests/presentation/bloc/requests_bloc.dart';
import 'features/requests/presentation/pages/execution_history_page.dart';
import 'features/requests/presentation/pages/my_requests_page.dart';
import 'features/requests/presentation/pages/new_request_page.dart';
import 'features/tasks/presentation/bloc/tasks_bloc.dart';
import 'features/tasks/presentation/pages/officer_history_page.dart';
import 'features/tasks/presentation/pages/pending_forms_page.dart';
import 'features/tasks/presentation/pages/task_form_page.dart';
import 'injection_container.dart';

class AppRouter {
  static const login = '/login';
  static const tenantSelection = '/tenant-selection';
  static const home = '/home';
  static const notifications = '/notifications';
  static const myRequests = '/my-requests';
  static const newRequest = '/new-request';
  static const pendingForms = '/pending-forms';
  static const executionHistory = '/execution-history';
  static const taskForm = '/task-form';
  static const officerHistory = '/officer-history';
  static const adminWorkflows = '/admin-workflows';
  static const adminDepartments = '/admin-departments';
}

class OrganiflowApp extends StatefulWidget {
  const OrganiflowApp({super.key});

  @override
  State<OrganiflowApp> createState() => _OrganiflowAppState();
}

class _OrganiflowAppState extends State<OrganiflowApp> {
  late final GoRouter _router;
  StreamSubscription<Map<String, dynamic>>? _tapSubscription;

  @override
  void initState() {
    super.initState();
    _router = _buildRouter();
    _tapSubscription = NotificationBootstrapService.tapEvents.listen(_openRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pending = NotificationBootstrapService.consumePendingTapPayload();
      if (pending != null) {
        _openRoute(pending);
      }
    });
  }

  @override
  void dispose() {
    _tapSubscription?.cancel();
    super.dispose();
  }

  GoRouter _buildRouter() {
    final authBloc = sl<AuthBloc>();
    final notificationsBloc = sl<NotificationsBloc>();
    final requestsBloc = sl<RequestsBloc>();
    final tasksBloc = sl<TasksBloc>();
    final adminWorkflowsBloc = sl<AdminWorkflowsBloc>();
    final adminDepartmentsBloc = sl<AdminDepartmentsBloc>();

    MultiBlocProvider shell(Widget child) {
      return MultiBlocProvider(
        providers: [
          BlocProvider.value(value: authBloc),
          BlocProvider.value(value: notificationsBloc),
          BlocProvider.value(value: requestsBloc),
          BlocProvider.value(value: tasksBloc),
          BlocProvider.value(value: adminWorkflowsBloc),
          BlocProvider.value(value: adminDepartmentsBloc),
        ],
        child: child,
      );
    }

    return GoRouter(
      initialLocation: AppRouter.login,
      routes: [
        GoRoute(
          path: AppRouter.login,
          builder: (context, state) =>
              BlocProvider.value(value: authBloc, child: const LoginPage()),
        ),
        GoRoute(
          path: AppRouter.tenantSelection,
          builder: (context, state) => shell(const TenantSelectionPage()),
        ),
        GoRoute(
          path: AppRouter.home,
          builder: (context, state) => shell(const HomePage()),
        ),
        GoRoute(
          path: AppRouter.notifications,
          builder: (context, state) => shell(const NotificationsPage()),
        ),
        GoRoute(
          path: AppRouter.myRequests,
          builder: (context, state) => shell(const MyRequestsPage()),
        ),
        GoRoute(
          path: AppRouter.newRequest,
          builder: (context, state) => shell(const NewRequestPage()),
        ),
        GoRoute(
          path: AppRouter.pendingForms,
          builder: (context, state) => shell(const PendingFormsPage()),
        ),
        GoRoute(
          path: AppRouter.executionHistory,
          builder: (context, state) => shell(const ExecutionHistoryPage()),
        ),
        GoRoute(
          path: AppRouter.officerHistory,
          builder: (context, state) => shell(const OfficerHistoryPage()),
        ),
        GoRoute(
          path: AppRouter.adminWorkflows,
          builder: (context, state) => shell(const AdminWorkflowsPage()),
        ),
        GoRoute(
          path: AppRouter.adminDepartments,
          builder: (context, state) => shell(const AdminDepartmentsPage()),
        ),
        GoRoute(
          path: AppRouter.taskForm,
          builder: (context, state) {
            final taskId = state.uri.queryParameters['taskId'] ?? '';
            return shell(TaskFormPage(taskId: taskId));
          },
        ),
      ],
    );
  }

  void _openRoute(Map<String, dynamic> payload) {
    final route = _resolveRoute(payload);
    if (route != null && mounted) {
      _router.go(route);
    }
  }

  String? _resolveRoute(Map<String, dynamic> payload) {
    final explicitRoute = payload['route'] as String?;
    if (explicitRoute != null && explicitRoute.isNotEmpty) {
      return explicitRoute;
    }

    final entityType = payload['entityType'] as String?;
    final entityId = payload['entityId'] as String?;

    switch (entityType) {
      case 'task':
        return entityId == null || entityId.isEmpty
            ? AppRouter.notifications
            : '${AppRouter.taskForm}?taskId=$entityId';
      case 'execution':
        return AppRouter.executionHistory;
      case 'workflow':
        return AppRouter.adminWorkflows;
      default:
        return AppRouter.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Organiflow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: _router,
    );
  }
}
