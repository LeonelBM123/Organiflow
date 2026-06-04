import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/constants/storage_keys.dart';
import '../models/notification_model.dart';

abstract class NotificationsLocalDataSource {
  Future<void> cacheNotifications(List<NotificationModel> notifications);
  Future<List<NotificationModel>> getCachedNotifications();
}

class NotificationsLocalDataSourceImpl implements NotificationsLocalDataSource {
  NotificationsLocalDataSourceImpl({
    required SharedPreferences sharedPreferences,
  }) : _sharedPreferences = sharedPreferences;

  final SharedPreferences _sharedPreferences;

  @override
  Future<void> cacheNotifications(List<NotificationModel> notifications) async {
    final encoded = notifications
        .map((item) => jsonEncode(item.toJson()))
        .toList();
    await _sharedPreferences.setStringList(
      StorageKeys.notificationsCache,
      encoded,
    );
  }

  @override
  Future<List<NotificationModel>> getCachedNotifications() async {
    final raw =
        _sharedPreferences.getStringList(StorageKeys.notificationsCache) ?? [];
    return raw
        .map(
          (value) => NotificationModel.fromJson(
            jsonDecode(value) as Map<String, dynamic>,
          ),
        )
        .toList();
  }
}
