package com.sw.organiflow.modules.notifications.services;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    //Método para enviar a un celular específico
    public void sendPushNotificationToDevice(String fcmToken, String title, String body) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(notification)
                    // Puedes mandar data invisible para que la app móvil abra una pantalla específica
                    .putData("ruta", "/aprobaciones/pendientes")
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Notificación enviada con éxito: {}", response);

        } catch (Exception e) {
            log.error("Error al enviar notificación push", e);
            // Aquí puedes manejar si el token ya expiró o el usuario desinstaló la app
        }
    }
}