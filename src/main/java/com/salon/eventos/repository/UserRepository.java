package com.salon.eventos.repository;

import com.salon.eventos.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByRole(String role);
    List<User> findByRoleNot(String role);
    long countByRole(String role);
}
