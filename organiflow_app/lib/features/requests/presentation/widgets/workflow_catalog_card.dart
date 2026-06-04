import 'package:flutter/material.dart';

import '../../../../design/components/buttons/of_button.dart';
import '../../domain/entities/workflow_summary_entity.dart';

class WorkflowCatalogCard extends StatelessWidget {
  const WorkflowCatalogCard({
    super.key,
    required this.workflow,
    required this.isStarting,
    this.onStart,
  });

  final WorkflowSummaryEntity workflow;
  final bool isStarting;
  final VoidCallback? onStart;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(workflow.name, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(workflow.description ?? 'Sin descripcion'),
            const SizedBox(height: 12),
            Text(
              'Version ${workflow.currentVersion} · ${workflow.totalNodes ?? 0} nodos',
            ),
            const SizedBox(height: 16),
            OFButton(
              label: 'Iniciar solicitud',
              isLoading: isStarting,
              onPressed: onStart,
            ),
          ],
        ),
      ),
    );
  }
}
