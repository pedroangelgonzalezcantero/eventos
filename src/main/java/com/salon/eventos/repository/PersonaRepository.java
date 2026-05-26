package com.salon.eventos.repository;

import com.salon.eventos.entity.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonaRepository extends JpaRepository<Persona, Long> {

    Optional<Persona> findByDniIgnoreCase(String dni);

    boolean existsByDniIgnoreCase(String dni);

    /** Búsqueda parcial por nombre o apellidos (ILIKE para insensibilidad a mayúsculas) */
    @Query(value =
        "SELECT * FROM personas " +
        "WHERE activo = true " +
        "  AND (" +
        "    LOWER(nombre)   LIKE LOWER(CONCAT('%', :q, '%')) " +
        "    OR LOWER(apellidos) LIKE LOWER(CONCAT('%', :q, '%')) " +
        "    OR LOWER(dni)       LIKE LOWER(CONCAT('%', :q, '%')) " +
        "    OR LOWER(CONCAT(nombre, ' ', apellidos)) LIKE LOWER(CONCAT('%', :q, '%')) " +
        "    OR LOWER(CONCAT(apellidos, ' ', nombre)) LIKE LOWER(CONCAT('%', :q, '%')) " +
        "  ) " +
        "ORDER BY apellidos, nombre " +
        "LIMIT 15",
        nativeQuery = true)
    List<Persona> searchByTexto(@Param("q") String q);

    List<Persona> findAllByOrderByApellidosAscNombreAsc();
}


