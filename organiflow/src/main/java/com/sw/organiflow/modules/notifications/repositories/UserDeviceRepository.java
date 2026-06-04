package com.sw.organiflow.modules.notifications.repositories;

import com.sw.organiflow.modules.notifications.models.UserDevice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDeviceRepository extends MongoRepository<UserDevice, String> {

    List<UserDevice> findByUserId(String userId);

    Optional<UserDevice> findByUserIdAndFcmToken(String userId, String fcmToken);

    void deleteByUserIdAndFcmToken(String userId, String fcmToken);

    void deleteByFcmToken(String fcmToken);
}
