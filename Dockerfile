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

# Copiar el JAR generado
COPY --from=build /app/target/eventos-1.0.0.jar app.jar

# Forzar perfil de producción siempre en el contenedor
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

# Convertir DATABASE_URL de formato postgres:// a jdbc:postgresql:// inline
# (evita problemas CRLF con scripts externos)
ENTRYPOINT ["sh", "-c", "DB=$(echo \"$DATABASE_URL\" | sed 's|^postgres://|jdbc:postgresql://|;s|^postgresql://|jdbc:postgresql://|'); export SPRING_DATASOURCE_URL=\"${DB}?sslmode=disable\"; echo \"=== DB: $SPRING_DATASOURCE_URL ===\"; exec java -Dspring.profiles.active=prod -jar app.jar"]
