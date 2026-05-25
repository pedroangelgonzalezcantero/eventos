#!/bin/sh
# Convierte la URL de Render (postgres://) al formato de JDBC (jdbc:postgresql://)
# Render inyecta DATABASE_URL como: postgres://user:pass@host:port/dbname

if [ -n "$DATABASE_URL" ]; then
  # Si empieza por "postgres://" lo convierte a "jdbc:postgresql://"
  export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|^postgres://|jdbc:postgresql://|')
  echo "DATABASE_URL configurada: ${DATABASE_URL%%@*}@..."
else
  echo "ERROR: La variable DATABASE_URL no está definida."
  exit 1
fi

exec java -jar app.jar

