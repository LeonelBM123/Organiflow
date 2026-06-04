package com.sw.organiflow.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Value("${app.firebase.credentials:firebase-adminsdk.json}")
    private String firebaseCredentialsPath;

    @PostConstruct
    public void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                Resource credentialsResource = resolveCredentialsResource();
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(
                                credentialsResource.getInputStream()))
                        .build();
                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error inicializando Firebase", e);
        }
    }

    private Resource resolveCredentialsResource() {
        Resource fileSystemResource = new FileSystemResource(firebaseCredentialsPath);
        if (fileSystemResource.exists()) {
            return fileSystemResource;
        }
        return new ClassPathResource(firebaseCredentialsPath);
    }
}
