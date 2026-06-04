import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/feedback/of_snackbar.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../../domain/entities/admin_user_entity.dart';
import '../../domain/entities/department_entity.dart';
import '../bloc/admin_departments_bloc.dart';

class AdminDepartmentsPage extends StatefulWidget {
  const AdminDepartmentsPage({super.key});

  @override
  State<AdminDepartmentsPage> createState() => _AdminDepartmentsPageState();
}

class _AdminDepartmentsPageState extends State<AdminDepartmentsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminDepartmentsBloc>().add(AdminDepartmentsRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AdminDepartmentsBloc, AdminDepartmentsState>(
      listenWhen: (previous, current) =>
          previous.errorMessage != current.errorMessage ||
          previous.successMessage != current.successMessage,
      listener: (context, state) {
        if (state.errorMessage != null) {
          OFSnackbar.show(
            context,
            message: state.errorMessage!,
            type: OFSnackbarType.error,
          );
          context.read<AdminDepartmentsBloc>().add(
            AdminDepartmentsMessageCleared(),
          );
        }
        if (state.successMessage != null) {
          OFSnackbar.show(
            context,
            message: state.successMessage!,
            type: OFSnackbarType.success,
          );
          context.read<AdminDepartmentsBloc>().add(
            AdminDepartmentsMessageCleared(),
          );
        }
      },
      child: Scaffold(
        appBar: const OFAppBar(title: 'Departamentos', showBackButton: true),
        body: BlocBuilder<AdminDepartmentsBloc, AdminDepartmentsState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const LoadingWidget(message: 'Cargando departamentos...');
            }
            if (state.departments.isEmpty) {
              return OFEmptyState(
                title: 'Sin departamentos',
                description:
                    state.errorMessage ??
                    'No hay departamentos disponibles para administrar.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: state.departments.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final department = state.departments[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          department.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(department.description ?? 'Sin descripcion'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: department.memberUserIds.isEmpty
                              ? [const Chip(label: Text('Sin miembros'))]
                              : department.memberUserIds
                                    .map(
                                      (userId) => InputChip(
                                        label: Text(
                                          _userNameFor(state.users, userId),
                                        ),
                                        onDeleted: () => context
                                            .read<AdminDepartmentsBloc>()
                                            .add(
                                              DepartmentMemberRemoved(
                                                departmentId: department.id,
                                                userId: userId,
                                              ),
                                            ),
                                      ),
                                    )
                                    .toList(),
                        ),
                        const SizedBox(height: 16),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: FilledButton.tonalIcon(
                            onPressed: () => _showUserPicker(
                              context,
                              department: department,
                              users: state.users,
                            ),
                            icon: const Icon(Icons.person_add_alt_1_outlined),
                            label: const Text('Asignar usuarios'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Future<void> _showUserPicker(
    BuildContext context, {
    required DepartmentEntity department,
    required List<AdminUserEntity> users,
  }) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        final available = users
            .where((user) => !department.memberUserIds.contains(user.id))
            .toList();

        if (available.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Text('No hay usuarios disponibles para asignar.'),
          );
        }

        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                'Asignar a ${department.name}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              ...available.map(
                (user) => ListTile(
                  leading: const CircleAvatar(
                    child: Icon(Icons.person_outline),
                  ),
                  title: Text(user.name),
                  subtitle: Text(user.email),
                  trailing: const Icon(Icons.add),
                  onTap: () {
                    Navigator.of(context).pop();
                    this.context.read<AdminDepartmentsBloc>().add(
                      DepartmentMemberAdded(
                        departmentId: department.id,
                        userId: user.id,
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _userNameFor(List<AdminUserEntity> users, String userId) {
    final match = users.where((user) => user.id == userId).firstOrNull;
    return match != null ? match.name : userId;
  }
}
