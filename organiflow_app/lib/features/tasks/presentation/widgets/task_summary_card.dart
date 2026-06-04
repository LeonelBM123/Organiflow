import 'package:flutter/material.dart';

import '../../../../core/utils/date_utils.dart';
import '../../../../design/components/buttons/of_button.dart';
import '../../../../design/theme/app_colors.dart';
import '../../domain/entities/task_entity.dart';

class TaskSummaryCard extends StatelessWidget {
  const TaskSummaryCard({
    super.key,
    required this.task,
    required this.isSubmitting,
    this.onOpen,
    this.onStart,
    this.onEscalate,
  });

  final TaskEntity task;
  final bool isSubmitting;
  final VoidCallback? onOpen;
  final VoidCallback? onStart;
  final VoidCallback? onEscalate;

  @override
  Widget build(BuildContext context) {
    final canStart = task.status == 'PENDING';
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
                    task.nodeName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary100,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(task.status),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Task ID: ${task.id}'),
            if (task.formSchema != null) ...[
              const SizedBox(height: 4),
              Text('Formulario: ${task.formSchema!.name}'),
            ],
            if (task.dueAt != null) ...[
              const SizedBox(height: 4),
              Text('Vence: ${OFDateUtils.relative(task.dueAt!)}'),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OFButton(
                    label: canStart ? 'Iniciar' : 'Abrir',
                    fullWidth: false,
                    isLoading: isSubmitting,
                    onPressed: canStart ? onStart : onOpen,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OFButton(
                    label: 'Escalar',
                    fullWidth: false,
                    variant: OFButtonVariant.outline,
                    onPressed: onEscalate,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
