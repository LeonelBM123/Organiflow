import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../notifications/presentation/bloc/notifications_bloc.dart';
import '../bloc/tasks_bloc.dart';

class OfficerDashboardPage extends StatefulWidget {
  const OfficerDashboardPage({super.key});

  @override
  State<OfficerDashboardPage> createState() => _OfficerDashboardPageState();
}

class _OfficerDashboardPageState extends State<OfficerDashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TasksBloc>().add(TasksRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final authenticated = authState is AuthAuthenticated ? authState : null;

    return Scaffold(
      appBar: OFAppBar(
        title: 'Panel Funcionario',
        actions: [
          IconButton(
            onPressed: () {
              context.read<NotificationsBloc>().add(NotificationsRequested());
              context.push(AppRouter.notifications);
            },
            icon: const Icon(Icons.notifications_outlined),
          ),
          IconButton(
            onPressed: () {
              context.read<AuthBloc>().add(AuthLogoutRequested());
              context.go(AppRouter.login);
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: BlocBuilder<TasksBloc, TasksState>(
        builder: (context, state) {
          final pending = state.pendingTasks;
          final history = state.historicalTasks;
          final inProgress = state.tasks
              .where((task) => task.status == 'IN_PROGRESS')
              .length;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                'Hola, ${authenticated?.user.name ?? 'Funcionario'}',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              Text(
                'Tenant activo: ${authenticated?.tenantName ?? 'Sin tenant'}',
              ),
              const SizedBox(height: 24),
              GridView.count(
                crossAxisCount: MediaQuery.of(context).size.width > 720 ? 3 : 1,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.4,
                children: [
                  _SummaryCard(
                    title: 'Pendientes',
                    value: pending.length.toString(),
                    subtitle: 'Tasks por iniciar o completar',
                    icon: Icons.assignment_late_outlined,
                  ),
                  _SummaryCard(
                    title: 'En curso',
                    value: inProgress.toString(),
                    subtitle: 'Tasks actualmente trabajadas',
                    icon: Icons.play_circle_outline,
                  ),
                  _SummaryCard(
                    title: 'Historial',
                    value: history.length.toString(),
                    subtitle: 'Tasks ya resueltas o escaladas',
                    icon: Icons.history_outlined,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'Accesos rapidos',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              _OfficerOptionCard(
                title: 'Tareas Pendientes',
                description: 'Revisa, inicia y completa formularios asignados.',
                icon: Icons.fact_check_outlined,
                onTap: () => context.push(AppRouter.pendingForms),
              ),
              const SizedBox(height: 12),
              _OfficerOptionCard(
                title: 'Historial',
                description:
                    'Consulta tasks completadas, omitidas o escaladas.',
                icon: Icons.inventory_2_outlined,
                onTap: () => context.push(AppRouter.officerHistory),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 6),
            Text(subtitle),
          ],
        ),
      ),
    );
  }
}

class _OfficerOptionCard extends StatelessWidget {
  const _OfficerOptionCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              CircleAvatar(radius: 24, child: Icon(icon)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(description),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
