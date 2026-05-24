# ============================================================
# Stage 1: Build con Maven
# ============================================================
FROM maven:3.8.8-eclipse-temurin-8 AS build

WORKDIR /app

# Copiar pom.xml primero para cachear dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copiar el código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests -q

# ============================================================
# Stage 2: Runtime ligero
# ============================================================
FROM eclipse-temurin:8-jre-alpine

WORKDIR /app

# Copiar el JAR generado
COPY --from=build /app/target/eventos-1.0.0.jar app.jar

# Exponer el puerto
EXPOSE 8080

# Arrancar con perfil de producción
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
