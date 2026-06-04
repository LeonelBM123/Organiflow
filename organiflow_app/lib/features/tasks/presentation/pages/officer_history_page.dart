import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/tasks_bloc.dart';
import '../widgets/task_summary_card.dart';

class OfficerHistoryPage extends StatefulWidget {
  const OfficerHistoryPage({super.key});

  @override
  State<OfficerHistoryPage> createState() => _OfficerHistoryPageState();
}

class _OfficerHistoryPageState extends State<OfficerHistoryPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TasksBloc>().add(TasksRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const OFAppBar(
        title: 'Historial de Tareas',
        showBackButton: true,
      ),
      body: BlocBuilder<TasksBloc, TasksState>(
        builder: (context, state) {
          if (state.isLoading) {
            return const LoadingWidget(message: 'Cargando historial...');
          }

          final tasks = state.historicalTasks;
          if (tasks.isEmpty) {
            return OFEmptyState(
              title: 'Sin historial',
              description:
                  state.errorMessage ??
                  'Las tareas resueltas, omitidas o escaladas apareceran aqui.',
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(24),
            itemCount: tasks.length,
            separatorBuilder: (_, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return TaskSummaryCard(task: tasks[index], isSubmitting: false);
            },
          );
        },
      ),
    );
  }
}
