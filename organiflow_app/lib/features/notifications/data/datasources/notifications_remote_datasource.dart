import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/notification_model.dart';

abstract class NotificationsRemoteDataSource {
  Future<List<NotificationModel>> getNotifications();
  Future<int> getUnreadCount();
  Future<void> markAsRead(String id);
  Future<void> sendPushToken(String token);
}

class NotificationsRemoteDataSourceImpl
    implements NotificationsRemoteDataSource {
  NotificationsRemoteDataSourceImpl({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<List<NotificationModel>> getNotifications() async {
    final response = await _apiClient.get(
      ApiConstants.notifications,
      queryParameters: {'limit': 50},
    );
    final payload = response.data;
    final items = switch (payload) {
      final List<dynamic> list => list,
      final Map<String, dynamic> map =>
        (map['notifications'] ??
                map['items'] ??
                map['data'] ??
                const <dynamic>[])
            as List<dynamic>,
      _ => const <dynamic>[],
    };
    return items
        .map((item) => NotificationModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<int> getUnreadCount() async {
    final response = await _apiClient.get('${ApiConstants.notifications}/count');
    final data = response.data as Map<String, dynamic>;
    return (data['count'] as num?)?.toInt() ?? 0;
  }

  @override
  Future<void> markAsRead(String id) async {
    await _apiClient.put('${ApiConstants.notifications}/$id/read');
  }

  @override
  Future<void> sendPushToken(String token) async {
    await _apiClient.post(
      ApiConstants.deviceRegistration,
      data: {'fcmToken': token, 'deviceType': 'ANDROID'},
    );
  }
}
