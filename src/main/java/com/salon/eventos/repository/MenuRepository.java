package com.salon.eventos.repository;

import com.salon.eventos.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    List<Menu> findByEventId(Long eventId);
    Optional<Menu> findByEventIdAndSelectedTrue(Long eventId);
}

