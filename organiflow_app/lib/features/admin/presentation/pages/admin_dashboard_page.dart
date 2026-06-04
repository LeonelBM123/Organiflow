import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../notifications/presentation/bloc/notifications_bloc.dart';

class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final authenticated = authState is AuthAuthenticated ? authState : null;

    return Scaffold(
      appBar: OFAppBar(
        title: 'Panel Administrador',
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
            'Hola, ${authenticated?.user.name ?? 'Administrador'}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 12),
          Text('Tenant activo: ${authenticated?.tenantName ?? 'Sin tenant'}'),
          const SizedBox(height: 24),
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 720 ? 3 : 1,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.45,
            children: const [
              _StaticKpiCard(
                title: 'Workflows activos',
                value: '12',
                subtitle: 'Pendiente de conectar KPIs reales',
              ),
              _StaticKpiCard(
                title: 'Departamentos',
                value: '6',
                subtitle: 'Pendiente de conectar KPIs reales',
              ),
              _StaticKpiCard(
                title: 'Usuarios operativos',
                value: '28',
                subtitle: 'Pendiente de conectar KPIs reales',
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Este dashboard queda temporalmente estatico hasta integrar KPIs y analitica.',
          ),
          const SizedBox(height: 24),
          _AdminOptionCard(
            title: 'Workflows',
            description: 'Lista y administra workflows existentes.',
            icon: Icons.account_tree_outlined,
            onTap: () => context.push(AppRouter.adminWorkflows),
          ),
          const SizedBox(height: 12),
          _AdminOptionCard(
            title: 'Departamentos',
            description:
                'Asigna y remueve usuarios dentro de cada departamento.',
            icon: Icons.apartment_outlined,
            onTap: () => context.push(AppRouter.adminDepartments),
          ),
        ],
      ),
    );
  }
}

class _StaticKpiCard extends StatelessWidget {
  const _StaticKpiCard({
    required this.title,
    required this.value,
    required this.subtitle,
  });

  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Text(value, style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 8),
            Text(subtitle),
          ],
        ),
      ),
    );
  }
}

class _AdminOptionCard extends StatelessWidget {
  const _AdminOptionCard({
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
