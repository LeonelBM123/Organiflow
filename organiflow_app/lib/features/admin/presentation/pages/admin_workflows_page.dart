import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/buttons/of_button.dart';
import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/feedback/of_snackbar.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/admin_workflows_bloc.dart';

class AdminWorkflowsPage extends StatefulWidget {
  const AdminWorkflowsPage({super.key});

  @override
  State<AdminWorkflowsPage> createState() => _AdminWorkflowsPageState();
}

class _AdminWorkflowsPageState extends State<AdminWorkflowsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminWorkflowsBloc>().add(AdminWorkflowsRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AdminWorkflowsBloc, AdminWorkflowsState>(
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
          context.read<AdminWorkflowsBloc>().add(
            AdminWorkflowsMessageCleared(),
          );
        }
        if (state.successMessage != null) {
          OFSnackbar.show(
            context,
            message: state.successMessage!,
            type: OFSnackbarType.success,
          );
          context.read<AdminWorkflowsBloc>().add(
            AdminWorkflowsMessageCleared(),
          );
        }
      },
      child: Scaffold(
        appBar: const OFAppBar(title: 'Workflows', showBackButton: true),
        body: BlocBuilder<AdminWorkflowsBloc, AdminWorkflowsState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const LoadingWidget(message: 'Cargando workflows...');
            }
            if (state.workflows.isEmpty) {
              return OFEmptyState(
                title: 'Sin workflows',
                description:
                    state.errorMessage ??
                    'No hay workflows disponibles para administrar.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: state.workflows.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final workflow = state.workflows[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                workflow.name,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ),
                            Chip(label: Text(workflow.status)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(workflow.description ?? 'Sin descripcion'),
                        const SizedBox(height: 8),
                        Text(
                          'Version ${workflow.currentVersion} · ${workflow.totalNodes ?? 0} nodos · ${workflow.totalLanes ?? 0} lanes',
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            OFButton(
                              label: 'Publicar',
                              fullWidth: false,
                              isLoading: state.isSubmitting,
                              onPressed: workflow.status == 'PUBLISHED'
                                  ? null
                                  : () =>
                                        context.read<AdminWorkflowsBloc>().add(
                                          AdminWorkflowPublished(workflow.id),
                                        ),
                            ),
                            OFButton(
                              label: 'Pasar a borrador',
                              fullWidth: false,
                              variant: OFButtonVariant.outline,
                              onPressed: workflow.status == 'DRAFT'
                                  ? null
                                  : () =>
                                        context.read<AdminWorkflowsBloc>().add(
                                          AdminWorkflowReverted(workflow.id),
                                        ),
                            ),
                            OFButton(
                              label: 'Archivar',
                              fullWidth: false,
                              variant: OFButtonVariant.destructive,
                              onPressed: workflow.status == 'ARCHIVED'
                                  ? null
                                  : () =>
                                        context.read<AdminWorkflowsBloc>().add(
                                          AdminWorkflowArchived(workflow.id),
                                        ),
                            ),
                          ],
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
}
