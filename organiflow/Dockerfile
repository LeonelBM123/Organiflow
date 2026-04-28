# 1. Usamos una imagen oficial ligera de Java 21
FROM eclipse-temurin:21-jdk-alpine

# 2. Creamos un directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos el archivo JAR compilado desde tu carpeta 'target' al contenedor
COPY target/organiflow-0.0.1-SNAPSHOT.jar app.jar

# 4. Exponemos el puerto 8080 (el puerto por defecto de Spring Boot)
EXPOSE 8080

# 5. Comando para ejecutar tu backend cuando el contenedor inicie
ENTRYPOINT ["java", "-jar", "app.jar"]