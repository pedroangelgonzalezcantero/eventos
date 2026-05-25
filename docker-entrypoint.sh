#!/bin/sh
set -e

echo "=== Iniciando Salon de Celebraciones ==="
echo "    Perfil: ${SPRING_PROFILES_ACTIVE:-default}"

# Render puede dar la URL como postgres:// → convertir a jdbc:postgresql://
if [ -n "$DATABASE_URL" ]; then
  export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|jdbc:postgresql://|')
  echo "    DATABASE_URL: configurada correctamente"
else
  echo "    DATABASE_URL: no definida, usando valor por defecto de application.properties"
fi

echo "=== Arrancando Spring Boot ==="
exec java -jar app.jar
