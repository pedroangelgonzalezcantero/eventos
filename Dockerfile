# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-8 AS build
WORKDIR /app

# Copiar pom y descargar dependencias (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar fuentes y compilar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:8-jre-alpine
WORKDIR /app

# Instalar bash/sh para el entrypoint script
RUN apk add --no-cache bash

# Copiar el JAR generado
COPY --from=build /app/target/eventos-1.0.0.jar app.jar
COPY docker-entrypoint.sh docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Forzar perfil de producción siempre en el contenedor
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
