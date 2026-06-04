import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app.dart';
import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/feedback/of_snackbar.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/tasks_bloc.dart';
import '../widgets/task_summary_card.dart';

class PendingFormsPage extends StatefulWidget {
  const PendingFormsPage({super.key, this.title = 'Formularios Pendientes'});

  final String title;

  @override
  State<PendingFormsPage> createState() => _PendingFormsPageState();
}

class _PendingFormsPageState extends State<PendingFormsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TasksBloc>().add(TasksRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<TasksBloc, TasksState>(
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
          context.read<TasksBloc>().add(TasksMessageCleared());
        }
        if (state.successMessage != null) {
          OFSnackbar.show(
            context,
            message: state.successMessage!,
            type: OFSnackbarType.success,
          );
          context.read<TasksBloc>().add(TasksMessageCleared());
        }
      },
      child: Scaffold(
        appBar: OFAppBar(title: widget.title, showBackButton: true),
        body: BlocBuilder<TasksBloc, TasksState>(
          builder: (context, state) {
            if (state.isLoading) {
              return const LoadingWidget(message: 'Cargando tareas...');
            }
            final tasks = state.pendingTasks;
            if (tasks.isEmpty) {
              return OFEmptyState(
                title: 'Sin tareas pendientes',
                description:
                    state.errorMessage ??
                    'Cuando tengas formularios asignados apareceran aqui.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: tasks.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final task = tasks[index];
                return TaskSummaryCard(
                  task: task,
                  isSubmitting: state.isSubmitting,
                  onStart: () =>
                      context.read<TasksBloc>().add(TaskStarted(task.id)),
                  onEscalate: () =>
                      context.read<TasksBloc>().add(TaskEscalated(task.id)),
                  onOpen: () =>
                      context.push('${AppRouter.taskForm}?taskId=${task.id}'),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
