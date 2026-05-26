package com.salon.eventos.repository;

import com.salon.eventos.entity.Rango;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RangoRepository extends JpaRepository<Rango, Long> {

    List<Rango> findByEventoIdOrderByMesaAscCreatedAtAsc(Long eventoId);

    void deleteByEventoIdAndId(Long eventoId, Long id);

    boolean existsByEventoIdAndId(Long eventoId, Long id);
}

