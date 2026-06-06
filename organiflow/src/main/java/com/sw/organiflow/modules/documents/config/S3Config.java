package com.sw.organiflow.modules.documents.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Beans de cliente S3 (AWS SDK v2). Soporta tanto AWS S3 real como S3-compatible (MinIO)
 * mediante {@code app.s3.endpoint} + {@code app.s3.path-style-access}.
 *
 * <p>Si no se proveen access-key/secret-key, cae al {@link DefaultCredentialsProvider}
 * (variables de entorno AWS estandar, perfil, rol de instancia, etc.).</p>
 */
@Configuration
public class S3Config {

    @Value("${app.s3.region:us-east-1}")
    private String region;

    @Value("${app.s3.access-key:}")
    private String accessKey;

    @Value("${app.s3.secret-key:}")
    private String secretKey;

    @Value("${app.s3.endpoint:}")
    private String endpoint;

    @Value("${app.s3.path-style-access:false}")
    private boolean pathStyleAccess;

    private AwsCredentialsProvider credentialsProvider() {
        if (accessKey != null && !accessKey.isBlank() && secretKey != null && !secretKey.isBlank()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        }
        return DefaultCredentialsProvider.create();
    }

    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider());

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(pathStyleAccess)
                            .build());
        }
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider());

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint))
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(pathStyleAccess)
                            .build());
        }
        return builder.build();
    }
}
