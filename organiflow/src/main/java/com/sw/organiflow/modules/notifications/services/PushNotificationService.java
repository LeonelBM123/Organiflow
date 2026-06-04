package com.sw.organiflow.modules.notifications.services;

import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.sw.organiflow.modules.notifications.repositories.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private final UserDeviceRepository userDeviceRepository;

    public void sendPushNotificationToDevice(String fcmToken, String title, String body) {
        sendPushNotificationToDevice(fcmToken, title, body, Map.of());
    }

    public void sendPushNotificationToDevice(String fcmToken, String title, String body, Map<String, Object> data) {
        try {
            Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

            Message.Builder messageBuilder = Message.builder()
                .setToken(fcmToken)
                .setNotification(notification);

            if (data != null) {
                data.forEach((key, value) -> {
                    if (key != null && value != null) {
                        messageBuilder.putData(key, String.valueOf(value));
                    }
                });
            }

            if (data == null || !data.containsKey("route")) {
                messageBuilder.putData("route", "/notifications");
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.info("Notificacion push enviada con exito: {}", response);
        } catch (FirebaseMessagingException e) {
            if (MessagingErrorCode.UNREGISTERED.equals(e.getMessagingErrorCode())) {
                log.warn("Token FCM invalido o expirado. Se eliminara del registro: {}", fcmToken);
                userDeviceRepository.deleteByFcmToken(fcmToken);
            }
            log.error("Error al enviar notificacion push", e);
        } catch (Exception e) {
            log.error("Error al enviar notificacion push", e);
        }
    }
}
