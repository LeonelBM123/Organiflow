import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../admin/presentation/pages/admin_dashboard_page.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../tasks/presentation/pages/officer_dashboard_page.dart';
import '../bloc/notifications_bloc.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final authenticated = authState is AuthAuthenticated ? authState : null;
    final normalizedRole = authenticated?.role.toLowerCase() ?? '';

    if (normalizedRole == 'officer') {
      return const OfficerDashboardPage();
    }
    if (normalizedRole == 'admin') {
      return const AdminDashboardPage();
    }

    return Scaffold(
      appBar: OFAppBar(
        title: 'Panel',
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
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Hola, ${authenticated?.user.name ?? 'Usuario'}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 12),
          Text('Tenant activo: ${authenticated?.tenantName ?? 'Sin tenant'}'),
          const SizedBox(height: 4),
          Text('Rol: ${authenticated?.role ?? '-'}'),
          const SizedBox(height: 24),
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 720 ? 2 : 1,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.8,
            children: [
              _HomeOptionCard(
                title: 'Mis Solicitudes',
                description: 'Consulta las ejecuciones activas y su estado.',
                icon: Icons.assignment_outlined,
                onTap: () => context.push(AppRouter.myRequests),
              ),
              _HomeOptionCard(
                title: 'Nueva Solicitud',
                description:
                    'Inicia una nueva execution desde workflows publicados.',
                icon: Icons.add_circle_outline,
                onTap: () => context.push(AppRouter.newRequest),
              ),
              _HomeOptionCard(
                title: 'Formularios Pendientes',
                description:
                    'Administra tasks asignadas y completa formularios.',
                icon: Icons.fact_check_outlined,
                onTap: () => context.push(AppRouter.pendingForms),
              ),
              _HomeOptionCard(
                title: 'Historial',
                description: 'Revisa ejecuciones finalizadas o canceladas.',
                icon: Icons.history_outlined,
                onTap: () => context.push(AppRouter.executionHistory),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HomeOptionCard extends StatelessWidget {
  const _HomeOptionCard({
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
                  mainAxisAlignment: MainAxisAlignment.center,
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
