import 'package:equatable/equatable.dart';

enum NotificationType {
  taskAssigned('TASK_ASSIGNED', 'Nueva tarea asignada'),
  taskCompleted('TASK_COMPLETED', 'Tarea completada'),
  taskUpdated('TASK_UPDATED', 'Tarea actualizada'),
  taskOverdue('TASK_OVERDUE', 'Tarea vencida'),
  taskDueSoon('TASK_DUE_SOON', 'Tarea proxima a vencer'),
  executionStarted('EXECUTION_STARTED', 'Ejecucion iniciada'),
  executionCompleted('EXECUTION_COMPLETED', 'Ejecucion completada'),
  executionCanceled('EXECUTION_CANCELED', 'Ejecucion cancelada'),
  executionPaused('EXECUTION_PAUSED', 'Ejecucion pausada'),
  workflowPublished('WORKFLOW_PUBLISHED', 'Workflow publicado'),
  workflowUpdated('WORKFLOW_UPDATED', 'Workflow actualizado'),
  systemAlert('SYSTEM_ALERT', 'Alerta del sistema'),
  slaWarning('SLA_WARNING', 'Advertencia de SLA'),
  general('GENERAL', 'Notificacion general');

  const NotificationType(this.value, this.displayName);

  final String value;
  final String displayName;
}

enum NotificationPriority {
  low('LOW'),
  medium('MEDIUM'),
  high('HIGH'),
  urgent('URGENT');

  const NotificationPriority(this.value);

  final String value;
}

class NotificationEntity extends Equatable {
  const NotificationEntity({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    required this.isRead,
    required this.priority,
    this.entityType,
    this.entityId,
    this.metadata,
  });

  final String id;
  final String title;
  final String body;
  final NotificationType type;
  final DateTime createdAt;
  final bool isRead;
  final NotificationPriority priority;
  final String? entityType;
  final String? entityId;
  final Map<String, dynamic>? metadata;

  @override
  List<Object?> get props => [
    id,
    title,
    body,
    type,
    createdAt,
    isRead,
    priority,
    entityType,
    entityId,
    metadata,
  ];
}
