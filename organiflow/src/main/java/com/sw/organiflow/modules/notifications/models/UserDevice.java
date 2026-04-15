package com.sw.organiflow.modules.notifications.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document(collection = "user_devices")
@Getter
@Setter
@Builder
public class UserDevice {
    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;

    private String fcmToken; // El token que te manda el celular
    private String deviceType; // "WEB", "ANDROID", "IOS"
}