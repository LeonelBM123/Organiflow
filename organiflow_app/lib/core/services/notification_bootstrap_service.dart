import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp();
  }
  await NotificationBootstrapService.showMessageAsNotification(message);
}

class NotificationBootstrapService {
  NotificationBootstrapService._();

  static const String _channelId = 'organiflow_notifications';
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  static final StreamController<Map<String, dynamic>> _foregroundMessages =
      StreamController<Map<String, dynamic>>.broadcast();
  static final StreamController<Map<String, dynamic>> _tapEvents =
      StreamController<Map<String, dynamic>>.broadcast();

  static Map<String, dynamic>? _pendingTapPayload;
  static bool _initialized = false;

  static Stream<Map<String, dynamic>> get foregroundMessages =>
      _foregroundMessages.stream;

  static Stream<Map<String, dynamic>> get tapEvents => _tapEvents.stream;

  static Future<void> initialize() async {
    if (kIsWeb || _initialized) {
      return;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
      case TargetPlatform.iOS:
        break;
      default:
        return;
    }

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await FirebaseMessaging.instance.requestPermission();

      const androidChannel = AndroidNotificationChannel(
        _channelId,
        'Organiflow Notifications',
        description: 'Canal principal de notificaciones de Organiflow',
        importance: Importance.high,
      );

      final androidNotifications = _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();

      await androidNotifications?.requestNotificationsPermission();
      await androidNotifications?.createNotificationChannel(androidChannel);

      await _localNotifications.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        ),
        onDidReceiveNotificationResponse: (response) {
          final payload = _decodePayload(response.payload);
          if (payload != null) {
            _tapEvents.add(payload);
          }
        },
      );

      FirebaseMessaging.onMessage.listen((message) async {
        final payload = _payloadFromMessage(message);
        _foregroundMessages.add(payload);
        await showMessageAsNotification(message, payload: payload);
      });

      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        _tapEvents.add(_payloadFromMessage(message));
      });

      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        _pendingTapPayload = _payloadFromMessage(initialMessage);
      }

      _initialized = true;
    } catch (_) {
      // Firebase can be unavailable during local development on unsupported platforms.
    }
  }

  static Future<String?> getPushToken() async {
    try {
      if (!_initialized) {
        await initialize();
      }
      return FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  static Map<String, dynamic>? consumePendingTapPayload() {
    final payload = _pendingTapPayload;
    _pendingTapPayload = null;
    return payload;
  }

  static Map<String, dynamic> _payloadFromMessage(RemoteMessage message) {
    return {
      ...message.data,
      if (_resolveTitle(message) != null) 'title': _resolveTitle(message),
      if (_resolveBody(message) != null) 'body': _resolveBody(message),
    };
  }

  static String? _resolveTitle(RemoteMessage message) {
    return message.notification?.title ??
        message.data['title'] as String? ??
        message.data['notificationTitle'] as String?;
  }

  static String? _resolveBody(RemoteMessage message) {
    return message.notification?.body ??
        message.data['body'] as String? ??
        message.data['message'] as String? ??
        message.data['notificationBody'] as String?;
  }

  static Map<String, dynamic>? _decodePayload(String? payload) {
    if (payload == null || payload.isEmpty) {
      return null;
    }

    final decoded = jsonDecode(payload);
    if (decoded is Map) {
      return decoded.map(
        (key, value) => MapEntry(key.toString(), value),
      );
    }
    return null;
  }

  static Future<void> showMessageAsNotification(
    RemoteMessage message, {
    Map<String, dynamic>? payload,
  }) async {
    if (!_initialized) {
      await _localNotifications.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        ),
        onDidReceiveNotificationResponse: (response) {
          final decodedPayload = _decodePayload(response.payload);
          if (decodedPayload != null) {
            _tapEvents.add(decodedPayload);
          }
        },
      );
    }

    final title = _resolveTitle(message);
    final body = _resolveBody(message);
    if ((title == null || title.isEmpty) && (body == null || body.isEmpty)) {
      return;
    }

    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channelId,
        'Organiflow Notifications',
        channelDescription: 'Canal principal de notificaciones de Organiflow',
        importance: Importance.max,
        priority: Priority.high,
      ),
    );

    await _localNotifications.show(
      message.messageId?.hashCode ?? message.hashCode,
      title,
      body,
      details,
      payload: jsonEncode(payload ?? _payloadFromMessage(message)),
    );
  }
}
