import 'package:flutter/material.dart';

import '../../../../core/utils/date_utils.dart';
import '../../../../design/theme/app_colors.dart';
import '../../domain/entities/execution_summary_entity.dart';

class ExecutionSummaryCard extends StatelessWidget {
  const ExecutionSummaryCard({super.key, required this.execution});

  final ExecutionSummaryEntity execution;

  @override
  Widget build(BuildContext context) {
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
                    execution.workflowName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _StatusChip(status: execution.status),
              ],
            ),
            const SizedBox(height: 8),
            Text('ID de solicitud: ${execution.id}'),
            const SizedBox(height: 4),
            Text('Version: ${execution.workflowVersion}'),
            if (execution.currentNodeIds.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('Nodos actuales: ${execution.currentNodeIds.join(', ')}'),
            ],
            if (execution.startedAt != null) ...[
              const SizedBox(height: 4),
              Text('Inicio: ${OFDateUtils.relative(execution.startedAt!)}'),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'RUNNING' => AppColors.statusRunning,
      'PAUSED' => AppColors.warningToast,
      'COMPLETED' => AppColors.statusCompleted,
      'FAILED' => AppColors.statusRejected,
      'CANCELED' => AppColors.statusPending,
      _ => AppColors.primary500,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}
