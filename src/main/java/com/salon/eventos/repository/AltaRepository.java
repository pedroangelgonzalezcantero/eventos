package com.salon.eventos.repository;

import com.salon.eventos.entity.Alta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AltaRepository extends JpaRepository<Alta, Long> {

    List<Alta> findByEventoId(Long eventoId);

    /**
     * Inserta un alta solo si no existe ya la combinación (evento_id, persona_id).
     * Usa la constraint UNIQUE de la tabla para el DO NOTHING.
     */
    @Modifying
    @Query(nativeQuery = true, value =
        "INSERT INTO altas (evento_id, persona_id, created_at) " +
        "VALUES (:eventoId, :personaId, NOW()) " +
        "ON CONFLICT (evento_id, persona_id) DO NOTHING")
    void insertOrIgnore(@Param("eventoId") Long eventoId, @Param("personaId") Long personaId);

    /** Altas cuyo evento cae en el rango de fechas indicado (para vista semanal/quincenal) */
    @Query("SELECT a FROM Alta a " +
           "JOIN FETCH a.evento e " +
           "JOIN FETCH a.persona p " +
           "WHERE e.eventDate BETWEEN :from AND :to " +
           "ORDER BY e.eventDate ASC, p.apellidos ASC, p.nombre ASC")
    List<Alta> findByEventoFechaRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT a FROM Alta a " +
           "JOIN FETCH a.evento e " +
           "JOIN FETCH a.persona p " +
           "WHERE e.id = :eventoId " +
           "ORDER BY p.apellidos ASC, p.nombre ASC")
    List<Alta> findByEventoIdFetch(@Param("eventoId") Long eventoId);
}

