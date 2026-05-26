package com.salon.eventos.repository;

import com.salon.eventos.entity.InteractiveFloorPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InteractiveFloorPlanRepository extends JpaRepository<InteractiveFloorPlan, Long> {
    Optional<InteractiveFloorPlan> findByEventId(Long eventId);
    void deleteByEventId(Long eventId);
    boolean existsByEventId(Long eventId);
}

