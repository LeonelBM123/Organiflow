package com.sw.organiflow.modules.documents.services;

import com.sw.organiflow.modules.documents.models.DocumentScope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Abstraccion sobre AWS S3 (SDK v2) para los documentos de Organiflow.
 *
 * <p>Construye las claves de objeto con una estructura centrada en el cliente, segun lo
 * solicitado:</p>
 * <pre>
 *   RUNTIME : {clienteSlug}/executions/{yyyy}/{MM}/{dd}/{executionId}/{docId}/v{n}/{archivo}
 *   TEMPLATE: {clienteSlug}/templates/{workflowId}/{docId}/v{n}/{archivo}
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Value("${app.s3.presign-expiration-seconds:900}")
    private long presignExpirationSeconds;

    private static final DateTimeFormatter YEAR = DateTimeFormatter.ofPattern("yyyy");
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MM");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd");

    // ----------------------------------------------------------------
    // Construccion de claves
    // ----------------------------------------------------------------

    /**
     * Construye la clave S3 de un documento.
     *
     * @param clienteSlug slug del tenant (empresa/cliente)
     * @param scope       TEMPLATE o RUNTIME
     * @param workflowId  workflow (plantillas)
     * @param executionId ejecucion (runtime)
     * @param documentId  id del documento
     * @param version     numero de version (>=1)
     * @param originalName nombre original del archivo (se sanea)
     */
    public String buildKey(String clienteSlug, DocumentScope scope, String workflowId,
                           String executionId, String documentId, int version, String originalName) {
        String safeName = sanitizeFileName(originalName);
        String slug = sanitizeSegment(clienteSlug);
        if (scope == DocumentScope.RUNTIME) {
            LocalDate now = LocalDate.now();
            return "%s/executions/%s/%s/%s/%s/%s/v%d/%s".formatted(
                    slug,
                    now.format(YEAR), now.format(MONTH), now.format(DAY),
                    executionId, documentId, version, safeName);
        }
        return "%s/templates/%s/%s/v%d/%s".formatted(
                slug, workflowId, documentId, version, safeName);
    }

    // ----------------------------------------------------------------
    // Presigned URLs (subida/descarga directa desde el navegador)
    // ----------------------------------------------------------------

    /** URL prefirmada para subir (PUT) directo a S3 con el content-type indicado. */
    public String presignPut(String key, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(builder -> builder
                .signatureDuration(Duration.ofSeconds(presignExpirationSeconds))
                .putObjectRequest(putRequest));

        return presigned.url().toString();
    }

    /** URL prefirmada para descargar/visualizar (GET) directo desde S3. */
    public String presignGet(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(builder -> builder
                .signatureDuration(Duration.ofSeconds(presignExpirationSeconds))
                .getObjectRequest(getRequest));

        return presigned.url().toString();
    }

    // ----------------------------------------------------------------
    // Operaciones server-side (usadas por la co-edicion en fase 2)
    // ----------------------------------------------------------------

    public void putBytes(String key, byte[] content, String contentType) {
        s3Client.putObject(PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(content));
    }

    /** Descarga el objeto completo a memoria (usado por el proxy de descarga para OnlyOffice). */
    public byte[] downloadBytes(String key) {
        return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build()).asByteArray();
    }

    public void delete(String key) {
        if (key == null || key.isBlank()) return;
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            log.warn("No se pudo eliminar el objeto S3 {}: {}", key, e.getMessage());
        }
    }

    /** Devuelve el tamano en bytes del objeto si existe (tras una subida confirmada). */
    public Optional<Long> headSizeBytes(String key) {
        try {
            HeadObjectResponse head = s3Client.headObject(
                    HeadObjectRequest.builder().bucket(bucket).key(key).build());
            return Optional.of(head.contentLength());
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (Exception e) {
            log.warn("headObject fallo para {}: {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    // ----------------------------------------------------------------
    // Saneamiento
    // ----------------------------------------------------------------

    private String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "archivo";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "");
        // Conserva extension y caracteres seguros
        String cleaned = normalized.replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned.length() > 180 ? cleaned.substring(cleaned.length() - 180) : cleaned;
    }

    private String sanitizeSegment(String segment) {
        if (segment == null || segment.isBlank()) return "cliente";
        String normalized = Normalizer.normalize(segment, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase().replaceAll("[^a-z0-9-]", "-").replaceAll("-+", "-");
    }
}
