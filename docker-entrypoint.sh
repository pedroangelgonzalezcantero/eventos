#!/bin/sh
set -e

echo '=== Iniciando Salon de Celebraciones ==='

# Render da DATABASE_URL como postgres:// -> convertir a jdbc:postgresql://
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|jdbc:postgresql://|; s|^postgresql://|jdbc:postgresql://|')
  echo "    DATABASE_URL configurada: $(echo "$DATABASE_URL" | sed 's|//[^@]*@|//***@|')"
else
  echo '    ERROR: DATABASE_URL no esta definida'
  exit 1
fi

echo '=== Arrancando Spring Boot (perfil: prod) ==='
exec java "-Dspring.profiles.active=prod" "-jar" app.jar "--spring.datasource.url=$DATABASE_URL"