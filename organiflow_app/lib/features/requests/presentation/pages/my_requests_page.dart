import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../design/components/feedback/of_empty_state.dart';
import '../../../../design/components/layout/of_app_bar.dart';
import '../../../auth/presentation/widgets/loading_widget.dart';
import '../bloc/requests_bloc.dart';
import '../widgets/execution_summary_card.dart';

class MyRequestsPage extends StatefulWidget {
  const MyRequestsPage({super.key});

  @override
  State<MyRequestsPage> createState() => _MyRequestsPageState();
}

class _MyRequestsPageState extends State<MyRequestsPage> {
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
      appBar: const OFAppBar(title: 'Mis Solicitudes', showBackButton: true),
      body: BlocBuilder<RequestsBloc, RequestsState>(
        builder: (context, state) {
          if (state.isLoadingOverview) {
            return const LoadingWidget(message: 'Cargando solicitudes...');
          }
          if (state.errorMessage != null && state.myRequests.isEmpty) {
            return OFEmptyState(
              title: 'No se pudieron cargar',
              description: state.errorMessage,
            );
          }
          if (state.myRequests.isEmpty) {
            return const OFEmptyState(
              title: 'Sin solicitudes activas',
              description: 'Las ejecuciones en curso apareceran aqui.',
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(24),
            itemCount: state.myRequests.length,
            separatorBuilder: (_, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return ExecutionSummaryCard(execution: state.myRequests[index]);
            },
          );
        },
      ),
    );
  }
}
