import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/requests_bloc.dart';
import '../widgets/execution_summary_card.dart';

class ExecutionHistoryPage extends StatefulWidget {
  const ExecutionHistoryPage({super.key});

  @override
  State<ExecutionHistoryPage> createState() => _ExecutionHistoryPageState();
}

class _ExecutionHistoryPageState extends State<ExecutionHistoryPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RequestsBloc>().add(RequestsOverviewRequested());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const OFAppBar(title: 'Historial', showBackButton: true),
      body: BlocBuilder<RequestsBloc, RequestsState>(
        builder: (context, state) {
          if (state.isLoadingOverview) {
            return const LoadingWidget(message: 'Cargando historial...');
          }
          if (state.history.isEmpty) {
            return OFEmptyState(
              title: 'Sin historial',
              description:
                  state.errorMessage ??
                  'Las ejecuciones completadas o cerradas apareceran aqui.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(24),
            itemCount: state.history.length,
            separatorBuilder: (_, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return ExecutionSummaryCard(execution: state.history[index]);
            },
          );
        },
      ),
    );
  }
}
