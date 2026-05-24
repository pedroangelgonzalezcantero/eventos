package com.salon.eventos.repository;

import com.salon.eventos.entity.JobPosition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobPositionRepository extends JpaRepository<JobPosition, Long> {
    Optional<JobPosition> findByCode(String code);
    boolean existsByCode(String code);
    List<JobPosition> findAllByOrderBySortOrderAsc();
}

