import 'package:flutter/material.dart';

import '../../../../core/utils/date_utils.dart';
import '../../../../design/theme/app_colors.dart';
import '../../domain/entities/notification_entity.dart';

class NotificationItem extends StatelessWidget {
  const NotificationItem({super.key, required this.notification, this.onTap});

  final NotificationEntity notification;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: notification.isRead
              ? AppColors.surface3Light
              : AppColors.primary100,
          child: Icon(_iconFor(notification.type), color: AppColors.primary500),
        ),
        title: Text(notification.title),
        subtitle: Text(
          '${notification.body}\n${OFDateUtils.relative(notification.createdAt)}',
        ),
        isThreeLine: true,
        trailing: notification.isRead
            ? null
            : const Icon(
                Icons.brightness_1,
                size: 10,
                color: AppColors.primary500,
              ),
      ),
    );
  }

  IconData _iconFor(NotificationType type) {
    switch (type) {
      case NotificationType.taskAssigned:
        return Icons.assignment_ind_outlined;
      case NotificationType.taskCompleted:
        return Icons.task_alt_outlined;
      case NotificationType.taskUpdated:
        return Icons.update_outlined;
      case NotificationType.taskOverdue:
        return Icons.warning_amber_outlined;
      case NotificationType.taskDueSoon:
        return Icons.alarm_outlined;
      case NotificationType.executionStarted:
        return Icons.play_circle_outline;
      case NotificationType.executionCompleted:
        return Icons.check_circle_outline;
      case NotificationType.executionCanceled:
        return Icons.cancel_outlined;
      case NotificationType.executionPaused:
        return Icons.pause_circle_outline;
      case NotificationType.workflowPublished:
        return Icons.publish_outlined;
      case NotificationType.workflowUpdated:
        return Icons.account_tree_outlined;
      case NotificationType.systemAlert:
        return Icons.campaign_outlined;
      case NotificationType.slaWarning:
        return Icons.timer_outlined;
      case NotificationType.general:
        return Icons.notifications_none_outlined;
    }
  }
}
