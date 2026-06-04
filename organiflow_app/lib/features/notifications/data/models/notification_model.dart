import '../../domain/entities/notification_entity.dart';

class NotificationModel extends NotificationEntity {
  const NotificationModel({
    required super.id,
    required super.title,
    required super.body,
    required super.type,
    required super.createdAt,
    required super.isRead,
    required super.priority,
    super.entityType,
    super.entityId,
    super.metadata,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      title: json['title'] as String,
      body: (json['message'] ?? json['body'] ?? '') as String,
      type: NotificationType.values.firstWhere(
        (value) => value.value == json['type'],
        orElse: () => NotificationType.general,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      isRead: (json['read'] ?? json['isRead'] ?? false) as bool,
      priority: NotificationPriority.values.firstWhere(
        (value) => value.value == json['priority'],
        orElse: () => NotificationPriority.medium,
      ),
      entityType: json['entityType'] as String?,
      entityId: json['entityId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'body': body,
    'type': type.value,
    'createdAt': createdAt.toIso8601String(),
    'read': isRead,
    'priority': priority.value,
    'entityType': entityType,
    'entityId': entityId,
    'metadata': metadata,
  };

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      title: title,
      body: body,
      type: type,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
      priority: priority,
      entityType: entityType,
      entityId: entityId,
      metadata: metadata,
    );
  }
}
