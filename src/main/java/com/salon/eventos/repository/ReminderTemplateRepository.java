package com.salon.eventos.repository;

import com.salon.eventos.entity.ReminderTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderTemplateRepository extends JpaRepository<ReminderTemplate, Long> {
    List<ReminderTemplate> findByActiveTrueOrderByDaysBeforeEventDesc();
    List<ReminderTemplate> findByCategoryAndActiveTrue(String category);
}

