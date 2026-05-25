#!/bin/sh
set -e

echo "=== Iniciando Salon de Celebraciones ==="

# Render proporciona DATABASE_URL como postgres:// → convertir a jdbc:postgresql://
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|jdbc:postgresql://|')
  echo "    DATABASE_URL: configurada"
else
  echo "    AVISO: DATABASE_URL no definida, usando fallback localhost"
fi

echo "=== Arrancando Spring Boot (perfil: prod) ==="

# Pasar el perfil y la URL directamente como argumentos JVM para garantizar que se usan
exec java \
  -Dspring.profiles.active=prod \
  -Dspring.datasource.url="${DATABASE_URL:-jdbc:postgresql://localhost:5432/eventosdb}" \
  -jar app.jar
