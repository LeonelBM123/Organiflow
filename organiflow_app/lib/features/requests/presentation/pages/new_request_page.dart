import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/feedback/of_snackbar.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/requests_bloc.dart';
import '../widgets/workflow_catalog_card.dart';

class NewRequestPage extends StatefulWidget {
  const NewRequestPage({super.key});

  @override
  State<NewRequestPage> createState() => _NewRequestPageState();
}

class _NewRequestPageState extends State<NewRequestPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RequestsBloc>().add(PublishedWorkflowsRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<RequestsBloc, RequestsState>(
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
          context.read<RequestsBloc>().add(RequestsMessageCleared());
        }
        if (state.successMessage != null) {
          OFSnackbar.show(
            context,
            message: state.successMessage!,
            type: OFSnackbarType.success,
          );
          context.read<RequestsBloc>().add(RequestsMessageCleared());
        }
      },
      child: Scaffold(
        appBar: const OFAppBar(title: 'Nueva Solicitud', showBackButton: true),
        body: BlocBuilder<RequestsBloc, RequestsState>(
          builder: (context, state) {
            if (state.isLoadingCatalog) {
              return const LoadingWidget(message: 'Cargando workflows...');
            }
            if (state.publishedWorkflows.isEmpty) {
              return OFEmptyState(
                title: 'No hay workflows publicados',
                description:
                    state.errorMessage ??
                    'Cuando haya procesos disponibles podras iniciarlos desde aqui.',
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: state.publishedWorkflows.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final workflow = state.publishedWorkflows[index];
                return WorkflowCatalogCard(
                  workflow: workflow,
                  isStarting: state.isStarting,
                  onStart: () => context.read<RequestsBloc>().add(
                    ExecutionStarted(workflow.id),
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
